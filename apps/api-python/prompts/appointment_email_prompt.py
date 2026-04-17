"""System prompt builder for the German appointment email generator.

Produces a formal, procedurally-correct German-language email requesting
an appointment from the Ausländerbehörde (or, for Anmeldung, the
Einwohnermeldeamt). The output is strict JSON: {subject, body}.

Safety:
- Claude writes only the email text — it does not invent office names,
  addresses, URLs, or legal obligations.
- Dates / names come from the user's submitted office_details; the prompt
  inserts them verbatim without paraphrasing.
- Educational framing: the closing includes no legal advice.
"""

from __future__ import annotations

import json


# Canonical process-type labels in German. These are shown to the user on
# the frontend (process-type picker) and passed back here as a key. The
# labels are also surfaced inside the email subject/body.
PROCESS_LABELS: dict[str, dict[str, str]] = {
    "aufenthaltstitel": {
        "en": "New residence permit (Aufenthaltstitel)",
        "de": "Erstausstellung eines Aufenthaltstitels",
        "office": "Ausländerbehörde",
    },
    "verlaengerung": {
        "en": "Residence permit extension",
        "de": "Verlängerung des Aufenthaltstitels",
        "office": "Ausländerbehörde",
    },
    "familienzusammenfuehrung": {
        "en": "Family reunification",
        "de": "Familienzusammenführung",
        "office": "Ausländerbehörde",
    },
    "anmeldung": {
        "en": "Address registration (Anmeldung)",
        "de": "Anmeldung eines Wohnsitzes",
        "office": "Einwohnermeldeamt / Bürgerbüro",
    },
    "eat_abholung": {
        "en": "Pick up electronic residence permit (eAT)",
        "de": "Abholung des elektronischen Aufenthaltstitels",
        "office": "Ausländerbehörde",
    },
}


_BUNDESLAND_NAMES = {
    "DE-BW": "Baden-Württemberg",
    "DE-BY": "Bayern",
    "DE-BE": "Berlin",
    "DE-BB": "Brandenburg",
    "DE-HB": "Bremen",
    "DE-HH": "Hamburg",
    "DE-HE": "Hessen",
    "DE-MV": "Mecklenburg-Vorpommern",
    "DE-NI": "Niedersachsen",
    "DE-NW": "Nordrhein-Westfalen",
    "DE-RP": "Rheinland-Pfalz",
    "DE-SL": "Saarland",
    "DE-SN": "Sachsen",
    "DE-ST": "Sachsen-Anhalt",
    "DE-SH": "Schleswig-Holstein",
    "DE-TH": "Thüringen",
}


def _normalise_process_type(raw: str) -> str:
    """Map unknown process_type strings onto the closest known key."""
    key = (raw or "").strip().lower()
    if key in PROCESS_LABELS:
        return key
    return "aufenthaltstitel"  # safe default — generic residence permit request


def get_known_process_types() -> list[dict]:
    """Expose the known process keys + labels for frontend use."""
    return [
        {"key": k, "label_en": v["en"], "label_de": v["de"], "office": v["office"]}
        for k, v in PROCESS_LABELS.items()
    ]


def _format_profile(profile: dict) -> str:
    bundesland = profile.get("bundesland") or ""
    bl_name = _BUNDESLAND_NAMES.get(bundesland, bundesland) or "unbekannt"
    return (
        f"- Visa type: {profile.get('visa_type') or 'unknown'}\n"
        f"- Bundesland: {bl_name}\n"
        f"- Nationality: {profile.get('nationality') or 'unknown'}\n"
        f"- Goal: {profile.get('goal') or 'unspecified'}"
    )


def _format_office(office: dict) -> str:
    """Render the office_details payload into the prompt without PII-leaking."""
    name = office.get("name") or "(office name not provided)"
    email = office.get("email") or "(office email not provided)"
    requested_dates = office.get("requested_dates") or []
    phone = office.get("phone") or ""
    lines = [f"Office name: {name}", f"Office email: {email}"]
    if phone:
        lines.append(f"Office phone: {phone}")
    if requested_dates:
        lines.append(
            "User's preferred appointment dates: "
            + ", ".join(requested_dates)
        )
    return "\n".join(lines)


