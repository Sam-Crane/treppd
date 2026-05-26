-- Migration: Immigration / registration offices (Phase 4 — Content Backbone)
--
-- Replaces the stubbed GET /offices/{bundesland} endpoint (previously []) with
-- real, city-level office data. Worker-inclusive: permit_categories lists every
-- permit type an office handles (student AND work/Blue Card/etc.), so the data
-- serves all non-EU citizens, not just students.
--
-- `watchable` gates the Phase 4 Appointment Slot Alerts feature — an admin must
-- explicitly mark an office's booking portal as safe/permitted to monitor.
-- `verified_at` NULL = unverified row; UI must show "check official site".

CREATE TABLE IF NOT EXISTS public.offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundesland text NOT NULL,
  city text NOT NULL,
  office_type text NOT NULL,            -- auslaenderbehoerde | buergeramt | einwohnermeldeamt
  name_de text NOT NULL,
  permit_categories text[] DEFAULT '{}',
  address text,
  booking_url text,
  watchable boolean NOT NULL DEFAULT false,
  contact_email text,
  phone text,
  opening_hours jsonb,
  source_url text,
  verified_at date
);

CREATE INDEX IF NOT EXISTS idx_offices_bundesland_city
  ON public.offices (bundesland, city);
CREATE INDEX IF NOT EXISTS idx_offices_permit_categories
  ON public.offices USING gin(permit_categories);

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.offices
  FOR SELECT TO anon, authenticated USING (true);

COMMENT ON TABLE public.offices IS
  'City-level immigration/registration offices. Human-curated; AI cannot modify. verified_at NULL = unverified.';
