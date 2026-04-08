-- Migration: Content tables (human-curated, AI cannot modify)
-- These tables form the verified knowledge base

-- Verified roadmap steps
CREATE TABLE IF NOT EXISTS public.roadmap_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  visa_types text[] NOT NULL,
  bundeslaender text[] DEFAULT '{}',
  sequence integer NOT NULL,
  depends_on text[] DEFAULT '{}',
  title_de text NOT NULL,
  title_en text NOT NULL,
  office_type text,
  can_do_online boolean DEFAULT false,
  typical_wait_days integer,
  deadline_rule text,
  verified_at date NOT NULL,
  source_url text
);

ALTER TABLE public.roadmap_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.roadmap_steps
  FOR SELECT TO anon, authenticated USING (true);

-- Document requirements per step
CREATE TABLE IF NOT EXISTS public.document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_slug text REFERENCES public.roadmap_steps(slug) NOT NULL,
  document_name_en text NOT NULL,
  document_name_de text NOT NULL,
  specifications jsonb,
  needs_certified_copy boolean DEFAULT false,
  needs_translation boolean DEFAULT false,
  needs_apostille boolean DEFAULT false,
  where_to_get text,
  estimated_cost_eur numeric(6,2),
  applies_to_nationalities text[] DEFAULT '{}',
  applies_to_bundeslaender text[] DEFAULT '{}'
);

ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.document_requirements
  FOR SELECT TO anon, authenticated USING (true);

-- Official forms with field-by-field guidance
CREATE TABLE IF NOT EXISTS public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_code text UNIQUE NOT NULL,
  name_de text NOT NULL,
  name_en text NOT NULL,
  bundeslaender text[] DEFAULT '{}',
  visa_types text[],
  related_step_slug text REFERENCES public.roadmap_steps(slug),
  fields jsonb NOT NULL,
  download_url text,
  verified_at date NOT NULL
);

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.forms
  FOR SELECT TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX idx_roadmap_steps_visa_types ON public.roadmap_steps USING gin(visa_types);
CREATE INDEX idx_roadmap_steps_bundeslaender ON public.roadmap_steps USING gin(bundeslaender);
CREATE INDEX idx_document_requirements_step_slug ON public.document_requirements(step_slug);
CREATE INDEX idx_forms_related_step ON public.forms(related_step_slug);
