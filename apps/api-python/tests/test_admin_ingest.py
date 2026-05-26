"""Tests for the admin RAG-ingestion endpoint (routers/admin.py).

Mocks the shared ingest_source helper, the embeddings service, and the
Supabase client factory so nothing touches the network or DB. conftest stubs
env vars; the X-Internal-Key header is required by the global middleware.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)
HEADERS = {"X-Internal-Key": "test-internal-key-long-enough-16"}

SOURCES = [
    {"url": "https://a.example/bank-account", "source_type": "x", "metadata": {}},
    {"url": "https://b.example/registration", "source_type": "x", "metadata": {}},
    {"url": "https://c.example/sperrkonto", "source_type": "x", "metadata": {}},
]


def test_requires_internal_key():
    resp = client.post("/admin/ingest", json={"dry_run": True})
    assert resp.status_code == 403


def test_dry_run_does_not_embed_or_write():
    with patch("routers.admin._load_sources", return_value=SOURCES), patch(
        "routers.admin.create_client"
    ), patch(
        "routers.admin.EmbeddingsService"
    ) as embeddings_factory, patch(
        "routers.admin.ingest_source", return_value=3
    ) as ingest:
        resp = client.post("/admin/ingest", json={"dry_run": True}, headers=HEADERS)

    assert resp.status_code == 200
    body = resp.json()
    assert body["dry_run"] is True
    assert body["ingested_sources"] == 3
    assert body["total_chunks"] == 9
    # Dry run must not construct the embeddings client
    embeddings_factory.assert_not_called()
    # ingest_source is called once per source with dry_run propagated
    assert ingest.call_count == 3
    assert ingest.call_args.kwargs["dry_run"] is True


def test_only_filter_narrows_sources():
    captured = {}

    def fake_load(only):
        captured["only"] = only
        return [SOURCES[0]]

    with patch("routers.admin._load_sources", side_effect=fake_load), patch(
        "routers.admin.create_client"
    ), patch("routers.admin.EmbeddingsService"), patch(
        "routers.admin.ingest_source", return_value=2
    ):
        resp = client.post(
            "/admin/ingest",
            json={"only": ["bank-account"], "dry_run": True},
            headers=HEADERS,
        )

    assert resp.status_code == 200
    assert captured["only"] == ["bank-account"]
    assert resp.json()["ingested_sources"] == 1


def test_per_source_error_is_caught_not_fatal():
    def flaky(*, source_entry, **_):
        if "registration" in source_entry["url"]:
            raise RuntimeError("boom")
        return 4

    with patch("routers.admin._load_sources", return_value=SOURCES), patch(
        "routers.admin.get_settings"
    ) as get_settings, patch("routers.admin.create_client"), patch(
        "routers.admin.EmbeddingsService", return_value=MagicMock()
    ), patch("routers.admin.ingest_source", side_effect=flaky):
        settings = MagicMock()
        settings.VOYAGE_API_KEY = "voyage-test-key"
        settings.SUPABASE_URL = "https://test.supabase.co"
        settings.SUPABASE_SECRET_KEY = "sb_secret_test"
        get_settings.return_value = settings
        resp = client.post("/admin/ingest", json={"dry_run": False}, headers=HEADERS)

    assert resp.status_code == 200
    body = resp.json()
    assert body["ingested_sources"] == 2  # two ok, one failed
    assert body["total_chunks"] == 8
    failed = [r for r in body["results"] if not r["ok"]]
    assert len(failed) == 1
    assert "boom" in failed[0]["error"]


def test_missing_voyage_key_reported_not_crash():
    with patch("routers.admin._load_sources", return_value=SOURCES), patch(
        "routers.admin.get_settings"
    ) as get_settings:
        settings = MagicMock()
        settings.VOYAGE_API_KEY = ""
        settings.SUPABASE_URL = "https://test.supabase.co"
        settings.SUPABASE_SECRET_KEY = "sb_secret_test"
        get_settings.return_value = settings

        resp = client.post("/admin/ingest", json={"dry_run": False}, headers=HEADERS)

    assert resp.status_code == 200
    body = resp.json()
    assert body["ingested_sources"] == 0
    assert "VOYAGE_API_KEY" in body["results"][0]["error"]
