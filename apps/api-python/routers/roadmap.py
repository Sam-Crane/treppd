from fastapi import APIRouter

from models import UserProfile, RoadmapResponse

router = APIRouter()


@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap(profile: UserProfile):
    """Hybrid DB + AI roadmap generation.

    1. Fetches verified base steps from roadmap_steps filtered by visa_type + bundesland
    2. Joins with document_requirements
    3. Enriches with Claude API (explanations, tips, wait time estimates)
    4. Persists to user_roadmaps with profile snapshot
    5. Logs to ai_generation_logs

    AI-added steps are flagged with ai_suggested: true.
    AI cannot modify verified form names, office names, or document requirements.
    """
    # TODO: Implement roadmap_service.generate()
    return RoadmapResponse(
        roadmap_id="placeholder",
        steps=[],
        ai_enriched=False,
        ai_fallback=True,
        generated_at="2026-01-01T00:00:00Z",
        expires_at="2026-01-31T00:00:00Z",
    )


@router.post("/refresh/{user_id}", response_model=RoadmapResponse)
async def refresh_roadmap(user_id: str):
    """Force-refresh an expired roadmap without profile change.

    Reuses the existing profile snapshot from user_roadmaps.
    """
    # TODO: Implement roadmap_service.refresh()
    return RoadmapResponse(
        roadmap_id="placeholder",
        steps=[],
        ai_enriched=False,
        ai_fallback=True,
        generated_at="2026-01-01T00:00:00Z",
        expires_at="2026-01-31T00:00:00Z",
    )
