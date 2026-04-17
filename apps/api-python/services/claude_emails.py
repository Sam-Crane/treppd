"""Appointment email generation pipeline (Phase 3d).

Given (process_type, user_profile, office_details) produces a formal
German-language email requesting an appointment from the Ausländerbehörde
or Einwohnermeldeamt.

Mirrors `claude_fields.FieldExplainPipeline` — non-streaming Claude call,
PII-stripped audit log (operation="appointment_email"), 60-min TTL cache
keyed on (process_type, visa_type, bundesland) so repeated requests from
the same user profile re-use the previous draft rather than re-generating.
"""

from __future__ import annotations

import logging
import time
from threading import Lock

from anthropic import Anthropic
from supabase import Client, create_client

from config import get_settings
from prompts.appointment_email_prompt import (
    build_appointment_email_system_prompt,
    parse_appointment_response,
)

logger = logging.getLogger(__name__)

CHAT_MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 700  # German email ≈ 200-400 output tokens; leave headroom
CACHE_TTL_SECONDS = 60 * 60  # 60 min


class _TTLCache:
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


class AppointmentEmailPipeline:
    def __init__(self) -> None:
        settings = get_settings()
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )
        self.anthropic = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self._cache = _TTLCache(CACHE_TTL_SECONDS)

    # --------------------------------------------------------------- generate

    def generate(
        self,
        process_type: str,
        user_profile: dict,
        office_details: dict,
    ) -> dict:
        """Return {subject, body} for one appointment email."""
        profile = user_profile or {}
        office = office_details or {}

        # Cache key excludes applicant identity + office specifics on purpose —
        # we want the SAME structure reused for similar requests. The applicant
        # name is interpolated by Claude inside the body regardless.
        cache_key = (
            process_type,
            profile.get("visa_type") or "",
            profile.get("bundesland") or "",
            # Applicant preferred dates vary per request; include them.
            tuple(office.get("requested_dates") or ()),
        )
        cached = self._cache.get(cache_key)
        if cached is not None:
            logger.info(
                "Appointment email cache HIT process=%s visa=%s bundesland=%s",
                process_type, profile.get("visa_type"), profile.get("bundesland"),
            )
            return cached

        started = time.time()
        system_prompt = build_appointment_email_system_prompt(
            process_type, profile, office,
        )
        user_request = (
            f"Please draft the appointment email in German for "
            f"process_type='{process_type}'. Respond with the JSON object only."
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
            logger.exception("Anthropic call failed for appointment-email")
            raise

        try:
            parsed = parse_appointment_response(raw_response)
        except ValueError:
            logger.exception(
                "Claude returned unparseable response for appointment email (process=%s)",
                process_type,
            )
            # Fallback: a minimal generic German email the user can still copy
            parsed = self._static_fallback(process_type)

        latency_ms = int((time.time() - started) * 1000)

        try:
            self._log_generation(
                process_type=process_type,
                profile=profile,
                response=parsed,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=latency_ms,
            )
        except Exception:
            logger.exception("Failed to write appointment-email audit row")

        self._cache.put(cache_key, parsed)
        return parsed

    # --------------------------------------------------------------- helpers

    @staticmethod
    def _static_fallback(process_type: str) -> dict:
        """Minimal German email used when the LLM call fails to parse."""
        return {
            "subject": "Terminanfrage",
            "body": (
                "Sehr geehrte Damen und Herren,\n\n"
                "hiermit möchte ich einen Termin vereinbaren. "
                "Bitte teilen Sie mir einen verfügbaren Termin mit.\n\n"
                "Mit freundlichen Grüßen,\n"
                "[Name]\n"
                "[E-Mail]"
            ),
        }

    def _log_generation(
        self,
        *,
        process_type: str,
        profile: dict,
        response: dict,
        input_tokens: int,
        output_tokens: int,
        latency_ms: int,
    ) -> None:
        """Audit log. Never logs applicant name, office email, or email body."""
        user_id = profile.get("user_id")
        safe_input = {
            "process_type": process_type,
            "visa_type": profile.get("visa_type"),
            "bundesland": profile.get("bundesland"),
            "goal": profile.get("goal"),
        }
        safe_output = {
            "subject_length": len(response.get("subject") or ""),
            "body_length": len(response.get("body") or ""),
        }
        self.supabase.table("ai_generation_logs").insert(
            {
                "operation": "appointment_email",
                "user_id": user_id,
                "input_payload": safe_input,
                "output_payload": safe_output,
                "model_used": CHAT_MODEL,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms,
            }
        ).execute()


# Module-level singleton (mirrors claude_rag / claude_fields).
_pipeline: AppointmentEmailPipeline | None = None


def get_email_pipeline() -> AppointmentEmailPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = AppointmentEmailPipeline()
    return _pipeline
