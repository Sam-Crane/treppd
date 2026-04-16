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
- SUPABASE_URL + SUPABASE_SERVICE_KEY in .env
- pgvector migration already applied: `supabase db push`
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter
from supabase import create_client

# Make the api-python package importable when running from scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import get_settings  # noqa: E402
from services.embeddings import EmbeddingsService  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("ingest")

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
USER_AGENT = (
    "Treppd-RAG-Ingester/0.1 (educational; contact sam@example.com)"
)


def fetch_url(url: str) -> str | None:
    """Fetch a URL and return the rendered text content (HTML stripped)."""
    try:
        with httpx.Client(
            headers={"User-Agent": USER_AGENT},
            timeout=30.0,
            follow_redirects=True,
        ) as client:
            response = client.get(url)
            response.raise_for_status()
    except httpx.HTTPError as e:
        logger.error("Failed to fetch %s: %s", url, e)
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # Drop noisy elements before extracting text
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    # Prefer <main> or <article> if present, otherwise fall back to <body>
    main = soup.find("main") or soup.find("article") or soup.body
    if main is None:
        return None

    text = main.get_text(separator="\n", strip=True)
    # Collapse runs of blank lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text)


def ingest_source(
    supabase,
    embeddings: EmbeddingsService,
    source_entry: dict,
    dry_run: bool = False,
) -> int:
    """Fetch + chunk + embed + upsert one source. Returns chunk count."""
    url = source_entry["url"]
    source_type = source_entry.get("source_type", "manual")
    metadata = source_entry.get("metadata", {})

    logger.info("Ingesting %s", url)
    text = fetch_url(url)
    if not text:
        logger.warning("  no text extracted; skipping")
        return 0

    chunks = chunk_text(text)
    logger.info("  %d chunks (%d chars total)", len(chunks), len(text))

    if dry_run:
        return len(chunks)

    # Idempotency: clear existing chunks for this source first
    supabase.table("knowledge_chunks").delete().eq("source", url).execute()

    embeddings_list = embeddings.embed_documents(chunks)

    rows = [
        {
            "content": chunk,
            "embedding": embedding,
            "source": url,
            "source_type": source_type,
            "metadata": metadata,
            "chunk_index": idx,
        }
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings_list))
    ]

    # Insert in batches (Supabase row-size limits + readability)
    BATCH = 50
    for i in range(0, len(rows), BATCH):
        supabase.table("knowledge_chunks").insert(rows[i : i + BATCH]).execute()

    logger.info("  inserted %d chunks", len(rows))
    return len(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sources",
        default=str(Path(__file__).parent / "sources.json"),
        help="Path to sources.json",
    )
    parser.add_argument(
        "--only",
        help="Substring filter — only ingest URLs containing this string",
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
        sources = [s for s in sources if args.only in s["url"]]
        logger.info("Filtered to %d sources matching %r", len(sources), args.only)

    if not sources:
        logger.error("No sources to ingest")
        return 1

    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY,
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
