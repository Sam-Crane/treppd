import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { SupabaseService } from '../supabase/supabase.service';

function buildChain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  chain.upsert = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.insert = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.delete = jest.fn().mockReturnValue(chain);
  return chain;
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let pushService: { isReady: jest.Mock; send: jest.Mock; getPublicKey: jest.Mock };
  let supabase: { getClient: jest.Mock };
  let chain: ReturnType<typeof buildChain>;

  beforeEach(async () => {
    chain = buildChain();
    supabase = {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue(chain),
      }),
    };
    pushService = {
      isReady: jest.fn().mockReturnValue(true),
      send: jest.fn(),
      getPublicKey: jest.fn().mockReturnValue('public-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: SupabaseService, useValue: supabase },
        { provide: PushService, useValue: pushService },
        { provide: Logger, useValue: { warn: jest.fn(), log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  // ----------------------------------------------------- subscribe

  describe('subscribe', () => {
    it('upserts when push is configured', async () => {
      const result = await service.subscribe('user-1', {
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'p', auth: 'a' },
      });
      expect(result.ok).toBe(true);
      expect(chain.upsert).toHaveBeenCalled();
    });

    it('refuses when VAPID not configured', async () => {
      pushService.isReady.mockReturnValue(false);
      await expect(
        service.subscribe('user-1', {
          endpoint: 'https://push.example/abc',
          keys: { p256dh: 'p', auth: 'a' },
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // ----------------------------------------------------- preferences

  describe('preferences', () => {
    it('returns defaults when no row exists', async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      const prefs = await service.getPreferences('user-1');
      expect(prefs.visa_expiry_enabled).toBe(true);
      expect(prefs.anmeldung_enabled).toBe(true);
      expect(prefs.digest_hour).toBe(9);
    });

    it('merges partial updates with existing prefs', async () => {
      chain.maybeSingle.mockResolvedValue({
        data: {
          user_id: 'user-1',
          visa_expiry_enabled: true,
          anmeldung_enabled: true,
          roadmap_nudges_enabled: true,
          digest_hour: 9,
          timezone: 'Europe/Berlin',
        },
        error: null,
      });

      const result = await service.updatePreferences('user-1', {
        anmeldung_enabled: false,
      });
      expect(result.anmeldung_enabled).toBe(false);
      expect(result.visa_expiry_enabled).toBe(true); // preserved
    });
  });

  // ----------------------------------------------------- sendToUser

  describe('sendToUser', () => {
    it('skips when dedupe row already exists', async () => {
      // First supabase call = dedupe check → returns a row
      chain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'existing' },
        error: null,
      });

      const result = await service.sendToUser(
        'user-1',
        'visa_expiry',
        '90:2027-03-15',
        { title: 't', body: 'b' },
      );
      expect(result.skipped).toBe('already-sent');
      expect(result.sent).toBe(0);
      expect(pushService.send).not.toHaveBeenCalled();
    });

    it('skips when user has no subscriptions', async () => {
      const client = {
        from: jest.fn().mockImplementation((table: string) => {
          const c: Record<string, jest.Mock> = {};
          // `eq` is chainable AND awaitable — the subscription lookup
          // awaits it after the last .eq(), while the dedupe lookup
          // chains .eq().eq().eq().maybeSingle().
          const builder = {
            select: jest.fn().mockReturnValue(c),
            eq: jest.fn().mockImplementation(() => {
              if (table === 'push_subscriptions') {
                return Promise.resolve({ data: [], error: null });
              }
              return c;
            }),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
            delete: jest.fn().mockReturnValue(c),
          };
          Object.assign(c, builder);
          return c;
        }),
      };
      supabase.getClient.mockReturnValue(client);

      const result = await service.sendToUser(
        'user-1',
        'visa_expiry',
        '90:2027-03-15',
        { title: 't', body: 'b' },
      );
      expect(result.skipped).toBe('none-subscribed');
    });

    it('reaps dead subscriptions on 410 Gone', async () => {
      const client = {
        from: jest.fn().mockImplementation((table: string) => {
          const c: Record<string, jest.Mock> = {};
          c.select = jest.fn().mockReturnValue(c);
          c.eq = jest.fn().mockImplementation((_col: string) => {
            if (table === 'push_subscriptions') {
              return Promise.resolve({
                data: [
                  {
                    id: 'sub-1',
                    endpoint: 'https://push.example/dead',
                    p256dh_key: 'p',
                    auth_key: 'a',
                  },
                ],
                error: null,
              });
            }
            return c;
          });
          c.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
          c.insert = jest.fn().mockResolvedValue({ data: null, error: null });
          c.delete = jest.fn().mockReturnValue(c);
          return c;
        }),
      };
      supabase.getClient.mockReturnValue(client);

      pushService.send.mockResolvedValue({
        ok: false,
        gone: true,
        error: 'gone',
      });

      const result = await service.sendToUser(
        'user-1',
        'visa_expiry',
        '90:2027-03-15',
        { title: 't', body: 'b' },
      );
      expect(result.sent).toBe(0);
      expect(pushService.send).toHaveBeenCalledTimes(1);
      // The service deleted the dead subscription
      expect(client.from).toHaveBeenCalledWith('push_subscriptions');
    });

    it('writes dedupe row on successful send', async () => {
      const inserts: Array<Record<string, unknown>> = [];
      const client = {
        from: jest.fn().mockImplementation((table: string) => {
          const c: Record<string, jest.Mock> = {};
          c.select = jest.fn().mockReturnValue(c);
          c.eq = jest.fn().mockImplementation(() => {
            if (table === 'push_subscriptions') {
              return Promise.resolve({
                data: [
                  {
                    id: 'sub-1',
                    endpoint: 'https://push.example/good',
                    p256dh_key: 'p',
                    auth_key: 'a',
                  },
                ],
                error: null,
              });
            }
            return c;
          });
          c.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
          c.insert = jest.fn().mockImplementation((row: Record<string, unknown>) => {
            inserts.push(row);
            return { execute: jest.fn().mockResolvedValue({ data: null, error: null }) };
          });
          c.delete = jest.fn().mockReturnValue(c);
          return c;
        }),
      };
      // The service also calls .insert(...) directly (not chained with execute)
      // so make insert return a resolved promise shape as well.
      // We override above to also be awaitable.
      supabase.getClient.mockReturnValue(client);

      // Patch insert return so `.then` works (Promise.resolve)
      (client.from as jest.Mock).mockImplementation((table: string) => {
        const c: Record<string, jest.Mock> = {};
        c.select = jest.fn().mockReturnValue(c);
        c.eq = jest.fn().mockImplementation(() => {
          if (table === 'push_subscriptions') {
            return Promise.resolve({
              data: [
                {
                  id: 'sub-1',
                  endpoint: 'https://push.example/good',
                  p256dh_key: 'p',
                  auth_key: 'a',
                },
              ],
              error: null,
            });
          }
          return c;
        });
        c.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        c.insert = jest.fn().mockImplementation((row: Record<string, unknown>) => {
          inserts.push(row);
          return Promise.resolve({ data: null, error: null });
        });
        c.delete = jest.fn().mockReturnValue(c);
        return c;
      });

      pushService.send.mockResolvedValue({ ok: true });

      const result = await service.sendToUser(
        'user-1',
        'visa_expiry',
        '90:2027-03-15',
        { title: 't', body: 'b' },
      );
      expect(result.sent).toBe(1);
      // Dedupe row was inserted
      expect(
        inserts.some(
          (i) =>
            i.notification_type === 'visa_expiry' &&
            i.dedupe_key === '90:2027-03-15',
        ),
      ).toBe(true);
    });
  });
});
