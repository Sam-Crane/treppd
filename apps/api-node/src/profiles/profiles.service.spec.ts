/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { ProfilesService } from './profiles.service';

describe('ProfilesService.exportUserData', () => {
  it('returns a JSON dump of every user-scoped table', async () => {
    const seen: string[] = [];
    const from = jest.fn((table: string) => {
      seen.push(table);
      return {
        select: () => ({
          eq: (col: string) =>
            Promise.resolve({
              data: [{ table, filtered_by: col }],
              error: null,
            }),
        }),
      };
    });
    const supabase = { getClient: () => ({ from }) } as any;
    const svc = new ProfilesService(supabase);

    const res = await svc.exportUserData('u1');

    expect(res.user_id).toBe('u1');
    expect(res.export_generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(res.notice).toContain('GDPR');
    // Every documented table appears in the dump.
    const expected = [
      'users',
      'user_profiles',
      'user_roadmaps',
      'user_documents',
      'form_sessions',
      'appointment_watches',
      'ai_conversations',
      'ai_feedback',
      'push_subscriptions',
      'notification_preferences',
    ];
    for (const t of expected) {
      expect(seen).toContain(t);
      expect((res.data as any)[t]).toEqual([
        { table: t, filtered_by: t === 'users' ? 'id' : 'user_id' },
      ]);
    }
  });

  it('returns [] for a table when Supabase returns no rows', async () => {
    const from = jest.fn(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }));
    const supabase = { getClient: () => ({ from }) } as any;
    const svc = new ProfilesService(supabase);
    const res = await svc.exportUserData('u2');
    for (const rows of Object.values(res.data as Record<string, unknown[]>)) {
      expect(rows).toEqual([]);
    }
  });
});
