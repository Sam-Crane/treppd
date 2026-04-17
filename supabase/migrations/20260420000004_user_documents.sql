-- Migration: User-uploaded documents (Phase 3f — Documents Module)
--
-- Stores metadata about files a user uploads to the `user-documents` storage
-- bucket. Files in the bucket live under {user_id}/{document_uuid} and can
-- only be read/written by the owner (enforced by storage policies below).
--
-- Design:
--   - One row per uploaded file. `document_name_en` references the canonical
--     name from public.document_requirements so the UI can join and show
--     "Uploaded ✓" next to each required doc.
--   - `storage_path` is the bucket path (we never store the full URL; signed
--     URLs are generated on demand).
--   - Soft metadata: mime_type, file_size, expires_at (for docs with dates).
--
-- Storage bucket `user-documents` MUST be created in Supabase Studio with:
--   - public = false
--   - allowed MIME types: application/pdf, image/jpeg, image/png, image/heic
--   - max file size: 10 MB
--   - RLS policies in storage.objects:
--       * SELECT/INSERT/UPDATE/DELETE WHERE bucket_id = 'user-documents'
--         AND (storage.foldername(name))[1] = auth.uid()::text
--     (i.e. users only access their own {user_id}/... prefix)

CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  step_slug text REFERENCES public.roadmap_steps(slug),
  document_name_en text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  display_name text,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  expires_at date
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user_step
  ON public.user_documents (user_id, step_slug);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own documents" ON public.user_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own documents" ON public.user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own documents" ON public.user_documents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own documents" ON public.user_documents
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_documents IS
  'Metadata for files uploaded to the user-documents storage bucket. One row per file. Storage path is {user_id}/{document_uuid}.';
