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

from typing import Iterable


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


def build_chat_system_prompt(chunks: list[dict], profile: dict) -> str:
    """Compose the system prompt sent to Claude for each chat turn.

    NOTE: This prompt is rebuilt per-turn because both `chunks` and
    `profile` change. We deliberately do NOT enable Anthropic prompt
    caching here — caching only pays off for static prefixes.
    """
    return f"""You are Treppd, a careful assistant that helps non-EU immigrants navigate German bureaucracy.

USER PROFILE:
{_format_profile(profile)}

VERIFIED CONTEXT FROM OFFICIAL SOURCES (BAMF, Make-it-in-Germany, DAAD, Bundesland sites):
{_format_chunks(chunks)}

ANSWERING RULES (these are not negotiable):

1. **Answer ONLY from the verified context above.** If the context does not contain a clear answer to the user's question, say so plainly: "I don't have verified information on that. Please check with your local Auslaenderbehoerde or consult a qualified immigration lawyer (Rechtsanwalt fuer Auslaenderrecht)."

2. **Be specific about Bundesland.** German immigration rules vary by state. If the answer differs across Bundeslaender, say so and prefer the user's state ({profile.get("bundesland", "unknown")}). If you're not sure whether something is state-specific, say "this may vary by Bundesland — verify with your local office."

3. **Recommend professional help for complex cases.** Anything involving legal disputes, deportation risk, criminal record, asylum, or contested decisions: recommend a qualified Rechtsanwalt. Do not attempt to give legal strategy.

4. **Never invent.** Do not invent form names, fees, deadlines, document requirements, or office addresses. If a specific number isn't in the context, say "the exact figure isn't in my verified sources — confirm with your local office."

5. **Frame as educational, not legal.** End answers that touch on rights, status, or legal obligations with a brief disclaimer: "This is educational guidance, not legal advice."

6. **Plain English with German glossary.** Use clear, non-bureaucratic English. When you mention a German term (e.g. Anmeldung, Aufenthaltstitel, Sperrkonto), include a short parenthetical explanation on first use.

7. **Cite sources.** End each answer with "Sources:" followed by a short list of which source numbers you drew from (e.g. "Sources: 1, 3"). This lets the UI surface them transparently.

8. **Stay focused.** If the user asks about something outside German immigration bureaucracy (weather, sports, politics, your inner life), politely redirect: "I can only help with German immigration bureaucracy — what would you like to know about your visa, residence permit, or registration?"

Format your answer in concise markdown. Use bullet points for lists, **bold** for key terms, and short paragraphs."""


def trim_history(
    messages: Iterable[dict],
    keep_last: int = 8,
) -> list[dict]:
    """Cap conversation history to the last N messages to manage tokens.

    Always keeps the most recent `keep_last` messages. The system prompt
    itself is NOT included here — Claude takes it via the `system`
    parameter of the messages API.
    """
    seq = list(messages)
    return seq[-keep_last:]
