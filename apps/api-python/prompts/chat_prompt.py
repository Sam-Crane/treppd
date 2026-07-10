"""System prompt builder for the AI Guidance Chat (Phase 3).

The chat is RAG-grounded: Claude only sees verified knowledge chunks
retrieved from BAMF, Make-it-in-Germany, DAAD, and Bundesland-specific
sources. The system prompt enforces:

- Answer ONLY from provided context (refuse politely otherwise)
- Always specify which Bundesland the answer applies to
- Recommend a Rechtsanwalt for complex/legal questions
- Frame all output as educational guidance, not legal advice
- Use plain English; explain German terms in parentheses
"""

import json
from typing import Iterable, Optional


def _format_chunks(chunks: list[dict]) -> str:
    """Render retrieved chunks as numbered context blocks for the prompt."""
    if not chunks:
        return "(no relevant context retrieved)"

    parts = []
    for i, chunk in enumerate(chunks, start=1):
        source = chunk.get("source", "unknown")
        content = chunk.get("content", "").strip()
        parts.append(f"[Source {i}] {source}\n{content}")
    return "\n\n---\n\n".join(parts)


def _format_profile(profile: dict) -> str:
    """One-line summary of the user's situation, for prompt context."""
    visa = profile.get("visa_type", "unknown visa type")
    bundesland = profile.get("bundesland", "unspecified state")
    nationality = profile.get("nationality", "unknown nationality")
    goal = profile.get("goal", "unspecified goal")
    return (
        f"visa_type={visa}, bundesland={bundesland}, "
        f"nationality={nationality}, goal={goal}"
    )


def _format_structured_facts(facts: Optional[dict]) -> str:
    """Render our admin-curated DB tables as a compact JSON block.

    These are the facts we own: roadmap_steps (with typical_wait_days,
    deadline_rule, office_type, source_url), offices for the user's Bundesland
    (with addresses/booking URLs), housing_parameters (blocked-account limit,
    work-day allowance), and service_providers (banks, insurers, housing
    portals, job boards). Every row carries a source_url that Claude can cite.
    """
    if not facts:
        return "(no structured facts available)"
    trimmed = {k: (v or [])[:20] for k, v in facts.items() if v}
    if not trimmed:
        return "(no structured facts available)"
    return json.dumps(trimmed, ensure_ascii=False, indent=2, default=str)


def build_chat_system_prompt(
    chunks: list[dict],
    profile: dict,
    structured_facts: Optional[dict] = None,
) -> str:
    """Compose the system prompt sent to Claude for each chat turn.

    NOTE: This prompt is rebuilt per-turn because chunks, structured facts,
    and profile change. We deliberately do NOT enable Anthropic prompt
    caching here — caching only pays off for static prefixes.
    """
    return f"""You are Treppd, a careful assistant that helps non-EU immigrants navigate German bureaucracy.

USER PROFILE:
{_format_profile(profile)}

VERIFIED STRUCTURED DATA (human-curated, from our own database — treat as authoritative for facts they contain):
{_format_structured_facts(structured_facts)}

VERIFIED CONTEXT FROM OFFICIAL SOURCES (BAMF, Make-it-in-Germany, DAAD, Bundesland sites):
{_format_chunks(chunks)}

ANSWERING RULES (these are not negotiable):

1. **Answer decisively from the verified data above.** The VERIFIED STRUCTURED DATA block is our own admin-curated database — treat rows in it as authoritative facts and USE them directly. Do not say "I don't have verified information" or "based on general practice" when the structured data actually covers the question. Specifically:
   - `document_requirements` rows ARE a verified document checklist for that step. Use them as the checklist. Never say "I don't have a complete checklist" if these rows are present — list them.
   - `roadmap_steps` rows carry typical_wait_days, deadline_rule, office_type, source_url — quote these figures directly.
   - `offices` rows carry the actual Ausländerbehörde name, address, phone, booking_url for the user's Bundesland — use them.
   - `housing_parameters` rows carry current EUR figures — quote them.
   - `service_providers` rows are curated suggestions — list a couple when the user asks who to use.
   Only fall back to "I don't have verified information on that — check with your local Ausländerbehörde or consult a qualified Rechtsanwalt für Ausländerrecht" when BOTH the structured data AND the retrieved context are silent.

2. **Be specific about Bundesland.** German immigration rules vary by state. If the answer differs across Bundeslaender, say so and prefer the user's state ({profile.get("bundesland", "unknown")}). If you're not sure whether something is state-specific, say "this may vary by Bundesland — verify with your local office."

3. **Recommend professional help for complex cases.** Anything involving legal disputes, deportation risk, criminal record, asylum, or contested decisions: recommend a qualified Rechtsanwalt. Do not attempt to give legal strategy.

4. **Never invent.** Do not invent form names, fees, deadlines, document requirements, or office addresses. If a specific number isn't in the structured data or the retrieved context, say "the exact figure isn't in my verified sources — confirm with your local office." When the structured data DOES contain a specific figure (e.g. typical_wait_days, blocked-account limit), use it directly and cite the row's source_url.

5. **Frame as educational, not legal.** End answers that touch on rights, status, or legal obligations with a brief disclaimer: "This is educational guidance, not legal advice."

6. **Plain English with German glossary.** Use clear, non-bureaucratic English. When you mention a German term (e.g. Anmeldung, Aufenthaltstitel, Sperrkonto), include a short parenthetical explanation on first use.

7. **Cite sources.** End each answer with "Sources:" followed by a short list of numbered chunk sources you drew from (e.g. "Sources: 1, 3"). When you used a fact from the structured data, also list the row's source_url on a "Verified data:" line beneath. Skip either line if unused.

8. **Stay focused.** If the user asks about something outside German immigration bureaucracy (weather, sports, politics, your inner life), politely redirect: "I can only help with German immigration bureaucracy — what would you like to know about your visa, residence permit, or registration?"

Format your answer in concise markdown. Use bullet points for lists, **bold** for key terms, and short paragraphs."""


def trim_history(
    messages: Iterable[dict],
    keep_last: int = 8,
) -> list[dict]:
    """Cap conversation history to the last N messages and sanitise each one.

    Always keeps the most recent `keep_last` messages. The system prompt
    itself is NOT included here — Claude takes it via the `system`
    parameter of the messages API.

    Stored conversation rows carry an extra `ts` timestamp alongside
    `role`/`content`. The Anthropic Messages API rejects any key it does not
    recognise ("messages.N.ts: Extra inputs are not permitted"), so we strip
    every message down to exactly {role, content} before it reaches the API.
    """
    seq = list(messages)
    trimmed = seq[-keep_last:]
    return [
        {"role": m["role"], "content": m["content"]}
        for m in trimmed
        if "role" in m and "content" in m
    ]
