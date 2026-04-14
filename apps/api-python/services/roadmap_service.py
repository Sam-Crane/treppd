"""Roadmap generation service.

Implements the 6-step hybrid DB + AI pipeline:
1. Fetch verified base steps from roadmap_steps table
2. Fetch document requirements per step
3. Enrich with Claude API (explanations, tips, wait times)
4. Compute deadlines from profile dates
5. Persist to user_roadmaps with profile snapshot
6. Log to ai_generation_logs (no PII)
"""

import json
import logging
import time
from datetime import datetime, timedelta
from uuid import uuid4

from anthropic import Anthropic
from supabase import create_client, Client

from config import get_settings
from prompts.roadmap_prompt import build_system_prompt, build_user_prompt

logger = logging.getLogger(__name__)


class RoadmapService:
    """Core roadmap generation pipeline."""

    def __init__(self):
        settings = get_settings()
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )
        self.anthropic = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def generate(self, profile: dict) -> dict:
        """Generate a personalised roadmap for a user profile."""
        start_time = time.time()

        # Step 1: Fetch verified base steps
        base_steps = self._fetch_base_steps(
            visa_type=profile["visa_type"],
            bundesland=profile["bundesland"],
        )

        # Step 2: Fetch document requirements for each step
        step_slugs = [s["slug"] for s in base_steps]
        documents = self._fetch_documents(
            step_slugs=step_slugs,
            nationality=profile.get("nationality", ""),
            bundesland=profile["bundesland"],
        )

        # Attach documents to steps
        for step in base_steps:
            step["documents"] = documents.get(step["slug"], [])

        # Step 3: AI enrichment via Claude API
        try:
            enriched_steps, ai_added_steps = self._enrich_with_claude(
                base_steps=base_steps,
                profile=profile,
            )
            ai_enriched = True
        except Exception:
            # Fallback: return un-enriched steps if Claude fails
            enriched_steps = self._format_unenriched(base_steps)
            ai_added_steps = []
            ai_enriched = False
            logger.exception("Claude enrichment failed, falling back to raw steps")

        # Step 4: Compute deadlines
        enriched_steps = self._compute_deadlines(enriched_steps, profile)

        # Step 5: Persist roadmap
        roadmap_id = self._persist_roadmap(
            user_id=profile["user_id"],
            profile=profile,
            steps=enriched_steps,
            base_slugs=step_slugs,
            ai_added=ai_added_steps,
            ai_enriched=ai_enriched,
        )

        # Step 6: Log AI call
        latency_ms = int((time.time() - start_time) * 1000)
        self._log_generation(
            user_id=profile["user_id"],
            profile=profile,
            steps=enriched_steps,
            latency_ms=latency_ms,
            ai_enriched=ai_enriched,
        )

        expires_at = datetime.utcnow() + timedelta(days=30)

        return {
            "roadmap_id": roadmap_id,
            "steps": enriched_steps,
            "ai_enriched": ai_enriched,
            "ai_fallback": not ai_enriched,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "expires_at": expires_at.isoformat() + "Z",
        }

    def refresh(self, user_id: str) -> dict:
        """Refresh an expired roadmap using the existing profile snapshot."""
        result = (
            self.supabase.table("user_roadmaps")
            .select("profile_snapshot")
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        if not result.data:
            raise ValueError(f"No existing roadmap found for user {user_id}")

        profile = result.data["profile_snapshot"]
        profile["user_id"] = user_id
        return self.generate(profile)

    def _fetch_base_steps(self, visa_type: str, bundesland: str) -> list[dict]:
        """Fetch verified steps filtered by visa type and bundesland."""
        result = (
            self.supabase.table("roadmap_steps")
            .select("*")
            .contains("visa_types", [visa_type])
            .order("sequence")
            .execute()
        )

        steps = result.data or []

        # Filter by bundesland: empty array means all states
        return [
            s
            for s in steps
            if not s.get("bundeslaender") or bundesland in s["bundeslaender"]
        ]

    def _fetch_documents(
        self, step_slugs: list[str], nationality: str, bundesland: str
    ) -> dict[str, list]:
        """Fetch document requirements grouped by step slug."""
        result = (
            self.supabase.table("document_requirements")
            .select("*")
            .in_("step_slug", step_slugs)
            .execute()
        )

        docs = result.data or []
        grouped: dict[str, list] = {}

        for doc in docs:
            # Filter by nationality applicability
            nat_list = doc.get("applies_to_nationalities") or []
            if nat_list and nationality not in nat_list:
                continue

            # Filter by bundesland applicability
            bl_list = doc.get("applies_to_bundeslaender") or []
            if bl_list and bundesland not in bl_list:
                continue

            slug = doc["step_slug"]
            if slug not in grouped:
                grouped[slug] = []

            grouped[slug].append(
                {
                    "document_name_en": doc["document_name_en"],
                    "document_name_de": doc["document_name_de"],
                    "specifications": doc.get("specifications"),
                    "needs_certified_copy": doc.get("needs_certified_copy", False),
                    "needs_translation": doc.get("needs_translation", False),
                    "needs_apostille": doc.get("needs_apostille", False),
                    "where_to_get": doc.get("where_to_get", ""),
                    "estimated_cost_eur": doc.get("estimated_cost_eur"),
                }
            )

        return grouped

    def _enrich_with_claude(
        self, base_steps: list[dict], profile: dict
    ) -> tuple[list[dict], list[dict]]:
        """Send base steps + profile to Claude for enrichment."""
        system_prompt = build_system_prompt()
        user_prompt = build_user_prompt(base_steps, profile)

        response = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
            timeout=20.0,
        )

        response_text = response.content[0].text

        # Parse JSON response
        enriched = json.loads(response_text)
        enriched_steps = enriched.get("steps", [])

        # Build lookup for original steps
        original_map = {s["slug"]: s for s in base_steps}

        # Separate AI-added steps
        ai_added = [s for s in enriched_steps if s.get("ai_suggested", False)]

        # Ensure verified fields are NOT modified by AI
        for step in enriched_steps:
            slug = step.get("slug", "")
            if slug in original_map:
                original = original_map[slug]
                # Restore DB-authoritative fields
                step["title"] = original["title_en"]
                step["office"] = original.get("office_type", "")
                step["can_do_online"] = original.get("can_do_online", False)
                step["documents_needed"] = original.get("documents", [])
                step["depends_on"] = original.get("depends_on", [])
                step["source_verified"] = True
                step["ai_suggested"] = False
            else:
                # AI-added step: ensure it's flagged
                step["ai_suggested"] = True
                step["source_verified"] = False
                step.setdefault("documents_needed", [])
                step.setdefault("depends_on", [])

        # Track token usage for logging
        self._last_input_tokens = response.usage.input_tokens
        self._last_output_tokens = response.usage.output_tokens

        return enriched_steps, ai_added

    def _format_unenriched(self, base_steps: list[dict]) -> list[dict]:
        """Format base steps without AI enrichment (fallback)."""
        return [
            {
                "slug": s["slug"],
                "title": s["title_en"],
                "explanation": "",
                "office": s.get("office_type", ""),
                "can_do_online": s.get("can_do_online", False),
                "estimated_days": s.get("typical_wait_days", 0),
                "depends_on": s.get("depends_on", []),
                "documents_needed": s.get("documents", []),
                "tips": [],
                "deadline": None,
                "ai_suggested": False,
                "source_verified": True,
            }
            for s in base_steps
        ]

    def _compute_deadlines(self, steps: list[dict], profile: dict) -> list[dict]:
        """Parse deadline_rule strings into concrete ISO dates."""
        arrival = profile.get("arrival_date")
        visa_expiry = profile.get("visa_expiry_date")

        for step in steps:
            rule = step.get("deadline_rule") or step.get("deadline")
            if not rule or not isinstance(rule, str):
                step["deadline"] = None
                continue

            try:
                if "days_after_arrival" in rule and arrival:
                    days = int(rule.split("_")[0])
                    deadline = datetime.fromisoformat(arrival) + timedelta(days=days)
                    step["deadline"] = deadline.isoformat()
                elif "days_before_visa_expiry" in rule and visa_expiry:
                    days = int(rule.split("_")[0])
                    deadline = datetime.fromisoformat(visa_expiry) - timedelta(days=days)
                    step["deadline"] = deadline.isoformat()
                else:
                    step["deadline"] = None
            except (ValueError, IndexError):
                step["deadline"] = None

        return steps

    def _persist_roadmap(
        self,
        user_id: str,
        profile: dict,
        steps: list[dict],
        base_slugs: list[str],
        ai_added: list[dict],
        ai_enriched: bool,
    ) -> str:
        """Save roadmap to user_roadmaps with profile snapshot."""
        # Delete existing roadmap (one active per user)
        self.supabase.table("user_roadmaps").delete().eq("user_id", user_id).execute()

        roadmap_id = str(uuid4())
        expires_at = (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"

        self.supabase.table("user_roadmaps").insert(
            {
                "id": roadmap_id,
                "user_id": user_id,
                "profile_snapshot": self._strip_pii(profile),
                "steps": steps,
                "base_steps_used": base_slugs,
                "ai_enriched": ai_enriched,
                "ai_added_steps": ai_added,
                "ai_fallback": not ai_enriched,
                "expires_at": expires_at,
            }
        ).execute()

        return roadmap_id

    def _log_generation(
        self,
        user_id: str,
        profile: dict,
        steps: list[dict],
        latency_ms: int,
        ai_enriched: bool,
    ) -> None:
        """Log to ai_generation_logs. No PII stored."""
        safe_profile = self._strip_pii(profile)

        self.supabase.table("ai_generation_logs").insert(
            {
                "operation": "roadmap_enrich",
                "user_id": user_id,
                "input_payload": safe_profile,
                "output_payload": {"step_count": len(steps), "ai_enriched": ai_enriched},
                "model_used": "claude-sonnet-4-20250514",
                "input_tokens": getattr(self, "_last_input_tokens", None),
                "output_tokens": getattr(self, "_last_output_tokens", None),
                "latency_ms": latency_ms,
            }
        ).execute()

    @staticmethod
    def _strip_pii(profile: dict) -> dict:
        """Strip PII from profile for logging. Keep only visa_type, bundesland, goal, nationality."""
        return {
            "visa_type": profile.get("visa_type"),
            "bundesland": profile.get("bundesland"),
            "goal": profile.get("goal"),
            "nationality": profile.get("nationality"),
        }
