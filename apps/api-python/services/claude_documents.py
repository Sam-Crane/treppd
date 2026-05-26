"""Document-completeness summary.

The deterministic decision (which tags are satisfied/missing, which need
translation/apostille) is made upstream in NestJS and passed in. Claude's ONLY
job here is to turn that structured result into a short, encouraging,
plain-English summary — it must not introduce or remove requirements.

If Anthropic is unavailable or misbehaves, we fall back to a templated summary
so the endpoint never hard-fails.
"""

from __future__ import annotations

import logging

from anthropic import Anthropic

from config import get_settings

logger = logging.getLogger(__name__)

_SYSTEM = (
    "You are a document-checklist assistant for immigrants in Germany. "
    "You will be given the user's situation and a PRE-COMPUTED checklist result "
    "(satisfied items, missing items, and warnings). Write a short summary "
    "(2-4 sentences) in plain English. Be encouraging and specific. "
    "RULES: Only mention items that appear in the provided lists. Do NOT invent "
    "documents or requirements. Do NOT give legal advice. End by reminding the "
    "user to verify with their local Ausländerbehörde."
)


def _fallback_summary(satisfied: list[str], missing: list[str], warnings: list[dict]) -> str:
    parts: list[str] = []
    if not missing:
        parts.append("You appear to have all required document types covered.")
    else:
        parts.append(
            f"You still need: {', '.join(missing)}."
        )
    if satisfied:
        parts.append(f"Provided: {', '.join(satisfied)}.")
    if warnings:
        issues = ", ".join(
            f"{w.get('document_name', w.get('tag', 'a document'))} "
            f"({w.get('issue', 'check requirements')})"
            for w in warnings
        )
        parts.append(f"Double-check preparation: {issues}.")
    parts.append("Always verify with your local Ausländerbehörde.")
    return " ".join(parts)


class DocumentReviewService:
    def __init__(self) -> None:
        settings = get_settings()
        self.anthropic = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def summarize(
        self,
        profile: dict,
        satisfied: list[str],
        missing: list[str],
        warnings: list[dict],
    ) -> str:
        user_payload = (
            f"Visa type: {profile.get('visa_type', 'unknown')}; "
            f"Bundesland: {profile.get('bundesland', 'unknown')}.\n"
            f"Satisfied: {satisfied}\nMissing: {missing}\nWarnings: {warnings}"
        )
        try:
            message = self.anthropic.messages.create(
                model="claude-opus-4-5",
                max_tokens=300,
                system=_SYSTEM,
                messages=[{"role": "user", "content": user_payload}],
            )
            text = "".join(
                block.text for block in message.content if block.type == "text"
            ).strip()
            if text:
                return text
        except Exception:
            logger.exception("Document summary via Claude failed; using fallback")
        return _fallback_summary(satisfied, missing, warnings)


_service: DocumentReviewService | None = None


def get_document_review_service() -> DocumentReviewService:
    global _service
    if _service is None:
        _service = DocumentReviewService()
    return _service
