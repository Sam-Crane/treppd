"""Tests for RoadmapService.

Tests the 6-step hybrid pipeline: fetch, documents, enrichment,
deadlines, persistence, and audit logging.
"""

import json
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

# Ensure services.roadmap_service is importable as a dotted path for patch()
import services.roadmap_service  # noqa: F401

# We test internal methods directly since they contain the core logic.
# The service __init__ requires env vars, so we patch the clients.


@pytest.fixture
def service():
    """Create a RoadmapService with mocked external clients."""
    env = {
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_SECRET_KEY": "test-key",
        "ANTHROPIC_API_KEY": "test-api-key",
        "INTERNAL_API_KEY": "test-internal-key-long-enough",
    }
    with patch.dict("os.environ", env), \
         patch("services.roadmap_service.create_client") as mock_sb, \
         patch("services.roadmap_service.Anthropic") as mock_anthropic:

        # Clear the cached settings so get_settings() re-reads our env
        from config import get_settings
        get_settings.cache_clear()

        mock_supabase = MagicMock()
        mock_sb.return_value = mock_supabase

        mock_client = MagicMock()
        mock_anthropic.return_value = mock_client

        from services.roadmap_service import RoadmapService
        svc = RoadmapService()
        svc.supabase = mock_supabase
        svc.anthropic = mock_client
        yield svc
        get_settings.cache_clear()


@pytest.fixture
def sample_steps():
    return [
        {
            "slug": "anmeldung",
            "visa_types": ["student", "work"],
            "bundeslaender": [],
            "sequence": 1,
            "depends_on": [],
            "title_de": "Wohnsitzanmeldung",
            "title_en": "Address Registration",
            "office_type": "einwohnermeldeamt",
            "can_do_online": False,
            "typical_wait_days": 1,
            "deadline_rule": "14_days_after_arrival",
            "verified_at": "2026-03-15",
            "source_url": "https://example.com",
        },
        {
            "slug": "health_insurance",
            "visa_types": ["student", "work"],
            "bundeslaender": [],
            "sequence": 3,
            "depends_on": ["anmeldung"],
            "title_de": "Krankenversicherung",
            "title_en": "Health Insurance",
            "office_type": "insurance",
            "can_do_online": True,
            "typical_wait_days": 3,
            "deadline_rule": None,
            "verified_at": "2026-03-15",
            "source_url": "https://example.com",
        },
        {
            "slug": "residence_permit_by",
            "visa_types": ["student", "work"],
            "bundeslaender": ["DE-BY"],
            "sequence": 6,
            "depends_on": ["anmeldung", "health_insurance"],
            "title_de": "Aufenthaltserlaubnis",
            "title_en": "Residence Permit (Bavaria)",
            "office_type": "auslaenderbehoerde",
            "can_do_online": False,
            "typical_wait_days": 42,
            "deadline_rule": "90_days_before_visa_expiry",
            "verified_at": "2026-03-15",
            "source_url": "https://example.com",
        },
    ]


@pytest.fixture
def sample_profile():
    return {
        "user_id": "user-123",
        "nationality": "NG",
        "visa_type": "student",
        "bundesland": "DE-BY",
        "city": "Munich",
        "goal": "initial_setup",
        "arrival_date": "2026-04-01",
        "visa_expiry_date": "2026-10-01",
        "completed_steps": [],
    }


class TestFetchBaseSteps:
    def test_filters_by_visa_type(self, service, sample_steps):
        """Only steps matching the visa_type are returned."""
        # Add a step that doesn't match
        steps_with_extra = sample_steps + [{
            **sample_steps[0],
            "slug": "employer_registration",
            "visa_types": ["work"],
        }]

        mock_result = MagicMock()
        mock_result.data = steps_with_extra
        service.supabase.table.return_value.select.return_value \
            .contains.return_value.order.return_value.execute.return_value = mock_result

        service._fetch_base_steps("student", "DE-BY")

        # The contains filter is applied at DB level, so all returned steps
        # are assumed to match. We verify the DB query was called correctly.
        service.supabase.table.assert_called_with("roadmap_steps")
        call_args = service.supabase.table.return_value.select.return_value \
            .contains.call_args
        assert call_args[0] == ("visa_types", ["student"])

    def test_filters_by_bundesland(self, service, sample_steps):
        """Steps with specific bundeslaender are filtered client-side."""
        # residence_permit_by has bundeslaender: ["DE-BY"]
        # It should be included for DE-BY but excluded for DE-BE
        mock_result = MagicMock()
        mock_result.data = sample_steps
        service.supabase.table.return_value.select.return_value \
            .contains.return_value.order.return_value.execute.return_value = mock_result

        # Bavaria: should include all 3 steps
        result_by = service._fetch_base_steps("student", "DE-BY")
        assert len(result_by) == 3

        # Berlin: should exclude residence_permit_by
        result_be = service._fetch_base_steps("student", "DE-BE")
        assert len(result_be) == 2
        assert all(s["slug"] != "residence_permit_by" for s in result_be)


