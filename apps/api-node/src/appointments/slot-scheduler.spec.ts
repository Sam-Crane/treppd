/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { SlotScheduler } from './slot-scheduler';

const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() } as any;

/**
 * Supabase is queried for several tables; we route each `.from(table)` to a
 * per-table fake so the scheduler's reads/writes are observable.
 */
function buildSupabase(opts: { prefEnabled?: boolean; watchable?: boolean }) {
  const inserts: any[] = [];
  const updates: any[] = [];

  const client = {
    from(table: string) {
      if (table === 'notification_preferences') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { slot_alerts_enabled: opts.prefEnabled ?? true },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'offices') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    watchable: opts.watchable ?? false,
                    booking_url: 'https://service.example/official',
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'appointment_watch_events') {
        return {
          insert: (row: any) => {
            inserts.push(row);
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === 'appointment_watches') {
        return {
          update: (row: any) => {
            updates.push(row);
            return { eq: () => Promise.resolve({ error: null }) };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
  return { service: { getClient: () => client }, inserts, updates };
}

const baseWatch = {
  id: 'w1',
  user_id: 'u1',
  office_id: 'o1',
  booking_url: 'https://service.example/booking',
  service_label: 'Anmeldung',
  status: 'active',
  last_seen_state: null as string | null,
};

describe('SlotScheduler.processWatch', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sends a reminder (not a slot claim) for a non-watchable office', async () => {
    const sb = buildSupabase({ watchable: false });
    const notifications = {
      sendToUser: jest.fn().mockResolvedValue({ sent: 1, skipped: null }),
    };
    const sched = new SlotScheduler(
      sb.service as any,
      notifications as any,
      logger,
    );

    const sent = await (sched as any).processWatch({ ...baseWatch });
    expect(sent).toBe(true);
    expect(notifications.sendToUser).toHaveBeenCalledWith(
      'u1',
      'slot_alert',
      expect.stringContaining('reminder:'),
      expect.objectContaining({
        title: expect.stringContaining('Time to check'),
      }),
    );
  });

  it('stores a baseline without notifying on first watchable check', async () => {
    const sb = buildSupabase({ watchable: true });
    const notifications = { sendToUser: jest.fn() };
    const sched = new SlotScheduler(
      sb.service as any,
      notifications as any,
      logger,
    );
    jest.spyOn(sched as any, 'fetchSnapshot').mockResolvedValue('hash-A');

    const sent = await (sched as any).processWatch({ ...baseWatch });
    expect(sent).toBe(false);
    expect(notifications.sendToUser).not.toHaveBeenCalled();
    expect(sb.inserts[0].outcome).toBe('baseline');
    expect(sb.updates[0].last_seen_state).toBe('hash-A');
  });

  it('notifies on a detected change', async () => {
    const sb = buildSupabase({ watchable: true });
    const notifications = {
      sendToUser: jest.fn().mockResolvedValue({ sent: 1, skipped: null }),
    };
    const sched = new SlotScheduler(
      sb.service as any,
      notifications as any,
      logger,
    );
    jest.spyOn(sched as any, 'fetchSnapshot').mockResolvedValue('hash-B');

    const sent = await (sched as any).processWatch({
      ...baseWatch,
      last_seen_state: 'hash-A',
    });
    expect(sent).toBe(true);
    expect(notifications.sendToUser).toHaveBeenCalledWith(
      'u1',
      'slot_alert',
      expect.stringContaining('changed:'),
      expect.objectContaining({ title: 'Appointment portal updated' }),
    );
    expect(sb.inserts.some((i) => i.outcome === 'changed')).toBe(true);
  });

  it('degrades to a reminder when the fetch fails', async () => {
    const sb = buildSupabase({ watchable: true });
    const notifications = {
      sendToUser: jest.fn().mockResolvedValue({ sent: 1, skipped: null }),
    };
    const sched = new SlotScheduler(
      sb.service as any,
      notifications as any,
      logger,
    );
    jest.spyOn(sched as any, 'fetchSnapshot').mockResolvedValue(null);

    const sent = await (sched as any).processWatch({
      ...baseWatch,
      last_seen_state: 'hash-A',
    });
    expect(sent).toBe(true);
    expect(sb.inserts.some((i) => i.outcome === 'reminder')).toBe(true);
  });

  it('SSRF guard rejects private/loopback/metadata and non-https URLs', async () => {
    const sched = new SlotScheduler({} as any, {} as any, logger);
    const check = (u: string) => (sched as any).isSafePublicUrl(u);
    await expect(check('http://service.berlin.de/x')).resolves.toBe(false); // not https
    await expect(check('https://127.0.0.1/x')).resolves.toBe(false);
    await expect(
      check('https://169.254.169.254/latest/meta-data'),
    ).resolves.toBe(false);
    await expect(check('https://10.0.0.5/x')).resolves.toBe(false);
    await expect(check('not-a-url')).resolves.toBe(false);
  });

  it('does nothing when the user disabled slot alerts', async () => {
    const sb = buildSupabase({ prefEnabled: false, watchable: true });
    const notifications = { sendToUser: jest.fn() };
    const sched = new SlotScheduler(
      sb.service as any,
      notifications as any,
      logger,
    );
    const sent = await (sched as any).processWatch({ ...baseWatch });
    expect(sent).toBe(false);
    expect(notifications.sendToUser).not.toHaveBeenCalled();
  });
});
