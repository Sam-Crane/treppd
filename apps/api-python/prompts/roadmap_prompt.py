"""Prompt builders for roadmap enrichment.

System prompts are static (cached by Anthropic for cost reduction).
User prompts are dynamic (change per request).
"""

import json


def build_system_prompt() -> str:
    """Static system prompt -- cached by Anthropic for cost reduction."""
    return """You are an expert on German immigration bureaucracy.
You will receive VERIFIED bureaucratic steps from our database.

WHAT YOU MAY DO:
 - Explain each step in plain language for this specific person
 - Add 2-3 practical tips per step based on their situation
 - Estimate realistic current wait times
 - Add missing steps for edge cases (flag as ai_suggested: true)

WHAT YOU MUST NEVER DO:
 - Change official form names, codes, or office names
 - Modify document requirements or certification rules
 - Remove or reorder verified steps
 - Invent official process names

AI-added steps MUST include: ai_suggested: true
 and a note: "Verify this step with your local Auslaenderbehoerde"

Return ONLY valid JSON. No markdown fences. No preamble.
Schema: { steps: RoadmapStep[] }

Each RoadmapStep must have:
- slug: string
- title: string
- explanation: string (plain-language, 2-3 sentences)
- office: string
- can_do_online: boolean
- estimated_days: number
- depends_on: string[]
- tips: string[] (2-3 practical tips)
- deadline: string | null
- ai_suggested: boolean
- source_verified: boolean"""


def build_user_prompt(base_steps: list, profile: dict) -> str:
    """Dynamic user prompt -- changes per request."""
    steps_json = json.dumps(
        [
            {
                "slug": s["slug"],
                "title": s["title_en"],
                "office_type": s.get("office_type"),
                "can_do_online": s.get("can_do_online", False),
                "depends_on": s.get("depends_on", []),
                "typical_wait_days": s.get("typical_wait_days"),
                "deadline_rule": s.get("deadline_rule"),
            }
            for s in base_steps
        ],
        indent=2,
    )

    return f"""VERIFIED STEPS FROM DATABASE:
{steps_json}

USER PROFILE:
- Nationality: {profile.get('nationality', 'Unknown')}
- Visa type: {profile.get('visa_type', 'Unknown')}
- Bundesland: {profile.get('bundesland', 'Unknown')}
- City: {profile.get('city', 'Unknown')}
- Goal: {profile.get('goal', 'Unknown')}
- Arrival date: {profile.get('arrival_date', 'Unknown')}
- Visa expiry: {profile.get('visa_expiry_date', 'Unknown')}
- University: {profile.get('university_name', 'N/A')}
- Employer: {profile.get('employer_name', 'N/A')}

Enrich these verified steps for this specific person. Add plain-language explanations, \
practical tips, and realistic wait time estimates. If you identify missing steps for their \
situation, add them with ai_suggested: true."""
