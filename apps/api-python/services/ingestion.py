"""Shared RAG ingestion logic: fetch -> chunk -> embed -> upsert.

Used by both the CLI (scripts/ingest_knowledge.py) and the admin HTTP
endpoint (routers/admin.py). The heavy scrape/parse dependencies
(trafilatura, beautifulsoup4, langchain_text_splitters) are imported lazily
inside the functions that need them, so importing this module — and therefore
booting the FastAPI app — does NOT require those packages to be installed.
"""

from __future__ import annotations

import logging

import httpx

logger = logging.getLogger("ingestion")

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
USER_AGENT = "Treppd-RAG-Ingester/0.1 (educational; contact sam@example.com)"


def fetch_url(url: str) -> str | None:
    """Fetch a URL and return the main article text.

    Uses trafilatura's purpose-built extractor first (handles 90%+ of
    news/government CMS layouts including the legacy ones — service.berlin.de,
    BAMF templated pages — that don't use semantic <main>/<article> tags).
    Falls back to a hand-rolled BeautifulSoup pass when trafilatura's
    main-content detection comes up empty.
    """
    import trafilatura
    from bs4 import BeautifulSoup

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

    html = response.text

    extracted = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=True,
        favor_recall=True,
        no_fallback=False,
    )
    if extracted and len(extracted.strip()) > 200:
        lines = [line.strip() for line in extracted.splitlines() if line.strip()]
        return "\n".join(lines)

    logger.info("  trafilatura returned <200 chars; falling back to BeautifulSoup")
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()
    main = soup.find("main") or soup.find("article") or soup.body
    if main is None:
        return None
    text = main.get_text(separator="\n", strip=True)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks for embedding."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text)


def ingest_source(
    supabase,
    embeddings,
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

    BATCH = 50
    for i in range(0, len(rows), BATCH):
        supabase.table("knowledge_chunks").insert(rows[i : i + BATCH]).execute()

    logger.info("  inserted %d chunks", len(rows))
    return len(rows)
