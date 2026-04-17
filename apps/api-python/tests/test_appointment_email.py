"""Tests for the appointment email generation pipeline (Phase 3d)."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

import services.claude_emails  # noqa: F401
from prompts.appointment_email_prompt import (
    PROCESS_LABELS,
    build_appointment_email_system_prompt,
    get_known_process_types,
    parse_appointment_response,
)


# ---------------------------------------------------------------- prompt


SAMPLE_PROFILE = {
    "user_id": "user-uuid",
    "visa_type": "student",
    "bundesland": "DE-BY",
    "nationality": "Nigerian",
    "goal": "initial_setup",
    "full_name": "Anna Müller",
    "applicant_email": "anna.mueller@example.com",
    "applicant_phone": "+49 176 1234567",
}

SAMPLE_OFFICE = {
    "name": "Kreisverwaltungsreferat München",
    "email": "auslaenderbehoerde@muenchen.de",
    "requested_dates": ["2026-05-10", "2026-05-12"],
}


class TestAppointmentPrompt:
    def test_includes_process_label_in_german(self):
        prompt = build_appointment_email_system_prompt(
            "aufenthaltstitel", SAMPLE_PROFILE, SAMPLE_OFFICE,
        )
        assert "Erstausstellung eines Aufenthaltstitels" in prompt
        assert "Sehr geehrte Damen und Herren" in prompt
        assert "Sie-form" in prompt
        # JSON output contract must be present
        assert '"subject"' in prompt
        assert '"body"' in prompt

    def test_normalises_unknown_process_type_to_default(self):
        """Unknown keys fall through to the generic aufenthaltstitel template."""
        prompt = build_appointment_email_system_prompt(
            "completely_made_up", SAMPLE_PROFILE, SAMPLE_OFFICE,
        )
        # Prompt should still have a German process label
        assert any(
            label["de"] in prompt for label in PROCESS_LABELS.values()
        )

    def test_injects_applicant_and_office_details(self):
        prompt = build_appointment_email_system_prompt(
            "verlaengerung", SAMPLE_PROFILE, SAMPLE_OFFICE,
        )
        assert "Anna Müller" in prompt
        assert "anna.mueller@example.com" in prompt
        assert "Kreisverwaltungsreferat München" in prompt
        assert "2026-05-10" in prompt
        assert "2026-05-12" in prompt

    def test_bundesland_code_resolved_to_german_name(self):
        prompt = build_appointment_email_system_prompt(
            "anmeldung", {**SAMPLE_PROFILE, "bundesland": "DE-BW"}, {},
        )
        # German Bundesland name should appear — not the ISO code
        assert "Baden-Württemberg" in prompt

    def test_placeholder_when_applicant_missing(self):
        prompt = build_appointment_email_system_prompt(
            "aufenthaltstitel",
            {"visa_type": "student", "bundesland": "DE-BY"},
            {},
        )
        assert "[Name]" in prompt
        assert "[E-Mail]" in prompt

    def test_exposed_process_types_include_all_five(self):
        types = get_known_process_types()
        keys = {t["key"] for t in types}
        assert keys == {
            "aufenthaltstitel",
            "verlaengerung",
            "familienzusammenfuehrung",
            "anmeldung",
            "eat_abholung",
        }


# ---------------------------------------------------------------- parser


class TestParser:
    def test_parses_clean_json(self):
        raw = json.dumps({
            "subject": "Terminanfrage — Aufenthaltstitel",
            "body": "Sehr geehrte Damen und Herren,\n\n...\n\nMit freundlichen Grüßen,\nAnna",
        })
        parsed = parse_appointment_response(raw)
        assert parsed["subject"].startswith("Terminanfrage")
        assert "Sehr geehrte" in parsed["body"]

    def test_strips_markdown_fences(self):
        raw = '```json\n{"subject":"S","body":"B"}\n```'
        parsed = parse_appointment_response(raw)
        assert parsed["subject"] == "S"
        assert parsed["body"] == "B"

    def test_strips_surrounding_prose(self):
        raw = 'Here is the JSON:\n{"subject":"S","body":"B"}\nHope this helps!'
        parsed = parse_appointment_response(raw)
        assert parsed["subject"] == "S"

    def test_rejects_missing_body(self):
        raw = '{"subject":"S"}'
        with pytest.raises(ValueError, match="body"):
            parse_appointment_response(raw)

    def test_rejects_empty_subject(self):
        raw = '{"subject":"","body":"B"}'
        with pytest.raises(ValueError, match="subject"):
            parse_appointment_response(raw)


# ---------------------------------------------------------------- pipeline


def _mock_claude_message(json_payload: dict, input_tokens: int = 500, output_tokens: int = 300):
    block = MagicMock()
    block.type = "text"
    block.text = json.dumps(json_payload)
    msg = MagicMock()
    msg.content = [block]
    msg.usage.input_tokens = input_tokens
    msg.usage.output_tokens = output_tokens
    return msg


def _build_pipeline():
    with patch("services.claude_emails.create_client") as supabase_factory, \
         patch("services.claude_emails.Anthropic") as anthropic_factory:
        supabase_factory.return_value = MagicMock()
        anthropic_factory.return_value = MagicMock()
        pipeline = services.claude_emails.AppointmentEmailPipeline()
    return pipeline


class TestPipeline:
    def test_returns_parsed_response(self):
        pipeline = _build_pipeline()
        pipeline.supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()
        pipeline.anthropic.messages.create.return_value = _mock_claude_message({
            "subject": "Terminanfrage — Erstausstellung Aufenthaltstitel",
            "body": "Sehr geehrte Damen und Herren,\n\nhiermit möchte ich einen Termin vereinbaren.\n\nMit freundlichen Grüßen,\nAnna Müller\nanna@example.com",
        })

        result = pipeline.generate(
            process_type="aufenthaltstitel",
            user_profile=SAMPLE_PROFILE,
            office_details=SAMPLE_OFFICE,
        )
        assert "Terminanfrage" in result["subject"]
        assert "Sehr geehrte" in result["body"]
        assert "Mit freundlichen Grüßen" in result["body"]

    def test_audit_log_strips_pii(self):
        """Audit row must contain only process/profile metadata — never office email, applicant name, or email body."""
        pipeline = _build_pipeline()
        insert_mock = pipeline.supabase.table.return_value.insert
        insert_mock.return_value.execute.return_value = MagicMock()
        pipeline.anthropic.messages.create.return_value = _mock_claude_message({
            "subject": "S", "body": "B",
        })

        pipeline.generate(
            process_type="aufenthaltstitel",
            user_profile={
                **SAMPLE_PROFILE,
                "passport_number": "A12345678",
                "email": "user@example.com",
            },
            office_details=SAMPLE_OFFICE,
        )

        # Find the audit insert payload
        payload = None
        for call in insert_mock.call_args_list:
            args = call.args
            if args and isinstance(args[0], dict) and args[0].get("operation") == "appointment_email":
                payload = args[0]
                break
        assert payload is not None, "No appointment_email audit payload captured"

        allowed_keys = {"process_type", "visa_type", "bundesland", "goal"}
        assert set(payload["input_payload"].keys()) <= allowed_keys, (
            f"Unexpected keys in audit input_payload: "
            f"{set(payload['input_payload'].keys()) - allowed_keys}"
        )
        # Output payload only stores length summaries
        for v in payload["output_payload"].values():
            assert isinstance(v, int), (
                f"Audit output_payload should only hold numeric summaries: {payload['output_payload']!r}"
            )

    def test_cache_hit_skips_anthropic(self):
        pipeline = _build_pipeline()
        pipeline.supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()
        pipeline.anthropic.messages.create.return_value = _mock_claude_message({
            "subject": "S", "body": "B",
        })

        pipeline.generate("aufenthaltstitel", SAMPLE_PROFILE, SAMPLE_OFFICE)
        first_calls = pipeline.anthropic.messages.create.call_count

        # Same cache-key tuple → HIT
        pipeline.generate("aufenthaltstitel", SAMPLE_PROFILE, SAMPLE_OFFICE)
        assert pipeline.anthropic.messages.create.call_count == first_calls

    def test_different_requested_dates_miss_cache(self):
        pipeline = _build_pipeline()
        pipeline.supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()
        pipeline.anthropic.messages.create.return_value = _mock_claude_message({
            "subject": "S", "body": "B",
        })

        pipeline.generate("aufenthaltstitel", SAMPLE_PROFILE, {"requested_dates": ["2026-05-10"]})
        first_calls = pipeline.anthropic.messages.create.call_count
        pipeline.generate("aufenthaltstitel", SAMPLE_PROFILE, {"requested_dates": ["2026-06-01"]})
        # Different dates → different cache key → MISS
        assert pipeline.anthropic.messages.create.call_count == first_calls + 1

    def test_static_fallback_on_parse_failure(self):
        """Malformed LLM response still yields a copy-pasteable German email."""
        pipeline = _build_pipeline()
        pipeline.supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

        broken = MagicMock()
        broken.type = "text"
        broken.text = "I can't write German right now, sorry."
        msg = MagicMock()
        msg.content = [broken]
        msg.usage.input_tokens = 10
        msg.usage.output_tokens = 10
        pipeline.anthropic.messages.create.return_value = msg

        result = pipeline.generate("aufenthaltstitel", SAMPLE_PROFILE, SAMPLE_OFFICE)
        assert "Sehr geehrte" in result["body"]
        assert "Mit freundlichen Grüßen" in result["body"]
