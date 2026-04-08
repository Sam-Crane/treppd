-- Migration: User roadmaps
-- Persisted roadmap instance per user. Regenerated on profile change or after 30 days.

CREATE TABLE IF NOT EXISTS public.user_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  profile_snapshot jsonb NOT NULL,
  steps jsonb NOT NULL,
  base_steps_used text[],
  ai_enriched boolean DEFAULT true,
  ai_added_steps jsonb DEFAULT '[]',
  ai_fallback boolean DEFAULT false,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '30 days'
);

ALTER TABLE public.user_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own roadmaps" ON public.user_roadmaps
  FOR ALL USING (auth.uid() = user_id);

-- Index for expiry check
CREATE INDEX idx_user_roadmaps_expires ON public.user_roadmaps(user_id, expires_at);
