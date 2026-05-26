"""Ingest the curated knowledge base into Supabase pgvector.

Run from `apps/api-python/`:
    python scripts/ingest_knowledge.py

Reads `scripts/sources.json`, fetches each URL, strips HTML, splits into
~1000-char chunks (200-char overlap), embeds via Voyage AI, and writes
to the `knowledge_chunks` table.

The script is idempotent: it deletes existing chunks for a `source` URL
before re-ingesting, so it's safe to run repeatedly without duplicates.

Requires:
- VOYAGE_API_KEY in .env (or shell)
- SUPABASE_URL + SUPABASE_SECRET_KEY in .env
- pgvector migration already applied: `supabase db push`
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

from supabase import create_client

# Make the api-python package importable when running from scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import get_settings  # noqa: E402
from services.embeddings import EmbeddingsService  # noqa: E402
from services.ingestion import ingest_source  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("ingest")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sources",
        default=str(Path(__file__).parent / "sources.json"),
        help="Path to sources.json",
    )
    parser.add_argument(
        "--only",
        help=(
            "Substring filter — only ingest URLs containing this string. "
            "Accepts a comma-separated list to match multiple substrings, "
            "e.g. --only 'bank-account,registration,sperrkonto'."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and chunk but do not embed or write to DB",
    )
    args = parser.parse_args()

    settings = get_settings()

    if not args.dry_run and not settings.VOYAGE_API_KEY:
        logger.error(
            "VOYAGE_API_KEY is not set. Either configure it in .env or use --dry-run.",
        )
        return 1

    with open(args.sources) as f:
        catalog = json.load(f)

    sources = catalog.get("sources", [])
    if args.only:
        needles = [n.strip() for n in args.only.split(",") if n.strip()]
        sources = [s for s in sources if any(n in s["url"] for n in needles)]
        logger.info(
            "Filtered to %d sources matching %d substring(s): %s",
            len(sources),
            len(needles),
            needles,
        )

    if not sources:
        logger.error("No sources to ingest")
        return 1

    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY,
    )
    embeddings = EmbeddingsService() if not args.dry_run else None

    total_chunks = 0
    started = time.time()
    for entry in sources:
        try:
            count = ingest_source(
                supabase=supabase,
                embeddings=embeddings,
                source_entry=entry,
                dry_run=args.dry_run,
            )
            total_chunks += count
        except Exception:
            logger.exception("Failed to ingest %s", entry["url"])

    elapsed = time.time() - started
    logger.info(
        "Done. %d chunks across %d sources in %.1fs",
        total_chunks,
        len(sources),
        elapsed,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
