-- Migration: slot-alert notification preference (Phase 4 — WS7)
--
-- Opt-in flag for appointment slot-watch notifications. Defaults to true so a
-- user who creates a watch gets alerts without an extra step; they can turn it
-- off in settings.

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS slot_alerts_enabled boolean NOT NULL DEFAULT true;
