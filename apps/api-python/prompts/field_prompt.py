"""System prompt builder for the Form-Filling Guide `/ai/explain-field`.

Unlike the RAG chat (prompts/chat_prompt.py), this prompt is narrowly
scoped: the answer must come from a single `FormField` record plus the
user's profile. No retrieval, no browsing, no invention.

Claude returns a strictly structured JSON object so the frontend can
render the explanation panel deterministically:

    {"explanation": "…", "tips": ["…", …], "example": "…"}

Safety rules (identical in intent to chat_prompt.py):
- Never invent form names, fees, deadlines, office requirements
- Frame as educational guidance, not legal advice
- Recommend Rechtsanwalt for complex/legal cases
- Use plain English; explain German terms in parens on first use
"""

from __future__ import annotations

import json


_BUNDESLAND_NAMES = {
    "DE-BW": "Baden-Württemberg",
    "DE-BY": "Bavaria (Bayern)",
    "DE-BE": "Berlin",
    "DE-BB": "Brandenburg",
    "DE-HB": "Bremen",
    "DE-HH": "Hamburg",
    "DE-HE": "Hesse (Hessen)",
    "DE-MV": "Mecklenburg-Vorpommern",
    "DE-NI": "Lower Saxony (Niedersachsen)",
    "DE-NW": "North Rhine-Westphalia (Nordrhein-Westfalen)",
    "DE-RP": "Rhineland-Palatinate (Rheinland-Pfalz)",
    "DE-SL": "Saarland",
    "DE-SN": "Saxony (Sachsen)",
    "DE-ST": "Saxony-Anhalt (Sachsen-Anhalt)",
    "DE-SH": "Schleswig-Holstein",
    "DE-TH": "Thuringia (Thüringen)",
}


def _format_profile(profile: dict) -> str:
    visa = profile.get("visa_type", "unknown visa type")
    bundesland = profile.get("bundesland") or "unspecified state"
    bundesland_name = _BUNDESLAND_NAMES.get(bundesland, bundesland)
    nationality = profile.get("nationality", "unknown nationality")
    goal = profile.get("goal", "unspecified goal")
    return (
        f"- Visa type: {visa}\n"
        f"- Bundesland: {bundesland_name} ({bundesland})\n"
        f"- Nationality: {nationality}\n"
        f"- Goal: {goal}"
    )


def _format_field(form: dict, field: dict) -> str:
    """Render the field's static metadata as a readable context block."""
    common_mistakes = field.get("common_mistakes") or []
    mistakes_block = (
        "\n".join(f"  - {m}" for m in common_mistakes)
        if common_mistakes
        else "  (none recorded)"
    )
    required = "yes" if field.get("required") else "no"
    return (
        f"FORM: {form.get('name_en', '?')} "
        f"({form.get('name_de', '?')})\n"
        f"Form code: {form.get('form_code', '?')}\n"
        f"Applicable Bundeslaender: {form.get('bundeslaender') or 'all'}\n"
        f"Applicable visa types: {form.get('visa_types') or 'all'}\n"
        f"\n"
        f"FIELD: {field.get('label_en', '?')} "
        f"({field.get('label_de', '?')})\n"
        f"Field ID: {field.get('field_id', '?')}\n"
        f"Input type: {field.get('input_type', '?')}\n"
        f"Required: {required}\n"
        f"\n"
        f"OFFICIAL INSTRUCTIONS (verbatim, do not contradict):\n"
        f"{field.get('instructions_en', '(none)').strip()}\n"
        f"\n"
        f"COMMON MISTAKES (documented on the form or its FAQ):\n"
        f"{mistakes_block}\n"
        f"\n"
        f"CANONICAL EXAMPLE VALUE: {field.get('example_value', '(none)')}"
    )


