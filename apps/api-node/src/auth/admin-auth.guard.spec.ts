/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin-auth.guard';

function buildContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function buildSupabase(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  return {
    getClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue(chain),
    }),
  };
}

describe('AdminGuard', () => {
  const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() } as any;

  it('allows a user with a non-null admin_role', async () => {
    const supabase = buildSupabase({
      data: { admin_role: 'super_admin' },
      error: null,
    });
    const guard = new AdminGuard(supabase as any, logger);
    await expect(
      guard.canActivate(buildContext({ userId: 'u1' })),
    ).resolves.toBe(true);
  });

  it('rejects a user whose admin_role is NULL', async () => {
    const supabase = buildSupabase({ data: { admin_role: null }, error: null });
    const guard = new AdminGuard(supabase as any, logger);
    await expect(
      guard.canActivate(buildContext({ userId: 'u2' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects when no authenticated user is present', async () => {
    const supabase = buildSupabase({ data: null, error: null });
    const guard = new AdminGuard(supabase as any, logger);
    await expect(guard.canActivate(buildContext(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects when the role lookup errors', async () => {
    const supabase = buildSupabase({
      data: null,
      error: { message: 'db down' },
    });
    const guard = new AdminGuard(supabase as any, logger);
    await expect(
      guard.canActivate(buildContext({ userId: 'u3' })),
    ).rejects.toThrow(ForbiddenException);
  });
});
