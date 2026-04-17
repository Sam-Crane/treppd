-- Migration: form_sessions — per-user progress for the Form-Filling Guide.
--
-- Scope: the Form Guide lets users walk through BAMF / KVR / LEA forms
-- field-by-field. Users may not finish in one sitting (long forms,
-- waiting on missing documents), so we persist partial input here.
--
-- Design:
--   - One row per (user_id, form_code). `UPSERT` pattern.
--   - `values` is a JSONB object keyed by FormField.field_id → user input.
--     We accept string | number | boolean at the app layer, so the store
--     is intentionally loose.
--   - RLS-enforced so users only ever see/modify their own sessions.
--   - No PII leaks into ai_generation_logs (the explain-field audit payload
--     excludes `values` by design).
--
-- Follow-ups (tracked in Phase 3 docs):
--   - Retention: add a pg_cron or Supabase Edge Function to delete rows
--     with updated_at < now() - interval '30 days'. Not shipped in this
--     migration; progress is worth keeping for at least that window.

CREATE TABLE IF NOT EXISTS public.form_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  form_code text NOT NULL REFERENCES public.forms(form_code) ON DELETE CASCADE,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT form_sessions_user_form_unique UNIQUE (user_id, form_code)
);

CREATE INDEX IF NOT EXISTS idx_form_sessions_user_form
  ON public.form_sessions (user_id, form_code);

-- Auto-update updated_at on every UPDATE.
-- Defined inline because earlier migrations don't ship a shared trigger fn.
CREATE OR REPLACE FUNCTION public.set_form_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS form_sessions_set_updated_at ON public.form_sessions;
CREATE TRIGGER form_sessions_set_updated_at
  BEFORE UPDATE ON public.form_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_form_sessions_updated_at();

-- RLS: users can only see and modify their own sessions.
ALTER TABLE public.form_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own form sessions" ON public.form_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own form sessions" ON public.form_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own form sessions" ON public.form_sessions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own form sessions" ON public.form_sessions
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.form_sessions IS
  'Partial user input for Form-Filling Guide sessions. UPSERT on (user_id, form_code). RLS-enforced.';
COMMENT ON COLUMN public.form_sessions.values IS
  'JSONB object keyed by FormField.field_id. Values are string | number | boolean. No PII is logged downstream from this column.';