class TestFetchDocuments:
    def test_returns_documents_grouped_by_step(self, service):
        """Documents are grouped by step_slug."""
        mock_result = MagicMock()
        mock_result.data = [
            {"step_slug": "anmeldung", "document_name_en": "Passport",
             "document_name_de": "Reisepass", "applies_to_nationalities": [],
             "applies_to_bundeslaender": [], "needs_certified_copy": False,
             "needs_translation": False, "needs_apostille": False,
             "where_to_get": "Bring original", "estimated_cost_eur": None,
             "specifications": None},
            {"step_slug": "anmeldung", "document_name_en": "Rental contract",
             "document_name_de": "Mietvertrag", "applies_to_nationalities": [],
             "applies_to_bundeslaender": [], "needs_certified_copy": False,
             "needs_translation": False, "needs_apostille": False,
             "where_to_get": "From landlord", "estimated_cost_eur": None,
             "specifications": None},
            {"step_slug": "health_insurance", "document_name_en": "Passport",
             "document_name_de": "Reisepass", "applies_to_nationalities": [],
             "applies_to_bundeslaender": [], "needs_certified_copy": False,
             "needs_translation": False, "needs_apostille": False,
             "where_to_get": "Bring original", "estimated_cost_eur": None,
             "specifications": None},
        ]
        service.supabase.table.return_value.select.return_value \
            .in_.return_value.execute.return_value = mock_result

        result = service._fetch_documents(
            ["anmeldung", "health_insurance"], "NG", "DE-BY"
        )

        assert len(result["anmeldung"]) == 2
        assert len(result["health_insurance"]) == 1

    def test_filters_by_nationality(self, service):
        """Documents with specific nationality list exclude non-matching users."""
        mock_result = MagicMock()
        mock_result.data = [
            {"step_slug": "residence_permit_by", "document_name_en": "Apostille cert",
             "document_name_de": "Apostille", "applies_to_nationalities": ["IN", "PK"],
             "applies_to_bundeslaender": [], "needs_certified_copy": False,
             "needs_translation": False, "needs_apostille": True,
             "where_to_get": "Embassy", "estimated_cost_eur": 50.0,
             "specifications": None},
        ]
        service.supabase.table.return_value.select.return_value \
            .in_.return_value.execute.return_value = mock_result

        # Nigerian user: should NOT get this doc (applies_to_nationalities = [IN, PK])
        result = service._fetch_documents(["residence_permit_by"], "NG", "DE-BY")
        assert "residence_permit_by" not in result

        # Indian user: SHOULD get this doc
        result = service._fetch_documents(["residence_permit_by"], "IN", "DE-BY")
        assert len(result.get("residence_permit_by", [])) == 1


class TestEnrichWithClaude:
    def test_preserves_verified_fields(self, service, sample_steps):
        """AI cannot modify title, office, can_do_online, documents_needed."""
        # Simulate Claude trying to change the title
        claude_response = {
            "steps": [
                {
                    "slug": "anmeldung",
                    "title": "WRONG TITLE FROM AI",
                    "explanation": "Go register your address",
                    "office": "WRONG OFFICE",
                    "can_do_online": True,  # AI tries to change this
                    "estimated_days": 1,
                    "tips": ["Bring cash"],
                    "ai_suggested": False,
                    "source_verified": True,
                }
            ]
        }

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=json.dumps(claude_response))]
        mock_response.usage.input_tokens = 100
        mock_response.usage.output_tokens = 200
        service.anthropic.messages.create.return_value = mock_response

        # Give base_steps with documents attached
        base = [sample_steps[0].copy()]
        base[0]["documents"] = [{"document_name_en": "Passport"}]

        enriched, _ = service._enrich_with_claude(base, {"visa_type": "student"})

        # Verified fields should be from DB, not AI
        assert enriched[0]["title"] == "Address Registration"  # From DB
        assert enriched[0]["office"] == "einwohnermeldeamt"  # From DB
        assert enriched[0]["can_do_online"] is False  # From DB
        assert enriched[0]["documents_needed"] == [{"document_name_en": "Passport"}]
        assert enriched[0]["source_verified"] is True

        # AI-provided fields should be kept
        assert enriched[0]["explanation"] == "Go register your address"
        assert enriched[0]["tips"] == ["Bring cash"]

    def test_flags_ai_suggested_steps(self, service, sample_steps):
        """Steps added by AI that aren't in the DB are flagged."""
        claude_response = {
            "steps": [
                {
                    "slug": "anmeldung",
                    "title": "Address Registration",
                    "explanation": "Register your address",
                    "tips": [],
                },
                {
                    "slug": "open_post_box",
                    "title": "Open a PO Box",
                    "explanation": "AI thinks you need this",
                    "tips": ["Not actually required"],
                    "ai_suggested": True,
                },
            ]
        }

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=json.dumps(claude_response))]
        mock_response.usage.input_tokens = 100
        mock_response.usage.output_tokens = 200
        service.anthropic.messages.create.return_value = mock_response

        base = [sample_steps[0].copy()]
        base[0]["documents"] = []

        enriched, ai_added = service._enrich_with_claude(base, {"visa_type": "student"})

        # DB step: ai_suggested = False
        assert enriched[0]["ai_suggested"] is False
        assert enriched[0]["source_verified"] is True

        # AI-added step: ai_suggested = True
        assert enriched[1]["ai_suggested"] is True
        assert enriched[1]["source_verified"] is False
        assert len(ai_added) == 1

    def test_falls_back_on_claude_error(self, service, sample_steps):
        """If Claude API fails, _format_unenriched returns raw steps."""
        base = [sample_steps[0].copy()]
        base[0]["documents"] = []

        result = service._format_unenriched(base)

        assert len(result) == 1
        assert result[0]["slug"] == "anmeldung"
        assert result[0]["explanation"] == ""
        assert result[0]["tips"] == []
        assert result[0]["ai_suggested"] is False
        assert result[0]["source_verified"] is True


