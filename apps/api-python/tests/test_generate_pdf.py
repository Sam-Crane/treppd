"""Tests for the form PDF endpoint (routers/forms.py).

The reportlab render is mocked so the test doesn't require the (heavy) lib;
a separate importorskip test exercises the real renderer when reportlab is
installed (CI), verifying it emits a valid PDF.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)
HEADERS = {"X-Internal-Key": "test-internal-key-long-enough-16"}


def test_requires_internal_key():
    resp = client.post("/forms/generate-pdf", json={"form_name": "X", "fields": []})
    assert resp.status_code == 403


def test_returns_base64_and_slugified_filename():
    with patch(
        "routers.forms.render_summary_pdf_base64", return_value="QkFTRTY0"
    ) as render:
        resp = client.post(
            "/forms/generate-pdf",
            json={
                "form_name": "Address Registration (Bavaria)",
                "fields": [{"label": "Last name", "value": "Müller"}],
            },
            headers=HEADERS,
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["pdf_base64"] == "QkFTRTY0"
    assert body["filename"] == "treppd-address-registration-bavaria.pdf"
    render.assert_called_once()


def test_real_render_emits_pdf_when_reportlab_present():
    pytest.importorskip("reportlab")
    from services.pdf_fill import render_summary_pdf

    pdf = render_summary_pdf("Test Form", [{"label": "Name", "value": "X"}])
    assert pdf[:4] == b"%PDF"
