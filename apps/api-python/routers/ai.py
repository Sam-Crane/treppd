import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from models import (
    AppointmentEmailRequest,
    AppointmentEmailResponse,
    ChatRequest,
    ChatResponse,
    FieldExplainRequest,
    FieldExplainResponse,
)
from services.claude_emails import get_email_pipeline
from services.claude_fields import FieldNotFoundError, get_field_pipeline
from services.claude_rag import get_pipeline, to_sse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Non-streaming RAG chat.

    Used as a fallback by clients that can't consume SSE. Returns the full
    response after Claude completes. The streaming endpoint at
    /ai/chat/stream is preferred for the web UI.
    """
    pipeline = get_pipeline()
    result = await pipeline.generate_response(
        user_id=request.user_id,
        user_message=request.message,
        profile=request.profile,
        conversation_history=request.conversation_history,
    )

    now = datetime.now(timezone.utc).isoformat()
    updated_history = [
        *request.conversation_history,
        {"role": "user", "content": request.message, "ts": now},
        {"role": "assistant", "content": result["response"], "ts": now},
    ]

    return ChatResponse(
        response=result["response"],
        updated_history=updated_history,
    )


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming RAG chat (Server-Sent Events).

    Wire format (one event per `data:` block, blank line terminator):
      data: {"type": "retrieved", "chunks": [...]}
      data: {"type": "chunk", "text": "..."}
      data: {"type": "chunk", "text": "..."}
      ...
      data: {"type": "done", "message_id": "...", "input_tokens": N, "output_tokens": N}

    Headers include X-Accel-Buffering: no so nginx (and similar proxies)
    flush each event immediately instead of buffering the whole response.
    """
    pipeline = get_pipeline()

    async def event_stream():
        async for event in pipeline.stream_response(
            user_id=request.user_id,
            user_message=request.message,
            profile=request.profile,
            conversation_history=request.conversation_history,
        ):
            yield to_sse(event)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/explain-field", response_model=FieldExplainResponse)
async def explain_field(request: FieldExplainRequest):
    """Explain a specific form field in plain language.

    Grounded strictly in the field's stored `instructions_en`,
    `common_mistakes`, and `example_value`, personalised to the user's
    profile (visa_type, bundesland, goal). Results are cached for 60 min
    per (form, field, visa, bundesland) tuple.
    """
    pipeline = get_field_pipeline()
    try:
        parsed = pipeline.explain(
            form_code=request.form_code,
            field_id=request.field_id,
            user_context=request.user_context,
        )
    except FieldNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception:
        logger.exception("explain-field pipeline failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Field explanation is temporarily unavailable.",
        )

    return FieldExplainResponse(
        explanation=parsed["explanation"],
        tips=parsed["tips"],
        example=parsed["example"],
    )


@router.post("/appointment-email", response_model=AppointmentEmailResponse)
async def appointment_email(request: AppointmentEmailRequest):
    """Generate a correctly formatted German-language appointment request email.

    Always returns a subject and body in German regardless of the user's UI
    language. The body is formal Sie-form, 8-14 lines, ends with a proper
    Mit freundlichen Grüßen sign-off. Audit row written to
    ai_generation_logs with operation='appointment_email' (PII-stripped).
    """
    pipeline = get_email_pipeline()
    try:
        parsed = pipeline.generate(
            process_type=request.process_type,
            user_profile=request.user_profile or {},
            office_details=request.office_details or {},
        )
    except Exception:
        logger.exception("appointment-email pipeline failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Appointment email generation is temporarily unavailable.",
        )
    return AppointmentEmailResponse(
        subject=parsed["subject"],
        body=parsed["body"],
    )
