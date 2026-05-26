-- Migration: custom access token hook — inject admin_role into the JWT
-- (Phase 5 — Admin portal role separation)
--
-- Supabase calls this function while minting an access token. We read the
-- caller's users.admin_role and add it to the JWT claims so the Next.js
-- middleware can gate /admin vs consumer routes at the edge without a DB
-- round-trip. The NestJS AdminGuard remains the authoritative check (it reads
-- the DB), so a stale claim can never grant real admin access — the claim is
-- for routing UX only.
--
-- Enabling: config.toml registers it for local dev; on the hosted project it
-- must also be enabled in Dashboard → Authentication → Hooks. Existing
-- sessions pick up the claim on their next token refresh / re-login.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  v_admin_role text;
BEGIN
  SELECT admin_role INTO v_admin_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF v_admin_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{admin_role}', to_jsonb(v_admin_role));
  ELSE
    claims := claims - 'admin_role';
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Only the auth admin role may execute the hook; nobody else.
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
  TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
  FROM authenticated, anon, public;

-- The hook (running as supabase_auth_admin) must read the role column.
GRANT SELECT ON public.users TO supabase_auth_admin;
