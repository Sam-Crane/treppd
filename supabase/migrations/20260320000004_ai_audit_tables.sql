-- Migration: AI conversations and audit tables
-- Every AI call is logged. System designed to be fully auditable.

-- Chat conversations per user
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  messages jsonb NOT NULL,
  context_type text,
  related_step_slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own conversations" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- AI generation logs: every Claude API call logged
-- No PII stored — only visa_type, bundesland, goal (never email/names/passport)
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  user_id uuid REFERENCES public.users(id),
  input_payload jsonb NOT NULL,
  output_payload jsonb NOT NULL,
  model_used text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  flagged_for_review boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- No user-level RLS on logs — service role only writes/reads
-- Logs are operational data, not user-facing
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- User feedback on AI responses
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid REFERENCES public.ai_generation_logs(id),
  user_id uuid REFERENCES public.users(id),
  rating smallint NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own feedback" ON public.ai_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback" ON public.ai_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_generation_logs_user ON public.ai_generation_logs(user_id);
CREATE INDEX idx_ai_generation_logs_operation ON public.ai_generation_logs(operation);
CREATE INDEX idx_ai_generation_logs_created ON public.ai_generation_logs(created_at);
CREATE INDEX idx_ai_feedback_log ON public.ai_feedback(log_id);
