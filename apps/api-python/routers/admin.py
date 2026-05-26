"""Admin-only intelligence endpoints (RAG ingestion trigger).

Behind the global X-Internal-Key middleware, so only NestJS (which itself
gates the public /admin route behind AdminGuard) can reach this. Reuses the
`ingest_source` logic from scripts/ingest_knowledge.py — no duplication.

Ingestion is synchronous per-source: the caller (admin UI) loops sources for
progress. A run over all 32 sources is slow (fetch + Voyage embed), so the
NestJS proxy uses a long timeout and never retries (a retry could double-write,
though ingest_source is itself idempotent per source).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from fastapi import APIRouter
from supabase import create_client

from config import get_settings
from models import IngestRequest, IngestResponse, IngestSourceResult
from services.embeddings import EmbeddingsService
from services.ingestion import ingest_source

logger = logging.getLogger(__name__)
router = APIRouter()

_SOURCES_PATH = Path(__file__).resolve().parent.parent / "scripts" / "sources.json"


def _load_sources(only: list[str] | None) -> list[dict]:
    with open(_SOURCES_PATH) as f:
        catalog = json.load(f)
    sources = catalog.get("sources", [])
    if only:
        needles = [n.strip() for n in only if n.strip()]
        sources = [s for s in sources if any(n in s["url"] for n in needles)]
    return sources


@router.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest) -> IngestResponse:
    """Run the RAG ingestion pipeline over (a subset of) the curated sources."""
    settings = get_settings()
    sources = _load_sources(request.only)

    embeddings = None
    if not request.dry_run:
        if not settings.VOYAGE_API_KEY:
            return IngestResponse(
                dry_run=False,
                ingested_sources=0,
                total_chunks=0,
                results=[
                    IngestSourceResult(
                        url="(config)",
                        chunks=0,
                        ok=False,
                        error="VOYAGE_API_KEY not configured",
                    )
                ],
            )
        embeddings = EmbeddingsService()

    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)

    results: list[IngestSourceResult] = []
    total = 0
    for entry in sources:
        url = entry["url"]
        try:
            count = ingest_source(
                supabase=supabase,
                embeddings=embeddings,
                source_entry=entry,
                dry_run=request.dry_run,
            )
            total += count
            results.append(IngestSourceResult(url=url, chunks=count, ok=True))
        except Exception as exc:  # one bad source must not abort the run
            logger.exception("Ingestion failed for %s", url)
            results.append(
                IngestSourceResult(url=url, chunks=0, ok=False, error=str(exc))
            )

    return IngestResponse(
        dry_run=request.dry_run,
        ingested_sources=sum(1 for r in results if r.ok),
        total_chunks=total,
        results=results,
    )
