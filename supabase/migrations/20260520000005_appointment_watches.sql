-- Migration: Appointment slot watches (Phase 4 — Slot Alerts feature)
--
-- A user-configured watch on an office's booking portal. A scheduled job
-- polls each active watch politely and, on a detected change, pushes a
-- notification. `last_seen_state` stores a hash/snapshot of the watched page
-- region for change-detection (NOT scraped slot data). The companion events
-- table is an audit trail of detections.
--
-- Owner-only RLS (same shape as user_documents). The scheduler writes via the
-- service-key client, which bypasses RLS, so background updates are unaffected.

CREATE TABLE IF NOT EXISTS public.appointment_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  office_id uuid REFERENCES public.offices(id) ON DELETE SET NULL,
  service_label text,
  booking_url text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'disabled')),
  last_checked_at timestamptz,
  last_seen_state text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_watches_user
  ON public.appointment_watches (user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_watches_active
  ON public.appointment_watches (status) WHERE status = 'active';

ALTER TABLE public.appointment_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own watches" ON public.appointment_watches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own watches" ON public.appointment_watches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own watches" ON public.appointment_watches
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own watches" ON public.appointment_watches
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.appointment_watch_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id uuid NOT NULL
    REFERENCES public.appointment_watches(id) ON DELETE CASCADE,
  detected_at timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL,                -- changed | reminder | error | unchanged
  detail jsonb
);

CREATE INDEX IF NOT EXISTS idx_appointment_watch_events_watch
  ON public.appointment_watch_events (watch_id, detected_at DESC);

ALTER TABLE public.appointment_watch_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own watch events" ON public.appointment_watch_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointment_watches w
      WHERE w.id = watch_id AND w.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.appointment_watches IS
  'User-configured watches on office booking portals. last_seen_state is a change-detection snapshot, not scraped slot data.';
