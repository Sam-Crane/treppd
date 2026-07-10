-- Migration: cascade AI-audit FKs on user deletion
--
-- ai_generation_logs and ai_feedback originally referenced users(id) without
-- ON DELETE CASCADE, so deleting a user (Art. 17 erasure or Supabase admin
-- delete-user) fails with a foreign-key violation. Personal audit rows must
-- go with the user, not orphan them (SET NULL would still leave personal
-- data — the message metadata is tied to that user).

ALTER TABLE public.ai_generation_logs
  DROP CONSTRAINT IF EXISTS ai_generation_logs_user_id_fkey;

ALTER TABLE public.ai_generation_logs
  ADD CONSTRAINT ai_generation_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.ai_feedback
  DROP CONSTRAINT IF EXISTS ai_feedback_user_id_fkey;

ALTER TABLE public.ai_feedback
  ADD CONSTRAINT ai_feedback_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
