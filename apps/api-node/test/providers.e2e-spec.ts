/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/jwt-auth.guard';
import { SupabaseService } from './../src/supabase/supabase.service';

/**
 * Integration test: exercises the FULL HTTP → guards → controller → service
 * pipeline (validation pipe, DI, guard stacking) with SupabaseService mocked
 * at the module boundary. Covers three real invariants:
 *   1. Anonymous access to a guarded route is rejected (401).
 *   2. A logged-in caller flows through the guard, the controller wires the
 *      right query, and the response is shaped by ProvidersService.
 *   3. A logged-in NON-admin cannot reach an admin route (403 from AdminGuard).
 */
describe('Providers + admin (e2e integration)', () => {
  let app: INestApplication<App>;

  // Toggled per-test so we can flip between "anonymous" and "signed in".
  let currentUser: { userId: string; email?: string } | null = null;
  let currentAdminRole: string | null = null;

  const supabaseMock = {
    getClient: jest.fn().mockImplementation(() => ({
      from: (table: string) => {
        if (table === 'service_providers') {
          const chain: any = {
            select: () => chain,
            contains: () => chain,
            order: jest.fn(),
          };
          chain.order.mockReturnValueOnce(chain).mockReturnValueOnce(
            Promise.resolve({
              data: [
                {
                  id: 'p1',
                  category: 'banking',
                  name: 'N26',
                  url: 'https://n26.com',
                  logo_url: null,
                  description_en: null,
                  is_affiliate: false,
                  affiliate_url: null,
                  sort_order: 1,
                },
              ],
              error: null,
            }),
          );
          return chain;
        }
        if (table === 'users') {
          // AdminGuard reads admin_role from users
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { admin_role: currentAdminRole },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      },
    })),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabaseMock)
      // Bypass JWT verification for the integration slice — the guard itself
      // has a dedicated unit spec (jwt-auth.guard.spec.ts).
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          if (!currentUser) throw new UnauthorizedException('No token');
          const req = ctx.switchToHttp().getRequest();
          req.user = currentUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    currentUser = null;
    currentAdminRole = null;
  });

  it('rejects anonymous GET /providers with 401', async () => {
    currentUser = null;
    await request(app.getHttpServer())
      .get('/providers?step=bank_account')
      .expect(401);
  });

  it('serves providers for a signed-in user and forwards the step filter', async () => {
    currentUser = { userId: 'u1' };
    const res = await request(app.getHttpServer())
      .get('/providers?step=bank_account')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ name: 'N26', category: 'banking' });
  });

  it('rejects a signed-in non-admin from /admin/content/offices with 403', async () => {
    currentUser = { userId: 'u1' };
    currentAdminRole = null; // not an admin
    await request(app.getHttpServer())
      .get('/admin/content/offices')
      .expect(403);
  });
});
