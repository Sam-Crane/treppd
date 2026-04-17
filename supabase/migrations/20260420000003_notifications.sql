-- Migration: Push notifications + deadline alerts (Phase 3e)
--
-- Three tables:
--   1. push_subscriptions     — one row per user-device registration (can have multiple devices per user)
--   2. notification_preferences — one row per user; controls what nudges they want
--   3. notification_sent_log  — dedupe key so restarting the cron doesn't re-fire
--
-- Deadline logic (implemented in apps/api-node/src/notifications/deadline-scheduler.ts):
--   - visa_expiry_date from user_profiles → fire at 90 / 30 / 7 days before
--   - arrival_date + 14d → fire at arrival+10 if step `anmeldung` not completed
-- Sent rows live in notification_sent_log forever (small volume) — cheap dedupe.

-- ============================================================================
-- push_subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.push_subscriptions IS
  'Web Push subscriptions. One row per user/device. Endpoint is UNIQUE so re-subscribing replaces cleanly.';

-- ============================================================================
-- notification_preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  visa_expiry_enabled boolean NOT NULL DEFAULT true,
  anmeldung_enabled boolean NOT NULL DEFAULT true,
  roadmap_nudges_enabled boolean NOT NULL DEFAULT true,
  digest_hour integer NOT NULL DEFAULT 9 CHECK (digest_hour BETWEEN 0 AND 23),
  timezone text NOT NULL DEFAULT 'Europe/Berlin',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.set_notification_prefs_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notification_prefs_set_updated_at
  ON public.notification_preferences;
CREATE TRIGGER notification_prefs_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_notification_prefs_updated_at();

-- ============================================================================
-- notification_sent_log
-- ============================================================================
-- Dedupe key: a user can receive visa_expiry_90 only once per visa_expiry_date
-- value. If they update their visa_expiry_date, they can receive it again.

CREATE TABLE IF NOT EXISTS public.notification_sent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  dedupe_key text NOT NULL,
  fired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_type, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_sent_user
  ON public.notification_sent_log (user_id, notification_type);

-- Service-role only — the scheduler runs as service role and writes here.
-- Users never read this table.
ALTER TABLE public.notification_sent_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.notification_sent_log IS
  'Per-(user, type, dedupe_key) record of delivered notifications. Dedupe keys look like "visa_expiry:90:2027-03-15" so schedule logic can ask "did we send visa_expiry_90 for THIS expiry date?".';
