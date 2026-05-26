-- Migration: Admin role (Phase 4 — Admin layer)
--
-- Adds application-level RBAC. NULL admin_role = ordinary user. The NestJS
-- AdminGuard reads this column (via the service-key client) to gate the
-- /admin endpoints. Two tiers leave room for read-only content editors vs.
-- full admins, but the guard treats any non-NULL value as "is an admin".
--
-- Bootstrap: grant the founding account super_admin so there's no
-- chicken-and-egg (can't open the admin page to make the first admin).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS admin_role text
  CHECK (admin_role IN ('content_admin', 'super_admin'));

UPDATE public.users
  SET admin_role = 'super_admin'
  WHERE email = 'dr.phemmy35@gmail.com';

COMMENT ON COLUMN public.users.admin_role IS
  'NULL = ordinary user. content_admin | super_admin = staff with /admin access.';