def build_field_explain_system_prompt(
    form: dict,
    field: dict,
    profile: dict,
) -> str:
    """Compose the system prompt for a single /ai/explain-field call.

    The prompt is structured so Claude can only draw from:
      1. The field's official `instructions_en`, `common_mistakes`,
         and `example_value` (from the `FormField` JSONB).
      2. The user's profile (visa_type, bundesland, nationality, goal).

    Claude returns STRICT JSON with three keys: `explanation`, `tips`,
    `example`. The pipeline parses this JSON; any other output format
    is an error.
    """
    return f"""You are Treppd, a careful assistant helping a non-EU immigrant fill in an official German form.

USER PROFILE:
{_format_profile(profile)}

CONTEXT — SINGLE FIELD ON A SINGLE FORM:
{_format_field(form, field)}

ANSWERING RULES (non-negotiable):

1. **Ground every sentence in the CONTEXT block above.** Do not invent rules, deadlines, fees, or document requirements. If the user's profile demands a specification the context does not cover, say so and recommend their local Auslaenderbehoerde.

2. **Personalise to the user's profile.** Adapt wording and `example` to the user's visa type, Bundesland, and goal. If the profile suggests an edge case (e.g. dual nationality, minor child, change of purpose), mention it briefly.

3. **Never invent an example.** The `example` MUST be realistic for the user's profile and consistent with the canonical example above. If the canonical example is a placeholder (empty string, etc.), produce a typical plausible value instead — never fabricate specific dates, passport numbers, or personal data.

4. **Plain English with German glossary.** When you use a German term (Anmeldung, Aufenthaltstitel, Sperrkonto, Meldebescheinigung), include a short English gloss in parens on first use.

5. **Recommend professional help when warranted.** For legal questions, contested facts, or deportation risk: recommend "a qualified immigration lawyer (Rechtsanwalt fuer Auslaenderrecht)". For Bundesland-specific uncertainty, recommend "your local Auslaenderbehoerde".

6. **Frame as educational, not legal.** This is guidance, not legal advice. Keep the tone helpful and concrete.

7. **Output format.** Respond with EXACTLY one JSON object, no prose before or after, no markdown fencing. Schema:

{{
  "explanation": "<2-4 sentences in plain English explaining the field and what the user should enter, tailored to their profile>",
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>", "<optional tip 4>", "<optional tip 5>"],
  "example": "<one concrete realistic value this user would enter>"
}}

Rules for `tips`:
  - 3 to 5 tips, each one concise (≤ 25 words)
  - Prefer tips that address the documented common mistakes
  - Use imperative voice ("Double-check the passport MRZ spelling", "Use DD.MM.YYYY format on paper forms")
  - Never include generic filler ("be careful", "review your work")

Rules for `example`:
  - A single value, not a sentence
  - Matches the field's `input_type` (text, date, number, checkbox, select)
  - For `date`: ISO 8601 (YYYY-MM-DD)
  - For `checkbox`: "true" or "false"
  - For `select`: one of the valid options documented in the instructions"""


def parse_field_response(raw: str) -> dict:
    """Parse Claude's JSON response into the `FieldExplainResponse` shape.

    Tolerates surrounding whitespace, stray ```json fences, and trailing
    prose — Claude occasionally ignores the "no markdown" rule. Strips
    those, then enforces the required keys.
    """
    text = raw.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        # Remove first fence line
        text = text.split("\n", 1)[1] if "\n" in text else text
        # Remove trailing fence
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3]
    # Find the JSON object boundaries defensively
    first = text.find("{")
    last = text.rfind("}")
    if first == -1 or last == -1 or last < first:
        raise ValueError(f"No JSON object found in model response: {raw[:200]!r}")
    candidate = text[first : last + 1]

    data = json.loads(candidate)
    # Validate shape
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object, got {type(data).__name__}")
    explanation = data.get("explanation")
    tips = data.get("tips")
    example = data.get("example")
    if not isinstance(explanation, str) or not explanation.strip():
        raise ValueError("Response missing non-empty `explanation`")
    if not isinstance(tips, list) or not all(isinstance(t, str) for t in tips):
        raise ValueError("Response `tips` must be a list of strings")
    if not isinstance(example, str):
        raise ValueError("Response `example` must be a string")

    return {
        "explanation": explanation.strip(),
        "tips": [t.strip() for t in tips if t.strip()],
        "example": example.strip(),
    }
