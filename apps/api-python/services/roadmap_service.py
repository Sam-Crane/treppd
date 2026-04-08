"""Roadmap generation service.

Handles the hybrid DB + AI roadmap pipeline:
1. Fetch verified base steps from roadmap_steps table
2. Join with document_requirements
3. Enrich with Claude API
4. Persist to user_roadmaps with profile snapshot
5. Log to ai_generation_logs
"""


class RoadmapService:
    """Core roadmap generation pipeline."""

    async def generate(self, profile: dict) -> dict:
        """Generate a personalised roadmap for a user profile."""
        # TODO: Implement full pipeline
        raise NotImplementedError

    async def refresh(self, user_id: str) -> dict:
        """Refresh an expired roadmap using existing profile."""
        # TODO: Implement refresh
        raise NotImplementedError
