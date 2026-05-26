from typing import Optional

from fastapi import APIRouter
from supabase import create_client

from config import get_settings
from models import (
    DeadlineRequest,
    DeadlineResponse,
    SequenceRequest,
    SequenceResponse,
    OfficeInfo,
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
async def get_offices(bundesland: str, city: Optional[str] = None):
    """Return offices for a Bundesland (optionally narrowed to one city).

    Reads the human-curated `offices` table. Covers Auslaenderbehoerde,
    Buergeramt, and Einwohnermeldeamt. A row with verified_at NULL surfaces
    as `verified=false` so the UI can warn the user to confirm officially.
    """
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)

    query = (
        supabase.table("offices")
        .select(
            "city, office_type, name_de, permit_categories, address, phone, "
            "contact_email, booking_url, verified_at"
        )
        .eq("bundesland", bundesland)
    )
    if city:
        query = query.eq("city", city)

    rows = (query.order("city").execute().data) or []

    offices = [
        OfficeInfo(
            name=row.get("name_de") or "",
            city=row.get("city"),
            office_type=row.get("office_type"),
            permit_categories=row.get("permit_categories") or [],
            address=row.get("address"),
            phone=row.get("phone"),
            contact_email=row.get("contact_email"),
            booking_url=row.get("booking_url"),
            verified=row.get("verified_at") is not None,
        )
        for row in rows
    ]
    return OfficesResponse(bundesland=bundesland, offices=offices)
