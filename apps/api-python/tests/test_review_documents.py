"""Tests for the document-completeness summary (services/claude_documents.py).

The deterministic verdict is computed in NestJS; here we only verify the
prose layer — notably that it never hard-fails (templated fallback) and that
the fallback wording reflects the provided lists without inventing items.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import services.claude_documents
from services.claude_documents import _fallback_summary


class TestFallbackSummary:
    def test_all_covered_message(self):
        s = _fallback_summary(satisfied=["passport"], missing=[], warnings=[])
        assert "all required" in s.lower()
        assert "Ausländerbehörde" in s

    def test_lists_missing_items(self):
        s = _fallback_summary(
            satisfied=["passport"], missing=["health_insurance"], warnings=[]
        )
        assert "health_insurance" in s

    def test_surfaces_warnings(self):
        s = _fallback_summary(
            satisfied=["passport"],
            missing=[],
            warnings=[{"document_name": "Degree", "issue": "needs_apostille"}],
        )
        assert "Degree" in s
        assert "needs_apostille" in s


class TestSummarizeAiPath:
    def _service(self):
        with patch("services.claude_documents.Anthropic") as factory:
            factory.return_value = MagicMock()
            return services.claude_documents.DocumentReviewService()

    def test_uses_claude_text_when_available(self):
        svc = self._service()
        block = MagicMock()
        block.type = "text"
        block.text = "You're almost there — just add your health insurance."
        msg = MagicMock()
        msg.content = [block]
        svc.anthropic.messages.create.return_value = msg

        out = svc.summarize({"visa_type": "student"}, ["passport"], ["health_insurance"], [])
        assert "almost there" in out

    def test_falls_back_when_claude_raises(self):
        svc = self._service()
        svc.anthropic.messages.create.side_effect = RuntimeError("api down")
        out = svc.summarize({}, ["passport"], ["blocked_account"], [])
        # Fallback template still mentions the missing item.
        assert "blocked_account" in out
