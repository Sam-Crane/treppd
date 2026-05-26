-- Migration: Canonical requirement-tag vocabulary (Phase 4 — Content Backbone)
--
-- Today the "kind" of a required document is implicit: document_requirements
-- only carries treatment booleans (needs_translation / needs_apostille /
-- needs_certified_copy). The Document Completeness feature needs to reason
-- per document TYPE (passport, health_insurance, blocked_account, ...), so we
-- introduce a canonical tag vocabulary and an explicit many-to-many join.
--
-- The treatment booleans on document_requirements are intentionally KEPT —
-- they are orthogonal ("how the doc must be prepared"), whereas tags answer
-- "what kind of doc this is".

CREATE TABLE IF NOT EXISTS public.requirement_tags (
  tag text PRIMARY KEY,
  label_en text NOT NULL,
  label_de text NOT NULL,
  description_en text
);

ALTER TABLE public.requirement_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.requirement_tags
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.document_requirement_tags (
  requirement_id uuid NOT NULL
    REFERENCES public.document_requirements(id) ON DELETE CASCADE,
  tag text NOT NULL REFERENCES public.requirement_tags(tag),
  PRIMARY KEY (requirement_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_document_requirement_tags_tag
  ON public.document_requirement_tags(tag);

ALTER TABLE public.document_requirement_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.document_requirement_tags
  FOR SELECT TO anon, authenticated USING (true);

COMMENT ON TABLE public.requirement_tags IS
  'Canonical vocabulary for document types (passport, health_insurance, ...). Human-curated; AI cannot modify.';
COMMENT ON TABLE public.document_requirement_tags IS
  'Many-to-many: tags a verified document_requirement carries.';
