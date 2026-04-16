"""Voyage AI embeddings client for the RAG pipeline.

Wraps the official `voyageai` SDK with batching, retry, and graceful
behaviour when the API key is missing (so the FastAPI service still
boots — chat endpoints just refuse).

Why Voyage:
- Anthropic's official embedding partner, optimised for retrieval
  quality with Claude
- voyage-3 model returns 1024-dim vectors (matches our pgvector schema)
- Free tier covers ~200K tokens/month, enough for the BAMF +
  Make-it-in-Germany corpus (~50K tokens of source text)
"""

import logging
import time
from typing import Literal

import voyageai
from voyageai.error import RateLimitError

from config import get_settings

logger = logging.getLogger(__name__)

# voyage-3 returns 1024-dim vectors. If we ever switch to voyage-3-large
# (2048-dim) or voyage-code-3, the pgvector migration must be re-run with
# the matching dimension.
EMBEDDING_MODEL = "voyage-3"
EMBEDDING_DIMENSION = 1024

# Voyage's max batch size and per-request token budget.
MAX_BATCH_SIZE = 128
MAX_BATCH_TOKENS = 120_000

# Voyage rate limits:
# - Free tier WITHOUT a payment method: 3 RPM (one request every 20s)
# - Free tier WITH a payment method: 2000 RPM (no perceptible pacing needed)
#
# Set VOYAGE_FREE_TIER=1 in .env to opt into the conservative pacing path.
# When enabled: batch=1 chunk per request, sleep 22s between requests, and
# back off retries far enough to clear the per-minute window.
import os  # noqa: E402

FREE_TIER = os.environ.get("VOYAGE_FREE_TIER", "").strip() in ("1", "true", "yes")
PACING_BATCH_SIZE = 1 if FREE_TIER else MAX_BATCH_SIZE
PACING_SLEEP_SECONDS = 22.0 if FREE_TIER else 0.25
PACING_RETRY_BASE = 25.0 if FREE_TIER else 2.0


class EmbeddingsServiceUnavailable(RuntimeError):
    """Raised when VOYAGE_API_KEY is missing or the client refuses."""


class EmbeddingsService:
    """Embedding generation via Voyage AI."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.VOYAGE_API_KEY:
            self._client: voyageai.Client | None = None
            logger.warning(
                "VOYAGE_API_KEY is not set; chat retrieval will be unavailable",
            )
            return

        self._client = voyageai.Client(api_key=settings.VOYAGE_API_KEY)

    @property
    def is_available(self) -> bool:
        return self._client is not None

    def _require_client(self) -> voyageai.Client:
        if self._client is None:
            raise EmbeddingsServiceUnavailable(
                "VOYAGE_API_KEY is not configured",
            )
        return self._client

    def embed_query(self, text: str) -> list[float]:
        """Embed a single user query for similarity search.

        Uses input_type="query" — Voyage applies query-specific
        normalisation that improves retrieval against document
        embeddings (which use input_type="document").
        """
        client = self._require_client()
        result = self._with_retry(
            lambda: client.embed(
                texts=[text],
                model=EMBEDDING_MODEL,
                input_type="query",
            ),
        )
        return result.embeddings[0]

    def embed_documents(
        self,
        texts: list[str],
        input_type: Literal["document", "query"] = "document",
    ) -> list[list[float]]:
        """Embed a batch of documents (or queries) for ingestion.

        Splits the input into batches that respect Voyage's per-request
        size and token limits, with a small sleep between calls to stay
        under the free-tier RPM ceiling.
        """
        client = self._require_client()
        if not texts:
            return []

        embeddings: list[list[float]] = []
        batches = list(_batched(texts, PACING_BATCH_SIZE))
        for i, batch in enumerate(batches):
            result = self._with_retry(
                lambda b=batch: client.embed(
                    texts=b,
                    model=EMBEDDING_MODEL,
                    input_type=input_type,
                ),
            )
            embeddings.extend(result.embeddings)
            # Sleep BETWEEN requests (not after the last) to fit rate limits.
            if i < len(batches) - 1:
                time.sleep(PACING_SLEEP_SECONDS)

        return embeddings

    @staticmethod
    def _with_retry(fn, max_retries: int = 3, base_delay: float = PACING_RETRY_BASE):
        """Retry on rate-limit errors with exponential backoff."""
        last_error: Exception | None = None
        for attempt in range(max_retries + 1):
            try:
                return fn()
            except RateLimitError as e:
                last_error = e
                if attempt == max_retries:
                    break
                wait = base_delay * (2**attempt)
                logger.warning(
                    "Voyage rate limited; retrying in %.1fs (attempt %d/%d)",
                    wait,
                    attempt + 1,
                    max_retries,
                )
                time.sleep(wait)
        raise last_error or RuntimeError("Voyage retries exhausted")


def _batched(items: list, size: int):
    """Yield successive `size`-chunks from `items`."""
    for i in range(0, len(items), size):
        yield items[i : i + size]
