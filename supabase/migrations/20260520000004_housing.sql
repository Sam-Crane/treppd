-- Migration: Housing offices + tunable parameters (Phase 4 — Housing module)
--
-- Two tables:
--   housing_offices    — Wohnungsamt / Wohngeldstelle directory (mirrors offices)
--   housing_parameters — versioned numeric constants (student funds, work-day
--                        allowance, income thresholds) so admins can update the
--                        figures without a code deploy. Calculators read these;
--                        nothing is hardcoded in TS/Python.

CREATE TABLE IF NOT EXISTS public.housing_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundesland text NOT NULL,
  city text NOT NULL,
  office_type text NOT NULL,            -- wohnungsamt | wohngeldstelle
  name_de text NOT NULL,
  address text,
  booking_url text,
  contact_email text,
  phone text,
  opening_hours jsonb,
  source_url text,
  verified_at date
);

CREATE INDEX IF NOT EXISTS idx_housing_offices_bundesland_city
  ON public.housing_offices (bundesland, city);

ALTER TABLE public.housing_offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.housing_offices
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.housing_parameters (
  key text NOT NULL,
  value numeric NOT NULL,
  unit text,
  effective_from date NOT NULL DEFAULT current_date,
  source_url text,
  verified_at date,
  PRIMARY KEY (key, effective_from)
);

ALTER TABLE public.housing_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.housing_parameters
  FOR SELECT TO anon, authenticated USING (true);

COMMENT ON TABLE public.housing_offices IS
  'Wohnungsamt / Wohngeldstelle directory. Human-curated; AI cannot modify.';
COMMENT ON TABLE public.housing_parameters IS
  'Versioned numeric constants (e.g. student_funds_per_year). Latest effective_from wins. Admin-editable.';
