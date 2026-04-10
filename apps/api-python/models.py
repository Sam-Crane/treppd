"""Pydantic models shared across routers.

These models define the interface contract between NestJS and FastAPI.
The auto-generated OpenAPI spec from these models is the agreed API contract
that both services must conform to.
"""

from typing import Dict, List, Optional

from pydantic import BaseModel


# === Request Models ===

class UserProfile(BaseModel):
    """User immigration profile sent from NestJS."""
    user_id: str
    nationality: str
    visa_type: str
    bundesland: str
    city: Optional[str] = None
    goal: str
    arrival_date: Optional[str] = None
    visa_expiry_date: Optional[str] = None
    employer_name: Optional[str] = None
    university_name: Optional[str] = None
    completed_steps: List[str] = []


class ChatRequest(BaseModel):
    """Chat message request from NestJS."""
    user_id: str
    message: str
    context_type: Optional[str] = "general"
    conversation_history: List[dict] = []
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
    step_slugs: List[str]


class SequenceRequest(BaseModel):
    """Step sequence validation request."""
    completed_steps: List[str]
    target_step: str


# === Response Models ===

class DocumentRequirement(BaseModel):
    """Document needed for a roadmap step."""
    document_name_en: str
    document_name_de: str
    specifications: Optional[dict] = None
    needs_certified_copy: bool = False
    needs_translation: bool = False
    needs_apostille: bool = False
    where_to_get: Optional[str] = None
    estimated_cost_eur: Optional[float] = None


class RoadmapStep(BaseModel):
    """Single step in a generated roadmap."""
    slug: str
    title: str
    explanation: str
    office: str
    can_do_online: bool
    estimated_days: int
    depends_on: List[str] = []
    documents_needed: List[DocumentRequirement] = []
    tips: List[str] = []
    deadline: Optional[str] = None
    ai_suggested: bool = False
    source_verified: bool = True


class RoadmapResponse(BaseModel):
    """Full roadmap generation response."""
    roadmap_id: str
    steps: List[RoadmapStep]
    ai_enriched: bool
    ai_fallback: bool
    generated_at: str
    expires_at: str


class ChatResponse(BaseModel):
    """AI chat response."""
    response: str
    updated_history: List[dict]


class FieldExplainResponse(BaseModel):
    """Form field explanation response."""
    explanation: str
    tips: List[str] = []
    example: str = ""


class AppointmentEmailResponse(BaseModel):
    """Generated appointment email."""
    subject: str
    body: str


class DeadlineResponse(BaseModel):
    """Computed deadlines for steps."""
    deadlines: Dict[str, Optional[str]]


class SequenceResponse(BaseModel):
    """Step sequence validation result."""
    valid: bool
    violations: List[str] = []


class OfficeInfo(BaseModel):
    """Office contact information."""
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    booking_url: Optional[str] = None


class OfficesResponse(BaseModel):
    """Office listing for a Bundesland."""
    bundesland: str
    offices: List[OfficeInfo] = []