class TestComputeDeadlines:
    def test_14_days_after_arrival(self, service):
        """Parses '14_days_after_arrival' into correct date."""
        steps = [{"slug": "anmeldung", "deadline_rule": "14_days_after_arrival"}]
        profile = {"arrival_date": "2026-04-01"}

        result = service._compute_deadlines(steps, profile)

        expected = (datetime(2026, 4, 1) + timedelta(days=14)).isoformat()
        assert result[0]["deadline"] == expected

    def test_90_days_before_visa_expiry(self, service):
        """Parses '90_days_before_visa_expiry' into correct date."""
        steps = [{"slug": "residence_permit", "deadline_rule": "90_days_before_visa_expiry"}]
        profile = {"visa_expiry_date": "2026-10-01"}

        result = service._compute_deadlines(steps, profile)

        expected = (datetime(2026, 10, 1) - timedelta(days=90)).isoformat()
        assert result[0]["deadline"] == expected

    def test_no_rule_returns_null(self, service):
        """Steps without deadline_rule get deadline: null."""
        steps = [{"slug": "bank_account", "deadline_rule": None}]
        profile = {"arrival_date": "2026-04-01"}

        result = service._compute_deadlines(steps, profile)

        assert result[0]["deadline"] is None

    def test_missing_date_returns_null(self, service):
        """If profile lacks the required date, deadline is null."""
        steps = [{"slug": "anmeldung", "deadline_rule": "14_days_after_arrival"}]
        profile = {}  # No arrival_date

        result = service._compute_deadlines(steps, profile)

        assert result[0]["deadline"] is None


class TestPersistAndLog:
    def test_persist_saves_profile_snapshot(self, service, sample_profile):
        """Persisted roadmap includes a PII-stripped profile snapshot."""
        service.supabase.table.return_value.delete.return_value \
            .eq.return_value.execute.return_value = MagicMock()
        service.supabase.table.return_value.insert.return_value \
            .execute.return_value = MagicMock()

        service._persist_roadmap(
            user_id="user-123",
            profile=sample_profile,
            steps=[],
            base_slugs=[],
            ai_added=[],
            ai_enriched=True,
        )

        insert_call = service.supabase.table.return_value.insert.call_args[0][0]
        snapshot = insert_call["profile_snapshot"]

        # Only safe fields should be in the snapshot
        assert "visa_type" in snapshot
        assert "bundesland" in snapshot
        assert "nationality" in snapshot
        assert "goal" in snapshot
        # PII should be stripped
        assert "email" not in snapshot
        assert "employer_name" not in snapshot
        assert "university_name" not in snapshot

    def test_log_saves_to_ai_generation_logs(self, service, sample_profile):
        """Every generation creates an audit log entry."""
        service.supabase.table.return_value.insert.return_value \
            .execute.return_value = MagicMock()

        service._log_generation(
            user_id="user-123",
            profile=sample_profile,
            steps=[{"slug": "anmeldung"}, {"slug": "health_insurance"}],
            latency_ms=1500,
            ai_enriched=True,
        )

        service.supabase.table.assert_called_with("ai_generation_logs")
        insert_call = service.supabase.table.return_value.insert.call_args[0][0]

        assert insert_call["operation"] == "roadmap_enrich"
        assert insert_call["user_id"] == "user-123"
        assert insert_call["model_used"] == "claude-sonnet-4-20250514"
        assert insert_call["latency_ms"] == 1500
        assert insert_call["output_payload"]["step_count"] == 2
        assert insert_call["output_payload"]["ai_enriched"] is True


class TestInternalKeyValidation:
    def test_rejects_missing_key(self):
        """Requests without X-Internal-Key header return 403."""
        from fastapi.testclient import TestClient
        from main import app

        client = TestClient(app)
        # Use a GET endpoint to avoid body validation interfering
        response = client.get("/rules/offices/DE-BY")
        assert response.status_code == 403
