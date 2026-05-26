"""Housing eligibility calculators (WBS, Wohngeld).

Deterministic by design — the figures come from the `housing_parameters`
table (admin-editable, each row carrying source_url + verified_at), never
hardcoded. When a Bundesland's verified threshold is not configured the
calculator returns `eligible=None` with guidance instead of guessing, so we
never assert an eligibility we can't back with a verified source.

These are estimates for orientation only and are NOT a determination — the
responsible Wohnungsamt / Wohngeldstelle decides.
"""

from __future__ import annotations

import logging

from supabase import Client, create_client

from config import get_settings
from models import HousingEstimateResponse, WbsRequest, WohngeldRequest

logger = logging.getLogger(__name__)

_DISCLAIMER = (
    "Estimate only — not a legal determination. The responsible housing "
    "office (Wohnungsamt / Wohngeldstelle) makes the binding decision. "
    "Educational guidance, not legal advice."
)


class HousingService:
    def __init__(self) -> None:
        settings = get_settings()
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY
        )

    def _param(self, key: str) -> float | None:
        """Latest effective value for a housing parameter, or None."""
        res = (
            self.supabase.table("housing_parameters")
            .select("value")
            .eq("key", key)
            .order("effective_from", desc=True)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        return float(rows[0]["value"]) if rows else None

    def wbs(self, req: WbsRequest) -> HousingEstimateResponse:
        size = max(1, req.household_size)
        # Per-Bundesland, per-household-size limit, with a generic fallback key.
        limit = self._param(
            f"wbs_income_limit_{req.bundesland}_{size}p"
        ) or self._param(f"wbs_income_limit_{size}p")

        if limit is None:
            return HousingEstimateResponse(
                eligible=None,
                explanation=(
                    "WBS income limits for your state and household size are "
                    "not yet on file, so we can't estimate eligibility."
                ),
                disclaimer=_DISCLAIMER,
                next_step=(
                    "Contact your local Wohnungsamt to confirm the current "
                    "income limit and apply."
                ),
            )

        eligible = req.annual_net_income_eur <= limit
        return HousingEstimateResponse(
            eligible=eligible,
            threshold_eur=limit,
            explanation=(
                f"Your household income of €{req.annual_net_income_eur:,.0f}/yr "
                f"is {'within' if eligible else 'above'} the WBS limit of "
                f"€{limit:,.0f}/yr for a {size}-person household."
            ),
            disclaimer=_DISCLAIMER,
            next_step=(
                "Apply for the WBS at your local Wohnungsamt."
                if eligible
                else "You may still qualify for other housing support — ask your Wohnungsamt."
            ),
        )

    def wohngeld(self, req: WohngeldRequest) -> HousingEstimateResponse:
        """Lightweight indicator: Wohngeld typically helps low-income renters
        whose rent is a high share of income. This is a rough screen, not the
        official formula (which depends on Mietstufe, exact household, etc.)."""
        if req.monthly_net_income_eur <= 0:
            indicator = "unknown"
        else:
            rent_ratio = req.monthly_rent_eur / req.monthly_net_income_eur
            # High rent burden + modest income → likely worth applying.
            indicator = "likely" if rent_ratio >= 0.30 else "unlikely"

        return HousingEstimateResponse(
            indicator=indicator,
            explanation=(
                "Wohngeld is most often granted when rent is a large share of a "
                "modest income. Based on your rent-to-income ratio, applying is "
                f"**{indicator}** to be worthwhile. The exact entitlement depends "
                "on your municipality's rent level (Mietstufe) and household."
            ),
            disclaimer=_DISCLAIMER,
            next_step=(
                "Use the official Wohngeldrechner and apply at your "
                "Wohngeldstelle if the indicator is positive."
            ),
        )


_service: HousingService | None = None


def get_housing_service() -> HousingService:
    global _service
    if _service is None:
        _service = HousingService()
    return _service
