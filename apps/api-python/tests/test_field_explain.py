"""Tests for the Form-Filling Guide field-explanation pipeline.

Mocks Supabase (form lookup + audit log write) and Anthropic (JSON response).
The conftest at tests/conftest.py already stubs env vars so imports succeed.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

# Imported so patch() can reach attributes via dotted names.
import services.claude_fields  # noqa: F401
from prompts.field_prompt import (
    build_field_explain_system_prompt,
    parse_field_response,
)


# ---------------------------------------------------------------- prompt

SAMPLE_FORM = {
    "form_code": "anmeldung_de_by",
    "name_en": "Address Registration (Bavaria)",
    "name_de": "Wohnsitzanmeldung (Bayern)",
    "bundeslaender": ["DE-BY"],
    "visa_types": ["student"],
}

SAMPLE_FIELD = {
    "field_id": "move_in_date",
    "label_en": "Date you moved into the new address",
    "label_de": "Einzugsdatum",
    "input_type": "date",
    "instructions_en": (
        "The actual date you moved in — NOT the date you're filling out this form. "
        "You must register within 14 days of this date."
    ),
    "common_mistakes": [
        "Using today's date instead of the actual move-in date",
        "Backdating to avoid the 14-day rule",
    ],
    "example_value": "2026-04-10",
    "required": True,
    "ai_can_explain": True,
}

SAMPLE_PROFILE = {
    "visa_type": "student",
    "bundesland": "DE-BY",
    "nationality": "Nigerian",
    "goal": "initial_setup",
    "user_id": "test-user-uuid",
}


class TestFieldPrompt:
    def test_includes_safety_rules(self):
        prompt = build_field_explain_system_prompt(
            SAMPLE_FORM, SAMPLE_FIELD, SAMPLE_PROFILE
        )
        # Safety-critical phrases must be present verbatim
        assert "Rechtsanwalt" in prompt
        assert "educational" in prompt.lower()
        assert "not legal advice" in prompt.lower()
        # Profile injected
        assert "student" in prompt
        assert "DE-BY" in prompt
        # Field data injected
        assert "move_in_date" in prompt
        assert "14 days" in prompt
        # Required structured-JSON schema
        assert '"explanation"' in prompt
        assert '"tips"' in prompt
        assert '"example"' in prompt

    def test_includes_common_mistakes_block(self):
        prompt = build_field_explain_system_prompt(
            SAMPLE_FORM, SAMPLE_FIELD, SAMPLE_PROFILE
        )
        for mistake in SAMPLE_FIELD["common_mistakes"]:
            assert mistake in prompt

    def test_handles_minimal_profile(self):
        """Missing optional profile fields render as placeholders, not errors."""
        prompt = build_field_explain_system_prompt(
            SAMPLE_FORM, SAMPLE_FIELD, {}
        )
        assert "unknown visa type" in prompt
        assert "unspecified state" in prompt


# ---------------------------------------------------------------- parser


class TestResponseParser:
    def test_parses_clean_json(self):
        raw = json.dumps({
            "explanation": "Enter the date you moved in.",
            "tips": ["Check your rental contract", "Use DD.MM.YYYY on paper"],
            "example": "2026-04-10",
        })
        parsed = parse_field_response(raw)
        assert parsed["explanation"].startswith("Enter the date")
        assert len(parsed["tips"]) == 2
        assert parsed["example"] == "2026-04-10"

    def test_strips_markdown_fences(self):
        raw = '```json\n{"explanation": "Test", "tips": [], "example": "e"}\n```'
        parsed = parse_field_response(raw)
        assert parsed["explanation"] == "Test"

    def test_strips_surrounding_prose(self):
        """Claude sometimes adds 'Here is the JSON:' before the object."""
        raw = (
            'Here is the JSON:\n'
            '{"explanation": "X", "tips": ["y"], "example": "z"}\n'
            'Hope that helps!'
        )
        parsed = parse_field_response(raw)
        assert parsed["explanation"] == "X"
        assert parsed["tips"] == ["y"]

    def test_rejects_missing_keys(self):
        raw = '{"explanation": "X"}'
        with pytest.raises(ValueError, match="tips"):
            parse_field_response(raw)

    def test_rejects_non_list_tips(self):
        raw = '{"explanation": "X", "tips": "not a list", "example": "e"}'
        with pytest.raises(ValueError, match="tips"):
            parse_field_response(raw)

    def test_rejects_empty_explanation(self):
        raw = '{"explanation": "", "tips": [], "example": "e"}'
        with pytest.raises(ValueError, match="explanation"):
            parse_field_response(raw)


# ---------------------------------------------------------------- pipeline


def _mock_claude_response(json_payload: dict, input_tokens: int = 200, output_tokens: int = 80):
    """Build a stand-in for the Anthropic client response object."""
    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = json.dumps(json_payload)

    message = MagicMock()
    message.content = [text_block]
    message.usage.input_tokens = input_tokens
    message.usage.output_tokens = output_tokens
    return message


def _build_pipeline():
    """Instantiate a FieldExplainPipeline with both external clients stubbed."""
    with patch("services.claude_fields.create_client") as supabase_factory, \
         patch("services.claude_fields.Anthropic") as anthropic_factory:
        supabase_factory.return_value = MagicMock()
        anthropic_factory.return_value = MagicMock()
        pipeline = services.claude_fields.FieldExplainPipeline()
    return pipeline


class TestExplainPipeline:
    def test_returns_parsed_claude_response(self):
        pipeline = _build_pipeline()

        # Mock form lookup
        form_select = pipeline.supabase.table.return_value.select.return_value
        form_select.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={**SAMPLE_FORM, "fields": [SAMPLE_FIELD]}
        )
        # Mock audit insert
        pipeline.supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

        pipeline.anthropic.messages.create.return_value = _mock_claude_response({
            "explanation": "Enter your actual move-in date.",
            "tips": ["Check your rental contract", "Use the 14-day rule"],
            "example": "2026-04-10",
        })

        result = pipeline.explain(
            form_code="anmeldung_de_by",
            field_id="move_in_date",
            user_context=SAMPLE_PROFILE,
        )

        assert result["explanation"].startswith("Enter your actual")
        assert len(result["tips"]) == 2
        assert result["example"] == "2026-04-10"

    def test_raises_on_unknown_form(self):
        pipeline = _build_pipeline()
        form_select = pipeline.supabase.table.return_value.select.return_value
        form_select.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(data=None)

        with pytest.raises(services.claude_fields.FieldNotFoundError):
            pipeline.explain(
                form_code="no_such_form",
                field_id="any",
                user_context=SAMPLE_PROFILE,
            )

    def test_raises_on_unknown_field(self):
        pipeline = _build_pipeline()
        form_select = pipeline.supabase.table.return_value.select.return_value
        form_select.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={**SAMPLE_FORM, "fields": [SAMPLE_FIELD]}
        )

        with pytest.raises(services.claude_fields.FieldNotFoundError, match="nonexistent"):
            pipeline.explain(
                form_code="anmeldung_de_by",
                field_id="nonexistent",
                user_context=SAMPLE_PROFILE,
            )

    def test_audit_log_strips_pii(self):
        """Audit row must contain only profile metadata, never form values or user names."""
        pipeline = _build_pipeline()

        form_select = pipeline.supabase.table.return_value.select.return_value
        form_select.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={**SAMPLE_FORM, "fields": [SAMPLE_FIELD]}
        )

        insert_mock = pipeline.supabase.table.return_value.insert
        insert_mock.return_value.execute.return_value = MagicMock()

        pipeline.anthropic.messages.create.return_value = _mock_claude_response({
            "explanation": "X",
            "tips": ["y"],
            "example": "z",
        })

        pipeline.explain(
            form_code="anmeldung_de_by",
            field_id="move_in_date",
            user_context={
                **SAMPLE_PROFILE,
                # NOTE — hypothetical PII that must NOT leak into the log.
                "email": "user@example.com",
                "full_name": "Anna Maria Müller",
                "passport_number": "A12345678",
            },
        )

        # Find the audit insert call. The pipeline uses several
        # supabase.table().insert() / select() chains, so we look for
        # the one that targeted "ai_generation_logs".
        audit_call = None
        for call in pipeline.supabase.table.call_args_list:
            if call.args and call.args[0] == "ai_generation_logs":
                # The very next insert(...) call is the one we want
                audit_call = call
                break
        assert audit_call is not None, "ai_generation_logs insert not called"

        # Inspect the insert payload
        payload = None
        for call in insert_mock.call_args_list:
            if call.args and isinstance(call.args[0], dict) and call.args[0].get("operation") == "explain_field":
                payload = call.args[0]
                break
        assert payload is not None, "No explain_field audit payload captured"

        # Allowlist — these keys may appear
        allowed_keys = {"form_code", "field_id", "visa_type", "bundesland", "goal"}
        input_payload = payload["input_payload"]
        assert set(input_payload.keys()) <= allowed_keys, (
            f"Unexpected keys in audit input_payload: "
            f"{set(input_payload.keys()) - allowed_keys}"
        )
        # Output payload must only contain length/count summaries — never raw content
        output_payload = payload["output_payload"]
        for v in output_payload.values():
            assert isinstance(v, int), (
                f"Audit output_payload should only hold numeric summaries, got {output_payload!r}"
            )

    def test_cache_hit_skips_anthropic(self):
        """Second identical call must not invoke Anthropic again."""
        pipeline = _build_pipeline()

        form_select = pipeline.supabase.table.return_value.select.return_value
        form_select.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={**SAMPLE_FORM, "fields": [SAMPLE_FIELD]}
        )
        pipeline.supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()
        pipeline.anthropic.messages.create.return_value = _mock_claude_response({
            "explanation": "X", "tips": ["y"], "example": "z",
        })

        pipeline.explain("anmeldung_de_by", "move_in_date", SAMPLE_PROFILE)
        first_calls = pipeline.anthropic.messages.create.call_count

        # Same key → cache hit
        pipeline.explain("anmeldung_de_by", "move_in_date", SAMPLE_PROFILE)
        second_calls = pipeline.anthropic.messages.create.call_count
        assert second_calls == first_calls, "Cache miss on identical (form, field, profile)"

    def test_static_fallback_on_parse_failure(self):
        """Claude returning malformed JSON falls back to field's static content."""
        pipeline = _build_pipeline()

        form_select = pipeline.supabase.table.return_value.select.return_value
        form_select.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
            data={**SAMPLE_FORM, "fields": [SAMPLE_FIELD]}
        )
        pipeline.supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

        # Broken response (not JSON at all)
        broken_block = MagicMock()
        broken_block.type = "text"
        broken_block.text = "I'm sorry, I can't structure this."
        msg = MagicMock()
        msg.content = [broken_block]
        msg.usage.input_tokens = 10
        msg.usage.output_tokens = 10
        pipeline.anthropic.messages.create.return_value = msg

        result = pipeline.explain("anmeldung_de_by", "move_in_date", SAMPLE_PROFILE)
        # Falls back to the field's static content
        assert result["explanation"] == SAMPLE_FIELD["instructions_en"]
        assert result["tips"] == SAMPLE_FIELD["common_mistakes"]
        assert result["example"] == SAMPLE_FIELD["example_value"]
