-- Migration: Add first_name + last_name to public.users (Phase 3 final polish)
--
-- These columns are populated by the handle_new_user() trigger from
-- Supabase Auth's raw_user_meta_data, which the register page sets via
-- supabase.auth.signUp({ options: { data: { first_name, last_name } } }).
--
-- The user-menu already reads user_metadata.full_name from Auth, so the
-- name displays immediately without waiting for this migration. These
-- columns exist for:
--   1. First-party storage independent of Auth metadata
--   2. AI personalisation (Claude can greet users by first name)
--   3. JOIN-able from NestJS profile queries without a round-trip to Auth

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

-- Update the trigger so newly-created users get their names copied.
-- Existing users who registered before this migration will have NULL
-- names (they can update via profile settings in a future pass).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;
  RETURN NEW;
END;
$$;
