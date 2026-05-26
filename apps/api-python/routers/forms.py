import logging
import re

from fastapi import APIRouter, HTTPException, status

from models import GeneratePdfRequest, GeneratePdfResponse
from services.pdf_fill import render_summary_pdf_base64

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate-pdf", response_model=GeneratePdfResponse)
async def generate_pdf(request: GeneratePdfRequest):
    """Render a branded preparation-summary PDF for a form."""
    try:
        fields = [f.model_dump() for f in request.fields]
        pdf_base64 = render_summary_pdf_base64(request.form_name, fields)
    except Exception:
        logger.exception("PDF generation failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PDF generation is temporarily unavailable.",
        )
    slug = re.sub(r"[^a-z0-9]+", "-", request.form_name.lower()).strip("-")
    return GeneratePdfResponse(
        pdf_base64=pdf_base64, filename=f"treppd-{slug or 'form'}.pdf"
    )
