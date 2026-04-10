import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from routers import roadmap, ai, rules

app = FastAPI(title="Treppd Intelligence API", version="1.0.0")

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")


@app.middleware("http")
async def validate_internal_key(request: Request, call_next):
    if request.url.path in ("/health", "/docs", "/openapi.json"):
        return await call_next(request)
    key = request.headers.get("X-Internal-Key")
    if not INTERNAL_API_KEY or key != INTERNAL_API_KEY:
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
