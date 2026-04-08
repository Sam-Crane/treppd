from fastapi import APIRouter

from models import (
    DeadlineRequest,
    DeadlineResponse,
    SequenceRequest,
    SequenceResponse,
    OfficesResponse,
)

router = APIRouter()


@router.post("/compute-deadlines", response_model=DeadlineResponse)
async def compute_deadlines(request: DeadlineRequest):
    """Calculate concrete deadline dates for a user.

    Parses deadline_rule strings from roadmap_steps into ISO date strings.
    Rules supported:
    - '14_days_after_arrival' -> arrival_date + 14 days
    - '90_days_before_visa_expiry' -> visa_expiry_date - 90 days
    """
    # TODO: Implement deadline computation
    return DeadlineResponse(deadlines={})


@router.post("/validate-sequence", response_model=SequenceResponse)
async def validate_sequence(request: SequenceRequest):
    """Validate that completed steps satisfy dependencies.

    Checks the depends_on field of the target step against the user's
    completed_steps array. Returns any violated dependencies.
    """
    # TODO: Implement dependency validation
    return SequenceResponse(valid=True, violations=[])


@router.get("/offices/{bundesland}", response_model=OfficesResponse)
async def get_offices(bundesland: str):
    """Return office contact details and appointment booking URLs for a Bundesland.

    Covers Auslaenderbehoerde, Einwohnermeldeamt, and other relevant offices
    for the specified Bundesland.
    """
    # TODO: Implement office lookup
    return OfficesResponse(bundesland=bundesland, offices=[])
