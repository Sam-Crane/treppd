-- Migration: Service-provider directory (Phase 5)
--
-- Curated, admin-managed suggestions surfaced inside roadmap steps:
-- blocked-account providers, health insurers, banks, housing portals, job
-- boards, language schools. Human-curated (verified_at); shown as neutral
-- options, never endorsements. relevant_step_slugs controls which roadmap
-- steps a provider appears under (admin decides placement). is_affiliate /
-- affiliate_url support disclosed referral links later.
--
-- Logos live in the public `public-assets` storage bucket (create it in
-- Supabase Studio with public read); logo_url stores the public URL.

CREATE TABLE IF NOT EXISTS public.service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN (
    'health_insurance', 'blocked_account', 'banking',
    'housing', 'jobs', 'language_school'
  )),
  name text NOT NULL,
  url text NOT NULL,
  logo_url text,
  description_en text,
  visa_types text[] DEFAULT '{}',
  bundeslaender text[] DEFAULT '{}',
  relevant_step_slugs text[] DEFAULT '{}',
  is_affiliate boolean NOT NULL DEFAULT false,
  affiliate_url text,
  sort_order integer NOT NULL DEFAULT 0,
  source_url text,
  verified_at date
);

CREATE INDEX IF NOT EXISTS idx_service_providers_category
  ON public.service_providers (category);
CREATE INDEX IF NOT EXISTS idx_service_providers_steps
  ON public.service_providers USING gin (relevant_step_slugs);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.service_providers
  FOR SELECT TO anon, authenticated USING (true);

COMMENT ON TABLE public.service_providers IS
  'Curated provider suggestions (insurance, blocked account, banking, housing, jobs). Human-curated; AI cannot modify. Neutral options, not endorsements.';
