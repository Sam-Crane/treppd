"""RAG pipeline for AI Guidance Chat.

Three-stage flow:
1. Embed the user's question via Voyage AI
2. Retrieve top-k similar chunks from `knowledge_chunks` (pgvector)
3. Stream Claude's grounded answer token-by-token

The pipeline writes audit logs (ai_generation_logs) and persists each
turn to ai_conversations on completion.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from anthropic import Anthropic
from supabase import Client, create_client

from config import get_settings
from prompts.chat_prompt import build_chat_system_prompt, trim_history
from services.embeddings import EmbeddingsService, EmbeddingsServiceUnavailable

logger = logging.getLogger(__name__)

CHAT_MODEL = "claude-sonnet-4-20250514"
# Cosine-similarity floor for retrieval. Voyage `voyage-3` query/document
# pairs over a heterogeneous corpus typically score in the 0.25–0.60 range,
# so we keep the floor permissive and let the prompt's safety rules decide
# when retrieved context isn't actually relevant.
RETRIEVAL_THRESHOLD = 0.3
RETRIEVAL_K = 5
HISTORY_KEEP = 8


class RAGPipeline:
    """Retrieval-Augmented Generation over the immigration knowledge base."""

    def __init__(self) -> None:
        settings = get_settings()
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SECRET_KEY,
        )
        self.anthropic = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.embeddings = EmbeddingsService()

    # --------------------------------------------------------------- retrieve

    def retrieve(
        self,
        query: str,
        visa_type: str | None = None,
        bundesland: str | None = None,
        k: int = RETRIEVAL_K,
    ) -> list[dict]:
        """Embed the query and run cosine-similarity search over knowledge_chunks.

        Filters by visa_type and bundesland when provided. Chunks tagged
        with empty arrays for those fields apply to all users (this matches
        the SQL function's logic in 20260320000006_pgvector.sql).
        """
        if not self.embeddings.is_available:
            logger.warning("Embeddings service unavailable; skipping retrieval")
            return []

        try:
            query_embedding = self.embeddings.embed_query(query)
        except EmbeddingsServiceUnavailable:
            return []

        try:
            result = self.supabase.rpc(
                "match_knowledge_chunks",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": RETRIEVAL_THRESHOLD,
                    "match_count": k,
                    "filter_visa_type": visa_type,
                    "filter_bundesland": bundesland,
                },
            ).execute()
        except Exception:
            logger.exception("knowledge_chunks RPC failed")
            return []

        chunks = result.data or []
        if chunks:
            scores = [c.get("similarity", 0.0) for c in chunks]
            logger.info(
                "RAG retrieved %d chunks for query %r (visa=%s, bundesland=%s) "
                "similarity range: %.3f–%.3f",
                len(chunks),
                query[:80],
                visa_type,
                bundesland,
                min(scores),
                max(scores),
            )
        else:
            logger.warning(
                "RAG retrieved 0 chunks for query %r (visa=%s, bundesland=%s, "
                "threshold=%.2f)",
                query[:80],
                visa_type,
                bundesland,
                RETRIEVAL_THRESHOLD,
            )
        return chunks

    # --------------------------------------------------------------- generate

    async def stream_response(
        self,
        user_id: str,
        user_message: str,
        profile: dict,
        conversation_history: list[dict],
        request_id: str | None = None,
    ) -> AsyncIterator[dict]:
        """Stream a grounded answer token-by-token.

        Yields dicts with shape:
        - {"type": "retrieved", "chunks": [{source, similarity, ...}]}
        - {"type": "chunk", "text": "..."} for each token
        - {"type": "done", "message_id": "...", "input_tokens": N, "output_tokens": N}
        - {"type": "error", "message": "..."} if anything fails

        Caller is responsible for adapting these dicts to SSE wire format.
        """
        started = time.time()
        message_id = str(uuid.uuid4())

        chunks = self.retrieve(
            query=user_message,
            visa_type=profile.get("visa_type"),
            bundesland=profile.get("bundesland"),
        )

        # Surface retrieval up front so the UI can render a "thinking..."
        # indicator with source previews while Claude generates.
        yield {
            "type": "retrieved",
            "chunks": [
                {
                    "source": c.get("source"),
                    "source_type": c.get("source_type"),
                    "section": (c.get("metadata") or {}).get("section"),
                    "similarity": c.get("similarity"),
                }
                for c in chunks
            ],
        }

        system_prompt = build_chat_system_prompt(chunks, profile)
        history = trim_history(conversation_history, keep_last=HISTORY_KEEP)
        messages = [
            *history,
            {"role": "user", "content": user_message},
        ]

        full_text_parts: list[str] = []
        input_tokens = 0
        output_tokens = 0

        try:
            with self.anthropic.messages.stream(
                model=CHAT_MODEL,
                max_tokens=1024,
                system=system_prompt,
                messages=messages,
                timeout=60.0,
            ) as stream:
                for text in stream.text_stream:
                    full_text_parts.append(text)
                    yield {"type": "chunk", "text": text}

                final_msg = stream.get_final_message()
                input_tokens = final_msg.usage.input_tokens
                output_tokens = final_msg.usage.output_tokens
        except Exception as e:
            logger.exception("Claude streaming failed")
            yield {"type": "error", "message": str(e)}
            return

        full_response = "".join(full_text_parts)
        latency_ms = int((time.time() - started) * 1000)

        try:
            self._log_generation(
                user_id=user_id,
                profile=profile,
                user_message=user_message,
                response=full_response,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=latency_ms,
                retrieved_chunks=chunks,
            )
            self._append_to_conversation(
                user_id=user_id,
                user_message=user_message,
                assistant_message=full_response,
            )
        except Exception:
            # Don't fail the user-visible stream if audit writes fail.
            logger.exception("Failed to persist chat audit/history")

        yield {
            "type": "done",
            "message_id": message_id,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "latency_ms": latency_ms,
        }

    # ------------------------------------------------------- non-streaming

    async def generate_response(
        self,
        user_id: str,
        user_message: str,
        profile: dict,
        conversation_history: list[dict],
    ) -> dict:
        """Non-streaming variant. Useful for tests and the /ai/chat fallback."""
        full = []
        meta: dict = {}
        async for event in self.stream_response(
            user_id=user_id,
            user_message=user_message,
            profile=profile,
            conversation_history=conversation_history,
        ):
            if event["type"] == "chunk":
                full.append(event["text"])
            elif event["type"] == "done":
                meta = {k: v for k, v in event.items() if k != "type"}
            elif event["type"] == "error":
                return {
                    "response": "I ran into a problem generating that answer. Please try again.",
                    "error": event["message"],
                }
        return {"response": "".join(full), **meta}

    # --------------------------------------------------------- audit writes

    def _log_generation(
        self,
        *,
        user_id: str,
        profile: dict,
        user_message: str,
        response: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: int,
        retrieved_chunks: list[dict],
    ) -> None:
        """Write a row to ai_generation_logs. Strips PII from the input."""
        safe_input = {
            "visa_type": profile.get("visa_type"),
            "bundesland": profile.get("bundesland"),
            "goal": profile.get("goal"),
            "nationality": profile.get("nationality"),
            "message_length": len(user_message),
            "retrieved_count": len(retrieved_chunks),
        }
        safe_output = {
            "response_length": len(response),
            "sources": [c.get("source") for c in retrieved_chunks],
        }

        self.supabase.table("ai_generation_logs").insert(
            {
                "operation": "chat",
                "user_id": user_id,
                "input_payload": safe_input,
                "output_payload": safe_output,
                "model_used": CHAT_MODEL,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms,
            }
        ).execute()

    def _append_to_conversation(
        self,
        *,
        user_id: str,
        user_message: str,
        assistant_message: str,
    ) -> None:
        """Append two messages to the user's most recent conversation row.

        Schema stores `messages` as a JSONB array of {role, content, ts} dicts.
        """
        now = datetime.now(timezone.utc).isoformat()
        new_messages = [
            {"role": "user", "content": user_message, "ts": now},
            {"role": "assistant", "content": assistant_message, "ts": now},
        ]

        existing = (
            self.supabase.table("ai_conversations")
            .select("id,messages")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if existing.data:
            row = existing.data[0]
            current_messages = row.get("messages") or []
            self.supabase.table("ai_conversations").update(
                {
                    "messages": current_messages + new_messages,
                    "updated_at": now,
                }
            ).eq("id", row["id"]).execute()
        else:
            self.supabase.table("ai_conversations").insert(
                {
                    "user_id": user_id,
                    "messages": new_messages,
                    "context_type": "general",
                }
            ).execute()

    def get_history(self, user_id: str) -> list[dict]:
        """Fetch the user's most recent conversation messages."""
        result = (
            self.supabase.table("ai_conversations")
            .select("messages")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not result.data:
            return []
        return result.data[0].get("messages") or []

    def clear_history(self, user_id: str) -> None:
        """GDPR: delete all conversation history for a user."""
        self.supabase.table("ai_conversations").delete().eq(
            "user_id", user_id
        ).execute()


# Module-level singleton, lazily initialised so importing this module
# doesn't require env vars to be set (matches the roadmap_service pattern).
_pipeline: RAGPipeline | None = None


def get_pipeline() -> RAGPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = RAGPipeline()
    return _pipeline


def to_sse(event: dict) -> bytes:
    """Format a streamed event as an SSE wire frame."""
    return f"data: {json.dumps(event)}\n\n".encode("utf-8")
