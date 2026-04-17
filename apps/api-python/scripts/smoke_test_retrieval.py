"""Smoke test the RAG retrieval quality end-to-end.

Runs a fixed set of real user questions through `RAGPipeline.retrieve()`
and prints the similarity scores + source URLs for the top-k chunks.
Does NOT call Claude — cheap to run after every corpus change.

Useful for:
- Sanity-checking retrieval after re-ingestion
- Detecting coverage gaps (if a query returns chunks from irrelevant pages)
- Comparing similarity distributions before vs. after an index tune

Run from inside the running api-python container:
    docker compose exec api-python python scripts/smoke_test_retrieval.py

Exit code is non-zero if any query returns zero chunks.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.claude_rag import RAGPipeline  # noqa: E402

# (query, visa_type, bundesland) — includes the four queries that failed
# before the Phase 3a follow-up, plus a couple of controls.
QUERIES: list[tuple[str, str | None, str | None]] = [
    ("What documents do I need for a residence permit?", "student", "DE-BY"),
    ("How do I open a Sperrkonto?", "student", "DE-BY"),
    ("When should I start renewing my visa?", "student", "DE-BY"),
    ("How long does the Anmeldung take?", "student", "DE-BY"),
    # Controls — these worked before the fix too
    ("How does family reunification work?", "family", None),
    ("What is the Niederlassungserlaubnis?", None, None),
]


def main() -> int:
    pipeline = RAGPipeline()
    failures = 0

    for query, visa, land in QUERIES:
        print(f"\n=== Query: {query!r}  (visa={visa}, land={land}) ===")
        chunks = pipeline.retrieve(query=query, visa_type=visa, bundesland=land)
        if not chunks:
            print("  ❌ 0 chunks retrieved")
            failures += 1
            continue

        scores = [c.get("similarity", 0.0) for c in chunks]
        print(
            f"  ✓ {len(chunks)} chunks, "
            f"similarity range {min(scores):.3f}–{max(scores):.3f}"
        )
        for c in chunks:
            sim = c.get("similarity", 0.0)
            src = c.get("source", "?")
            section = (c.get("metadata") or {}).get("section", "?")
            # Truncate source URL display
            src_short = src.replace("https://", "").replace("www.", "")[:60]
            print(f"    {sim:.3f}  [{section}]  {src_short}")

    print(
        f"\n=== Summary: {len(QUERIES) - failures}/{len(QUERIES)} queries "
        f"returned chunks ==="
    )
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
