import logging

from fastapi import APIRouter, HTTPException, status

from models import HousingEstimateResponse, WbsRequest, WohngeldRequest
from services.housing import get_housing_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/wbs", response_model=HousingEstimateResponse)
async def wbs_estimate(request: WbsRequest):
    """Estimate WBS (Wohnberechtigungsschein) eligibility from income limits."""
    try:
        return get_housing_service().wbs(request)
    except Exception:
        logger.exception("WBS estimate failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Housing estimate temporarily unavailable.",
        )


@router.post("/wohngeld", response_model=HousingEstimateResponse)
async def wohngeld_estimate(request: WohngeldRequest):
    """Indicator for whether applying for Wohngeld is likely worthwhile."""
    try:
        return get_housing_service().wohngeld(request)
    except Exception:
        logger.exception("Wohngeld estimate failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Housing estimate temporarily unavailable.",
        )
