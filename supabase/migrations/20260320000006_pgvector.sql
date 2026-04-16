-- Migration: Enable pgvector + knowledge_chunks for RAG (Phase 3)
--
-- Stores embedded chunks of immigration knowledge from BAMF, Make-it-in-
-- Germany, and other curated sources. The chat pipeline (Phase 3) embeds
-- user questions, runs cosine-similarity search against this table, and
-- feeds the top matches to Claude as grounded context.
--
-- Embedding dimension is 1024 (Voyage AI voyage-3 model). DO NOT change
-- this without re-embedding the entire corpus — the dimension is fixed
-- at table creation time.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content     text NOT NULL,
  embedding   vector(1024) NOT NULL,
  source      text NOT NULL,            -- e.g. "https://www.bamf.de/.../article.html"
  source_type text,                      -- "bamf" | "make_it_in_germany" | "manual"
  metadata    jsonb DEFAULT '{}'::jsonb, -- { visa_types: [], bundeslaender: [], section: "..." }
  chunk_index integer DEFAULT 0,         -- ordering within a single source
  created_at  timestamptz DEFAULT now()
);

-- Public read for the RAG pipeline running with the service-role key.
-- Anon clients NEVER touch this table directly; chat requests go through
-- the FastAPI service which uses the service key.
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- IVFFlat index for fast cosine-similarity search. `lists` is a tuning
-- knob — Postgres docs recommend `rows / 1000` for small corpora; we
-- start at 100 (good for ~100K rows) and tune later.
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for idempotent re-ingestion (DELETE WHERE source = ...).
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source
  ON public.knowledge_chunks (source);

-- GIN indexes on metadata array fields so the SQL function below can
-- efficiently filter by visa_type and bundesland.
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_visa_types
  ON public.knowledge_chunks
  USING gin ((metadata -> 'visa_types'));

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_bundeslaender
  ON public.knowledge_chunks
  USING gin ((metadata -> 'bundeslaender'));


-- Similarity-search RPC function called by the RAG pipeline.
--
-- Filtering rules:
-- - If `filter_visa_type` is NULL or empty, return chunks regardless of visa
-- - Otherwise: return chunks where metadata.visa_types is empty (applies to all)
--   OR contains the user's visa type
-- - Same logic for bundesland
--
-- The OR-with-empty-array logic mirrors how roadmap_steps.bundeslaender works
-- elsewhere in the codebase: empty array = applies universally.
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_visa_type text DEFAULT NULL,
  filter_bundesland text DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  content     text,
  source      text,
  source_type text,
  metadata    jsonb,
  similarity  float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    kc.id,
    kc.content,
    kc.source,
    kc.source_type,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE
    1 - (kc.embedding <=> query_embedding) > match_threshold
    AND (
      filter_visa_type IS NULL
      OR jsonb_array_length(COALESCE(kc.metadata -> 'visa_types', '[]'::jsonb)) = 0
      OR (kc.metadata -> 'visa_types') ? filter_visa_type
    )
    AND (
      filter_bundesland IS NULL
      OR jsonb_array_length(COALESCE(kc.metadata -> 'bundeslaender', '[]'::jsonb)) = 0
      OR (kc.metadata -> 'bundeslaender') ? filter_bundesland
    )
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;
