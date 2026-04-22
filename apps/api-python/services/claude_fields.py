"""Field-explanation pipeline for the Form-Filling Guide.

Given a (form_code, field_id, user_profile) triple this asks Claude for a
short personalised explanation of one form field. It is NOT a RAG
pipeline — the grounding is the field's own `instructions_en`,
`common_mistakes`, and `example_value` (stored as JSONB on the `forms`
row in Postgres).

Safety properties:
  - Claude is instructed to answer ONLY from the provided field data
    plus the user's profile (prompts/field_prompt.py). No retrieval, no
    browsing, no invention.
  - Every call writes a PII-stripped audit row to ai_generation_logs
    (operation="explain_field"). The user's in-progress form VALUES are
    never logged — only `{form_code, field_id, visa_type, bundesland}`.
  - Identical (field × profile) queries hit the in-process TTL cache
    for 60 minutes to keep costs down. The cache is per-replica; this
    is acceptable because the field data is immutable.

If Supabase or Anthropic is unavailable, callers receive a clear error
— the router translates these to HTTPException(404) / 503 respectively.
"""

from __future__ import annotations

import logging
import time
from threading import Lock

from anthropic import Anthropic
from supabase import Client, create_client

from config import get_settings
from prompts.field_prompt import (
    build_field_explain_system_prompt,
    parse_field_response,
)

logger = logging.getLogger(__name__)

CHAT_MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 512  # responses are short structured JSON
CACHE_TTL_SECONDS = 60 * 60  # 60 min


class FieldNotFoundError(LookupError):
    """Raised when form_code or field_id cannot be resolved."""


class _TTLCache:
    """Tiny thread-safe TTL cache. Enough for a single field explanation
    map — we don't need the sophistication of cachetools."""

    def __init__(self, ttl_seconds: float) -> None:
        self._ttl = ttl_seconds
        self._store: dict[tuple, tuple[float, dict]] = {}
        self._lock = Lock()

    def get(self, key: tuple) -> dict | None:
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            ts, value = entry
            if (time.time() - ts) > self._ttl:
                self._store.pop(key, None)
                return None
            return value

    def put(self, key: tuple, value: dict) -> None:
        with self._lock:
            self._store[key] = (time.time(), value)


class FieldExplainPipeline:
    """Resolve a field, ask Claude for an explanation, return structured JSON."""

    def __init__(self) -> None:
        settings = get_settings()
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SECRET_KEY,
        )
        self.anthropic = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self._cache = _TTLCache(CACHE_TTL_SECONDS)

    # --------------------------------------------------------------- resolve

    def _fetch_form(self, form_code: str) -> dict:
        """Load the form row; raise FieldNotFoundError if absent."""
        result = (
            self.supabase.table("forms")
            .select("*")
            .eq("form_code", form_code)
            .maybe_single()
            .execute()
        )
        if not result.data:
            raise FieldNotFoundError(f"Unknown form_code: {form_code!r}")
        return result.data

    @staticmethod
    def _find_field(form: dict, field_id: str) -> dict:
        for f in form.get("fields") or []:
            if f.get("field_id") == field_id:
                return f
        raise FieldNotFoundError(
            f"Unknown field_id {field_id!r} in form {form.get('form_code')!r}"
        )

    # --------------------------------------------------------------- explain

    def explain(
        self,
        form_code: str,
        field_id: str,
        user_context: dict,
    ) -> dict:
        """Return {explanation, tips, example} for a single field."""
        profile = user_context or {}

        cache_key = (
            form_code,
            field_id,
            profile.get("visa_type") or "",
            profile.get("bundesland") or "",
        )
        cached = self._cache.get(cache_key)
        if cached is not None:
            logger.info(
                "Field explain cache HIT form=%s field=%s visa=%s bundesland=%s",
                form_code, field_id,
                profile.get("visa_type"), profile.get("bundesland"),
            )
            return cached

        started = time.time()
        form = self._fetch_form(form_code)
        field = self._find_field(form, field_id)

        system_prompt = build_field_explain_system_prompt(form, field, profile)
        user_request = (
            f"Explain field '{field.get('label_en')}' on form "
            f"'{form.get('name_en')}' for me in plain English. "
            f"Respond with the JSON object only."
        )

        raw_response = ""
        input_tokens = 0
        output_tokens = 0
        try:
            message = self.anthropic.messages.create(
                model=CHAT_MODEL,
                max_tokens=MAX_TOKENS,
                system=system_prompt,
                messages=[{"role": "user", "content": user_request}],
                timeout=30.0,
            )
            raw_response = "".join(
                b.text for b in message.content if getattr(b, "type", "") == "text"
            )
            input_tokens = message.usage.input_tokens
            output_tokens = message.usage.output_tokens
        except Exception:
            logger.exception("Anthropic call failed for explain-field")
            raise

        try:
            parsed = parse_field_response(raw_response)
        except ValueError:
            logger.exception(
                "Claude returned unparseable response for %s/%s; falling back to static",
                form_code, field_id,
            )
            # Fallback: return the field's static content so the user still
            # sees useful guidance even if the LLM misformatted.
            parsed = self._static_fallback(field)

        latency_ms = int((time.time() - started) * 1000)

        try:
            self._log_generation(
                form_code=form_code,
                field_id=field_id,
                profile=profile,
                response=parsed,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=latency_ms,
            )
        except Exception:
            # Never fail the user response over an audit-log write
            logger.exception("Failed to write explain-field audit row")

        self._cache.put(cache_key, parsed)
        return parsed

    # ----------------------------------------------------------------- helpers

    @staticmethod
    def _static_fallback(field: dict) -> dict:
        """Return the field's hand-curated content, shaped like a Claude response."""
        mistakes = field.get("common_mistakes") or []
        return {
            "explanation": (field.get("instructions_en") or "").strip(),
            "tips": [m for m in mistakes if isinstance(m, str)],
            "example": str(field.get("example_value") or ""),
        }

    def _log_generation(
        self,
        *,
        form_code: str,
        field_id: str,
        profile: dict,
        response: dict,
        input_tokens: int,
        output_tokens: int,
        latency_ms: int,
    ) -> None:
        """Write an audit row to ai_generation_logs. No PII, no form values."""
        user_id = profile.get("user_id")
        safe_input = {
            "form_code": form_code,
            "field_id": field_id,
            "visa_type": profile.get("visa_type"),
            "bundesland": profile.get("bundesland"),
            "goal": profile.get("goal"),
        }
        safe_output = {
            "explanation_length": len(response.get("explanation") or ""),
            "tips_count": len(response.get("tips") or []),
            "example_length": len(response.get("example") or ""),
        }
        self.supabase.table("ai_generation_logs").insert(
            {
                "operation": "explain_field",
                "user_id": user_id,
                "input_payload": safe_input,
                "output_payload": safe_output,
                "model_used": CHAT_MODEL,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms,
            }
        ).execute()


# Module-level lazy singleton (mirrors claude_rag.get_pipeline pattern).
_pipeline: FieldExplainPipeline | None = None


def get_field_pipeline() -> FieldExplainPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = FieldExplainPipeline()
    return _pipeline
