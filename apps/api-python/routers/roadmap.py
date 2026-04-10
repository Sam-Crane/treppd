from fastapi import APIRouter, HTTPException

from models import UserProfile, RoadmapResponse
from services.roadmap_service import RoadmapService

router = APIRouter()

roadmap_service = RoadmapService()


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
    try:
        result = roadmap_service.generate(profile.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh/{user_id}", response_model=RoadmapResponse)
async def refresh_roadmap(user_id: str):
    """Force-refresh an expired roadmap without profile change.

    Reuses the existing profile snapshot from user_roadmaps.
    """
    try:
        result = roadmap_service.refresh(user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
