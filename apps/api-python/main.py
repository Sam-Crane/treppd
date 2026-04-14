import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from config import get_settings
from logging_config import configure_logging, request_id_ctx
from routers import roadmap, ai, rules

# Validate env at import time — raises ValidationError with readable output
# listing every missing or malformed variable.
settings = get_settings()

configure_logging(level="DEBUG" if settings.ENVIRONMENT == "development" else "INFO")
logger = logging.getLogger(__name__)

app = FastAPI(title="Treppd Intelligence API", version="1.0.0")


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Assign or propagate X-Request-ID for correlation across services."""
    incoming = request.headers.get("X-Request-ID")
    req_id = incoming if incoming else str(uuid.uuid4())
    token = request_id_ctx.set(req_id)
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
    finally:
        request_id_ctx.reset(token)


@app.middleware("http")
async def validate_internal_key(request: Request, call_next):
    if request.url.path in ("/health", "/docs", "/openapi.json"):
        return await call_next(request)
    key = request.headers.get("X-Internal-Key")
    if not settings.INTERNAL_API_KEY or key != settings.INTERNAL_API_KEY:
        logger.warning(
            "Rejected request without valid internal key",
            extra={"path": request.url.path},
        )
        return JSONResponse(
            status_code=403,
            content={"detail": "Invalid internal key"},
        )
    return await call_next(request)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "api-python"}


app.include_router(roadmap.router, prefix="/roadmap", tags=["roadmap"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(rules.router, prefix="/rules", tags=["rules"])

logger.info("FastAPI intelligence service initialised")
