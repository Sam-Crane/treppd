from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from models import (
    AppointmentEmailRequest,
    AppointmentEmailResponse,
    ChatRequest,
    ChatResponse,
    FieldExplainRequest,
    FieldExplainResponse,
)
from services.claude_rag import get_pipeline, to_sse

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
    """Explain a specific form field in plain language."""
    # TODO: Phase 3 follow-up (separate plan)
    return FieldExplainResponse(
        explanation="Field explanation not yet implemented",
        tips=[],
        example="",
    )


@router.post("/appointment-email", response_model=AppointmentEmailResponse)
async def appointment_email(request: AppointmentEmailRequest):
    """Generate a correctly formatted German-language appointment request email."""
    # TODO: Phase 3 follow-up (separate plan)
    return AppointmentEmailResponse(
        subject="Terminanfrage",
        body="Email generation not yet implemented",
    )
