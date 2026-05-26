"""Render a Treppd-branded "filled summary" PDF.

Deliberately NOT an overwrite of an official government form — that's legally
sensitive and the upstream PDFs are brittle/flattened. Instead we produce a
clean summary the user transcribes onto the official form, with a prominent
disclaimer. reportlab is imported lazily so the app boots without it.
"""

from __future__ import annotations

import base64
import io
import logging

logger = logging.getLogger(__name__)

_DISCLAIMER = (
    "This is a Treppd preparation summary, not an official form. Transcribe "
    "these values onto the official form and verify with your local "
    "Auslaenderbehoerde. Educational guidance, not legal advice."
)


def render_summary_pdf(form_name: str, fields: list[dict]) -> bytes:
    """fields: [{"label": str, "value": str}]. Returns PDF bytes."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
    )
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Treppd — {form_name}",
    )
    styles = getSampleStyleSheet()
    small = ParagraphStyle(
        "small", parent=styles["Normal"], fontSize=8, textColor=colors.grey
    )

    story = [
        Paragraph("Treppd — Form preparation summary", styles["Title"]),
        Paragraph(form_name, styles["Heading2"]),
        Spacer(1, 0.3 * cm),
        Paragraph(_DISCLAIMER, small),
        Spacer(1, 0.5 * cm),
    ]

    rows = [["Field", "Your answer"]]
    for f in fields:
        rows.append([str(f.get("label", "")), str(f.get("value", "") or "—")])

    table = Table(rows, colWidths=[7 * cm, 9 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(table)

    doc.build(story)
    return buffer.getvalue()


def render_summary_pdf_base64(form_name: str, fields: list[dict]) -> str:
    return base64.b64encode(render_summary_pdf(form_name, fields)).decode("ascii")
