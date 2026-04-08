"""Pydantic models shared across routers.

These models define the interface contract between NestJS and FastAPI.
The auto-generated OpenAPI spec from these models is the agreed API contract
that both services must conform to.
"""

from pydantic import BaseModel


# === Request Models ===

class UserProfile(BaseModel):
    """User immigration profile sent from NestJS."""
    user_id: str
    nationality: str
    visa_type: str  # student | work | job_seeker | family | freelance | au_pair
    bundesland: str  # DE-BY | DE-BE | DE-NW | etc.
    city: str | None = None
    goal: str  # initial_setup | visa_renewal | change_visa | family_reunion | job_change
    arrival_date: str | None = None
    visa_expiry_date: str | None = None
    employer_name: str | None = None
    university_name: str | None = None
    completed_steps: list[str] = []


class ChatRequest(BaseModel):
    """Chat message request from NestJS."""
    user_id: str
    message: str
    context_type: str | None = "general"  # roadmap | form_help | document_check | general
    conversation_history: list[dict] = []
    profile: dict


class FieldExplainRequest(BaseModel):
    """Form field explanation request."""
    form_code: str
    field_id: str
    user_context: dict


class AppointmentEmailRequest(BaseModel):
    """Appointment email generation request."""
    user_profile: dict
    process_type: str
    office_details: dict


class DeadlineRequest(BaseModel):
    """Deadline computation request."""
    profile: dict
    step_slugs: list[str]


class SequenceRequest(BaseModel):
    """Step sequence validation request."""
    completed_steps: list[str]
    target_step: str


# === Response Models ===

class DocumentRequirement(BaseModel):
    """Document needed for a roadmap step."""
    document_name_en: str
    document_name_de: str
    specifications: dict | None = None
    needs_certified_copy: bool = False
    needs_translation: bool = False
    needs_apostille: bool = False
    where_to_get: str | None = None
    estimated_cost_eur: float | None = None


class RoadmapStep(BaseModel):
    """Single step in a generated roadmap."""
    slug: str
    title: str
    explanation: str
    office: str
    can_do_online: bool
    estimated_days: int
    depends_on: list[str] = []
    documents_needed: list[DocumentRequirement] = []
    tips: list[str] = []
    deadline: str | None = None
    ai_suggested: bool = False
    source_verified: bool = True


class RoadmapResponse(BaseModel):
    """Full roadmap generation response."""
    roadmap_id: str
    steps: list[RoadmapStep]
    ai_enriched: bool
    ai_fallback: bool
    generated_at: str
    expires_at: str


class ChatResponse(BaseModel):
    """AI chat response."""
    response: str
    updated_history: list[dict]


class FieldExplainResponse(BaseModel):
    """Form field explanation response."""
    explanation: str
    tips: list[str] = []
    example: str = ""


class AppointmentEmailResponse(BaseModel):
    """Generated appointment email."""
    subject: str
    body: str


class DeadlineResponse(BaseModel):
    """Computed deadlines for steps."""
    deadlines: dict[str, str | None]  # step_slug -> ISO date or null


class SequenceResponse(BaseModel):
    """Step sequence validation result."""
    valid: bool
    violations: list[str] = []


class OfficeInfo(BaseModel):
    """Office contact information."""
    name: str
    address: str | None = None
    phone: str | None = None
    booking_url: str | None = None


class OfficesResponse(BaseModel):
    """Office listing for a Bundesland."""
    bundesland: str
    offices: list[OfficeInfo] = []
