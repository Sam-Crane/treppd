"""Tests for the deterministic housing calculators (services/housing.py).

Mocks Supabase parameter lookups. conftest stubs env vars.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import services.housing
from models import WbsRequest, WohngeldRequest


def _service_with_params(params: dict[str, float]):
    with patch("services.housing.create_client") as factory:
        factory.return_value = MagicMock()
        svc = services.housing.HousingService()

    def fake_param(key: str):
        return params.get(key)

    svc._param = fake_param  # type: ignore[method-assign]
    return svc


class TestWbs:
    def test_eligible_when_income_within_limit(self):
        svc = _service_with_params({"wbs_income_limit_DE-NW_1p": 20000})
        res = svc.wbs(
            WbsRequest(bundesland="DE-NW", household_size=1, annual_net_income_eur=18000)
        )
        assert res.eligible is True
        assert res.threshold_eur == 20000

    def test_not_eligible_when_income_above_limit(self):
        svc = _service_with_params({"wbs_income_limit_1p": 20000})
        res = svc.wbs(
            WbsRequest(bundesland="DE-BY", household_size=1, annual_net_income_eur=25000)
        )
        assert res.eligible is False

    def test_none_when_limit_not_configured(self):
        svc = _service_with_params({})
        res = svc.wbs(
            WbsRequest(bundesland="DE-HE", household_size=3, annual_net_income_eur=15000)
        )
        assert res.eligible is None
        assert res.next_step is not None

    def test_state_specific_limit_preferred_over_generic(self):
        svc = _service_with_params(
            {"wbs_income_limit_2p": 24000, "wbs_income_limit_DE-NW_2p": 30000}
        )
        res = svc.wbs(
            WbsRequest(bundesland="DE-NW", household_size=2, annual_net_income_eur=28000)
        )
        # State-specific 30000 applies → eligible; generic 24000 would say no.
        assert res.eligible is True
        assert res.threshold_eur == 30000


class TestWohngeld:
    def test_high_rent_burden_is_likely(self):
        svc = _service_with_params({})
        res = svc.wohngeld(
            WohngeldRequest(
                bundesland="DE-BE",
                household_size=1,
                monthly_net_income_eur=1200,
                monthly_rent_eur=600,
            )
        )
        assert res.indicator == "likely"

    def test_low_rent_burden_is_unlikely(self):
        svc = _service_with_params({})
        res = svc.wohngeld(
            WohngeldRequest(
                bundesland="DE-BE",
                household_size=1,
                monthly_net_income_eur=4000,
                monthly_rent_eur=600,
            )
        )
        assert res.indicator == "unlikely"
