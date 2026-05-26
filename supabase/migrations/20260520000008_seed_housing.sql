-- Seed: housing offices + parameters (Phase 4 — WS2)
--
-- From the NRW research doc. Only offices with a verified street address are
-- seeded. Parameters carry the figures the housing/eligibility calculators
-- read (never hardcoded); the latest effective_from wins.

INSERT INTO public.housing_offices
  (bundesland, city, office_type, name_de, address, contact_email, phone, source_url, verified_at)
VALUES
  ('DE-NW', 'Düsseldorf', 'wohnungsamt', 'Wohnungsamt Düsseldorf',
    'Brinckmannstraße 5, 40225 Düsseldorf', 'wohnungsamt@duesseldorf.de', '0211 89-91',
    'https://service.duesseldorf.de/suche/-/egov-bis-detail/einrichtung/965/show', '2026-05-26'),
  ('DE-NW', 'Dortmund', 'wohnungsamt', 'Amt für Wohnen Dortmund',
    'Südwall 2-4, 44137 Dortmund', 'amtfuerwohnen@dortmund.de', '+49 231 50-22646',
    'https://www.dortmund.de/', '2026-05-26');

-- Numeric constants. Sourced from official NRW municipal pages (2025/2026).
INSERT INTO public.housing_parameters (key, value, unit, effective_from, source_url, verified_at) VALUES
  ('student_funds_per_year', 11904, 'EUR/year', '2025-09-01',
    'https://www.dortmund.de/rathaus-und-verwaltung/verwaltung/amt-fuer-migration/', '2026-05-26'),
  ('bafoeg_standard_rate_per_month', 992, 'EUR/month', '2025-09-01',
    'https://www.bochum.de/Auslaenderbuero', '2026-05-26'),
  ('work_allowance_full_days', 140, 'days/year', '2024-01-01',
    'https://www.bochum.de/Auslaenderbuero', '2026-05-26'),
  ('work_allowance_half_days', 280, 'half-days/year', '2024-01-01',
    'https://www.bochum.de/Auslaenderbuero', '2026-05-26')
ON CONFLICT (key, effective_from) DO NOTHING;
