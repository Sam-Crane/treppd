/**
 * Decode the `admin_role` custom claim from a Supabase access token.
 *
 * The claim is injected by the Postgres custom-access-token hook
 * (supabase/migrations/20260520000010_admin_role_jwt_hook.sql). We only DECODE
 * here (no signature verification) because this drives edge ROUTING, not
 * authorization — the NestJS AdminGuard re-checks the DB on every admin API
 * call, so a forged claim can't grant real admin access. Edge-runtime safe
 * (uses atob, no Buffer / no extra dependency).
 */
export function decodeAdminRole(accessToken?: string | null): string | null {
  if (!accessToken) return null;
  const parts = accessToken.split('.');
  if (parts.length < 2) return null;
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { admin_role?: unknown };
    return typeof payload.admin_role === 'string' ? payload.admin_role : null;
  } catch {
    return null;
  }
}
