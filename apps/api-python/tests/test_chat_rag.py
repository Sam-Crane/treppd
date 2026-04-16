"""Tests for the AI chat RAG pipeline.

Mocks Voyage embeddings, Anthropic streaming, and Supabase RPC calls.
The conftest.py at the test-suite level installs stub env vars so the
service module can import cleanly.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

# Ensure modules importable as dotted paths for patch().
import services.claude_rag  # noqa: F401
from prompts.chat_prompt import (
    build_chat_system_prompt,
    trim_history,
)


# ----------------------------------------------------------- prompt builder


class TestChatSystemPrompt:
    def test_includes_safety_disclaimers(self):
        prompt = build_chat_system_prompt(
            chunks=[],
            profile={
                "visa_type": "student",
                "bundesland": "DE-BY",
                "nationality": "NG",
                "goal": "initial_setup",
            },
        )
        # Core safety phrases must appear verbatim
        assert "Rechtsanwalt" in prompt
        assert "educational guidance, not legal advice" in prompt
        assert "DE-BY" in prompt
        assert "Auslaenderbehoerde" in prompt or "Ausl\u00e4nderbeh\u00f6rde" in prompt

    def test_includes_retrieved_chunks(self):
        chunks = [
            {
                "source": "https://www.bamf.de/example",
                "content": "Anmeldung must be completed within 14 days.",
            }
        ]
        prompt = build_chat_system_prompt(
            chunks=chunks,
            profile={"visa_type": "student", "bundesland": "DE-BY"},
        )
        assert "https://www.bamf.de/example" in prompt
        assert "14 days" in prompt

    def test_handles_empty_chunks(self):
        prompt = build_chat_system_prompt(
            chunks=[],
            profile={"visa_type": "work", "bundesland": "DE-BE"},
        )
        # Must include a fallback marker so Claude knows context is empty
        assert "no relevant context" in prompt.lower()


class TestTrimHistory:
    def test_keeps_only_last_n(self):
        history = [{"role": "user", "content": str(i)} for i in range(20)]
        trimmed = trim_history(history, keep_last=8)
        assert len(trimmed) == 8
        assert trimmed[-1]["content"] == "19"

    def test_returns_all_when_under_limit(self):
        history = [{"role": "user", "content": "x"}]
        assert trim_history(history, keep_last=8) == history


# --------------------------------------------------------- pipeline retrieve


@pytest.fixture
def pipeline():
    """Build a RAGPipeline with all external clients mocked."""
    env = {
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_SERVICE_KEY": "test-key",
        "ANTHROPIC_API_KEY": "test-key",
        "INTERNAL_API_KEY": "test-internal-key-long-enough",
        "VOYAGE_API_KEY": "test-voyage-key",
    }
    with patch.dict("os.environ", env), \
         patch("services.claude_rag.create_client") as mock_sb_create, \
         patch("services.claude_rag.Anthropic") as mock_anthropic, \
         patch("services.claude_rag.EmbeddingsService") as mock_embeddings_cls:

        # Refresh the cached settings since env changed
        from config import get_settings
        get_settings.cache_clear()

        mock_supabase = MagicMock()
        mock_sb_create.return_value = mock_supabase

        mock_anthropic_client = MagicMock()
        mock_anthropic.return_value = mock_anthropic_client

        mock_embeddings = MagicMock()
        mock_embeddings.is_available = True
        mock_embeddings.embed_query.return_value = [0.1] * 1024
        mock_embeddings_cls.return_value = mock_embeddings

        from services.claude_rag import RAGPipeline
        pipe = RAGPipeline()
        pipe.supabase = mock_supabase
        pipe.anthropic = mock_anthropic_client
        pipe.embeddings = mock_embeddings
        yield pipe
        get_settings.cache_clear()


class TestRetrieve:
    def test_returns_empty_when_embeddings_unavailable(self, pipeline):
        pipeline.embeddings.is_available = False
        result = pipeline.retrieve("How long does Anmeldung take?")
        assert result == []

    def test_passes_filters_to_rpc(self, pipeline):
        rpc_mock = MagicMock()
        rpc_mock.execute.return_value = MagicMock(data=[])
        pipeline.supabase.rpc.return_value = rpc_mock

        pipeline.retrieve(
            "What about residence permit?",
            visa_type="student",
            bundesland="DE-BY",
        )

        pipeline.supabase.rpc.assert_called_once()
        args, kwargs = pipeline.supabase.rpc.call_args
        assert args[0] == "match_knowledge_chunks"
        rpc_args = args[1]
        assert rpc_args["filter_visa_type"] == "student"
        assert rpc_args["filter_bundesland"] == "DE-BY"
        assert rpc_args["match_count"] == 5
        assert len(rpc_args["query_embedding"]) == 1024

    def test_returns_chunks_from_rpc(self, pipeline):
        chunks = [
            {
                "id": "c1",
                "content": "Anmeldung within 14 days",
                "source": "bamf.de/...",
                "similarity": 0.85,
            }
        ]
        rpc_mock = MagicMock()
        rpc_mock.execute.return_value = MagicMock(data=chunks)
        pipeline.supabase.rpc.return_value = rpc_mock

        result = pipeline.retrieve("Anmeldung deadline?")
        assert result == chunks

    def test_handles_rpc_failure_gracefully(self, pipeline):
        pipeline.supabase.rpc.side_effect = Exception("DB error")
        result = pipeline.retrieve("Anything")
        assert result == []


# -------------------------------------------------------- pipeline generate


class TestGenerateResponse:
    @pytest.mark.asyncio
    async def test_yields_retrieved_then_chunks_then_done(self, pipeline):
        """A successful turn should emit retrieved → chunks → done events."""
        rpc_mock = MagicMock()
        rpc_mock.execute.return_value = MagicMock(data=[
            {"content": "X", "source": "src", "metadata": {}, "similarity": 0.8},
        ])
        pipeline.supabase.rpc.return_value = rpc_mock

        # Mock the Anthropic streaming context manager
        stream_mock = MagicMock()
        stream_mock.text_stream = iter(["Hello, ", "world."])
        final_msg = MagicMock()
        final_msg.usage.input_tokens = 100
        final_msg.usage.output_tokens = 50
        stream_mock.get_final_message.return_value = final_msg

        pipeline.anthropic.messages.stream.return_value.__enter__.return_value = stream_mock
        pipeline.anthropic.messages.stream.return_value.__exit__.return_value = False

        # Mock the audit + history writes
        pipeline.supabase.table.return_value.insert.return_value.execute.return_value = (
            MagicMock()
        )
        pipeline.supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=[])

        events = []
        async for event in pipeline.stream_response(
            user_id="u1",
            user_message="Hi",
            profile={"visa_type": "student", "bundesland": "DE-BY"},
            conversation_history=[],
        ):
            events.append(event)

        types = [e["type"] for e in events]
        assert types[0] == "retrieved"
        assert types[1] == "chunk" and events[1]["text"] == "Hello, "
        assert types[2] == "chunk" and events[2]["text"] == "world."
        assert types[-1] == "done"
        assert events[-1]["input_tokens"] == 100
        assert events[-1]["output_tokens"] == 50

    @pytest.mark.asyncio
    async def test_yields_error_on_anthropic_failure(self, pipeline):
        rpc_mock = MagicMock()
        rpc_mock.execute.return_value = MagicMock(data=[])
        pipeline.supabase.rpc.return_value = rpc_mock

        pipeline.anthropic.messages.stream.side_effect = RuntimeError("api down")

        events = []
        async for event in pipeline.stream_response(
            user_id="u1",
            user_message="Hi",
            profile={"visa_type": "student", "bundesland": "DE-BY"},
            conversation_history=[],
        ):
            events.append(event)

        assert events[0]["type"] == "retrieved"
        assert events[1]["type"] == "error"
        assert "api down" in events[1]["message"]


# ---------------------------------------------------------------- to_sse


class TestSSEFormatting:
    def test_to_sse_emits_data_prefix_and_double_newline(self):
        from services.claude_rag import to_sse
        frame = to_sse({"type": "chunk", "text": "hi"})
        assert frame.startswith(b"data: ")
        assert frame.endswith(b"\n\n")
        assert b'"type": "chunk"' in frame
