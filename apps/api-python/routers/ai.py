from fastapi import APIRouter

from models import (
    ChatRequest,
    ChatResponse,
    FieldExplainRequest,
    FieldExplainResponse,
    AppointmentEmailRequest,
    AppointmentEmailResponse,
)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat message with RAG over immigration knowledge base.

    1. Retrieves top 5 relevant knowledge chunks via pgvector similarity search
    2. Query composed from: user message + visa_type + bundesland + current step
    3. Claude answers only from provided context
    4. Flags uncertainty and recommends lawyers for complex questions
    """
    # TODO: Implement RAG pipeline
    return ChatResponse(
        response="AI chat not yet implemented",
        updated_history=request.conversation_history,
    )


@router.post("/explain-field", response_model=FieldExplainResponse)
async def explain_field(request: FieldExplainRequest):
    """Explain a specific form field in plain language.

    Returns a plain-language explanation, common tips, and an example value
    tailored to the user's visa type and bundesland.
    """
    # TODO: Implement field explanation
    return FieldExplainResponse(
        explanation="Field explanation not yet implemented",
        tips=[],
        example="",
    )


@router.post("/appointment-email", response_model=AppointmentEmailResponse)
async def appointment_email(request: AppointmentEmailRequest):
    """Generate a correctly formatted German-language appointment request email.

    Pre-filled with user details and the specific process they are applying for.
    Output is in German, ready to send to the Auslaenderbehoerde.
    """
    # TODO: Implement email generation
    return AppointmentEmailResponse(
        subject="Terminanfrage",
        body="Email generation not yet implemented",
    )