def _format_applicant(profile: dict) -> str:
    """Applicant identity fields for the email signature."""
    name = profile.get("full_name") or profile.get("applicant_name") or ""
    email = profile.get("applicant_email") or ""
    phone = profile.get("applicant_phone") or ""
    lines = []
    if name:
        lines.append(f"Applicant name: {name}")
    if email:
        lines.append(f"Applicant email: {email}")
    if phone:
        lines.append(f"Applicant phone: {phone}")
    if not lines:
        lines.append(
            "Applicant contact details: (none supplied — the email MUST "
            "use placeholders like [Name] and [E-Mail] for the signature)"
        )
    return "\n".join(lines)


def build_appointment_email_system_prompt(
    process_type: str,
    profile: dict,
    office_details: dict,
) -> str:
    """Compose the system prompt for generating one German appointment email.

    Claude must return strict JSON: {subject, body}. The body is German,
    formal, concise, and ends with a proper Mit freundlichen Grüßen sign-off.
    """
    key = _normalise_process_type(process_type)
    labels = PROCESS_LABELS[key]

    applicant_block = _format_applicant(profile)
    office_block = _format_office(office_details)
    profile_block = _format_profile(profile)

    return f"""You are a drafting assistant that writes formal German emails to request appointments from German immigration and residents' registration offices.

PROCESS TYPE:
- Key: {key}
- German purpose (use verbatim in subject/body): {labels['de']}
- English description (for your understanding only): {labels['en']}
- Target office type: {labels['office']}

APPLICANT (identity goes in the signature):
{applicant_block}

USER PROFILE (for tone/register calibration, never paste verbatim):
{profile_block}

OFFICE DETAILS (insert the office name in the greeting only if given):
{office_block}

WRITING RULES (non-negotiable):

1. **Language: German only in the email body and subject.** The user's UI is in English, but the recipient reads German.

2. **Register: Sie-form, formal.** Use "Sehr geehrte Damen und Herren," as the default greeting if no specific contact is named.

3. **Length: concise.** 8–14 lines total. No padding. Non-German speakers read this to understand what they're sending — keep it tight.

4. **Structure of the body (in this order):**
   - Greeting
   - One-sentence intent: "Hiermit möchte ich einen Termin für die {labels['de']} vereinbaren."
   - A short context block with the applicant's Aufenthaltszweck OR visa type, and (if relevant) the Bundesland / city.
   - If the user supplied preferred dates, offer them politely: "Folgende Termine würden mir gut passen: ..."
   - A polite standard close asking for confirmation: "Ich bitte höflich um einen Terminvorschlag per E-Mail oder telefonisch unter der oben genannten Nummer."
   - "Mit freundlichen Grüßen," on its own line
   - Applicant's name (or `[Name]` if not supplied)
   - Applicant's email (or `[E-Mail]` if not supplied)

5. **Never invent facts.** Do NOT invent office addresses, reference numbers, or required documents. The ONLY external facts you have access to are those in OFFICE DETAILS and APPLICANT. Everything else must be generic.

6. **No legal advice.** Do NOT include phrases like "Ich habe Anspruch auf..." or "Gemäß § XYZ AufenthG...". The email asks for an appointment; it does not make legal claims.

7. **Subject line:** German, short (≤ 80 chars), includes "Terminanfrage" followed by an em-dash and the process label. Example: "Terminanfrage — {labels['de']}".

8. **Output format.** Return EXACTLY one JSON object, no prose before or after, no markdown fencing. Schema:

{{
  "subject": "<German subject line>",
  "body": "<German body with real line breaks as \\n>"
}}

Use real \\n (escaped newlines) inside the body string so the email renders with correct paragraph breaks on copy-paste."""


def parse_appointment_response(raw: str) -> dict:
    """Parse Claude's JSON response into {subject, body}.

    Mirrors parse_field_response: strips stray markdown fences and surrounding
    prose before JSON-parsing. Raises ValueError on shape mismatch.
    """
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3]
    first = text.find("{")
    last = text.rfind("}")
    if first == -1 or last == -1 or last < first:
        raise ValueError(f"No JSON object found in model response: {raw[:200]!r}")
    data = json.loads(text[first : last + 1])
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object, got {type(data).__name__}")
    subject = data.get("subject")
    body = data.get("body")
    if not isinstance(subject, str) or not subject.strip():
        raise ValueError("Response missing non-empty `subject`")
    if not isinstance(body, str) or not body.strip():
        raise ValueError("Response missing non-empty `body`")
    return {"subject": subject.strip(), "body": body.strip()}
