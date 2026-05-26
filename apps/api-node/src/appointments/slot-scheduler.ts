/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { createHash } from 'crypto';
import { lookup } from 'dns/promises';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

interface WatchRow {
  id: string;
  user_id: string;
  office_id: string | null;
  booking_url: string;
  service_label: string | null;
  status: string;
  last_seen_state: string | null;
}

const POLITE_UA =
  'Treppd-AppointmentWatch/0.1 (educational; not affiliated with the offices)';
const FETCH_TIMEOUT_MS = 10_000;

/** Block SSRF to private/loopback/link-local/metadata ranges. */
function isPrivateIp(ip: string): boolean {
  // IPv6 loopback / unique-local / link-local
  if (ip === '::1') return true;
  const lower = ip.toLowerCase();
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7
  if (lower.startsWith('fe80')) return true; // link-local
  // IPv4-mapped IPv6 → strip prefix
  const v4 = lower.startsWith('::ffff:') ? lower.slice(7) : ip;
  const parts = v4.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    // Not a dotted IPv4 — treat unknown shapes as unsafe.
    return !/^\d/.test(v4);
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true; // loopback
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/**
 * Appointment slot watcher (Phase 4 — WS7).
 *
 * IMPORTANT — by design this is NOT a scraper. German booking portals have no
 * public slot API, and aggressive scraping is brittle and ToS-hostile. We do a
 * single polite, low-frequency fetch per active watch and only CHANGE-DETECT a
 * hash of the page. On any change we nudge the user to check the portal — we
 * never claim a specific slot exists. Watches whose office isn't admin-flagged
 * `watchable` (or that can't be fetched) degrade to a weekly "time to check"
 * reminder with a deep link. Per-watch try/catch keeps one failure from
 * aborting the whole scan.
 */
@Injectable()
export class SlotScheduler {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'slot-scan' })
  async scheduledScan(): Promise<void> {
    await this.runScan();
  }

  async runScan(): Promise<{ scanned: number; notified: number }> {
    const { data: watches, error } = await this.supabase
      .getClient()
      .from('appointment_watches')
      .select(
        'id, user_id, office_id, booking_url, service_label, status, last_seen_state',
      )
      .eq('status', 'active');

    if (error || !watches) {
      this.logger.warn({ err: error }, 'Failed to load watches');
      return { scanned: 0, notified: 0 };
    }

    let notified = 0;
    for (const watch of watches as WatchRow[]) {
      try {
        if (await this.processWatch(watch)) notified += 1;
      } catch (err) {
        this.logger.warn({ err, watchId: watch.id }, 'Watch scan error');
        await this.recordEvent(watch.id, 'error', { message: String(err) });
      }
    }
    this.logger.log(
      { scanned: watches.length, notified },
      'Slot scan complete',
    );
    return { scanned: watches.length, notified };
  }

  /** Returns true if a notification was sent. */
  private async processWatch(watch: WatchRow): Promise<boolean> {
    if (!(await this.prefEnabled(watch.user_id))) return false;

    // Only an admin-curated, `watchable` office is ever fetched, and we fetch
    // the OFFICE's stored booking_url — never the user-supplied watch.booking_url.
    // This binds active fetching to a trusted host set (SSRF defense) and makes
    // the `watchable` flag actually constrain what the cron hits.
    const fetchUrl = await this.watchableOfficeUrl(watch);
    const now = new Date().toISOString();

    if (!fetchUrl) {
      // Degrade: weekly reminder to check the portal manually. The user's URL
      // is only ever a deep link in the UI here, never fetched server-side.
      const sent = await this.notify(watch, 'reminder');
      await this.touch(watch.id, now, watch.last_seen_state);
      return sent;
    }

    const snapshot = await this.fetchSnapshot(fetchUrl);
    if (snapshot === null) {
      // Couldn't read the page — fall back to a reminder, don't claim a slot.
      const sent = await this.notify(watch, 'reminder');
      await this.recordEvent(watch.id, 'reminder', { reason: 'fetch_failed' });
      await this.touch(watch.id, now, watch.last_seen_state);
      return sent;
    }

    let notified = false;
    if (watch.last_seen_state && watch.last_seen_state !== snapshot) {
      notified = await this.notify(watch, 'changed');
      await this.recordEvent(watch.id, 'changed', {});
    } else if (!watch.last_seen_state) {
      await this.recordEvent(watch.id, 'baseline', {});
    }
    await this.touch(watch.id, now, snapshot);
    return notified;
  }

  private async prefEnabled(userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .getClient()
      .from('notification_preferences')
      .select('slot_alerts_enabled')
      .eq('user_id', userId)
      .maybeSingle();
    // Default on when the user has no preferences row yet.
    return data
      ? Boolean((data as { slot_alerts_enabled: boolean }).slot_alerts_enabled)
      : true;
  }

  /**
   * Returns the office's stored booking_url IF the watch points at an
   * admin-flagged `watchable` office, else null. We deliberately ignore
   * watch.booking_url (user-supplied) for fetching.
   */
  private async watchableOfficeUrl(watch: WatchRow): Promise<string | null> {
    if (!watch.office_id) return null;
    const { data } = await this.supabase
      .getClient()
      .from('offices')
      .select('watchable, booking_url')
      .eq('id', watch.office_id)
      .maybeSingle();
    const office = data as { watchable?: boolean; booking_url?: string } | null;
    if (!office?.watchable || !office.booking_url) return null;
    return office.booking_url;
  }

  /**
   * Reject URLs that resolve to private/loopback/link-local/metadata ranges,
   * and require https. Defense-in-depth even for admin-curated URLs.
   */
  private async isSafePublicUrl(raw: string): Promise<boolean> {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      return false;
    }
    if (u.protocol !== 'https:') return false;
    try {
      const addrs = await lookup(u.hostname, { all: true });
      return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
    } catch {
      return false;
    }
  }

  /** Polite single GET; returns a hash of the body, or null on failure. */
  private async fetchSnapshot(url: string): Promise<string | null> {
    if (!(await this.isSafePublicUrl(url))) {
      this.logger.warn({ url }, 'Refusing to fetch non-public URL');
      return null;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': POLITE_UA },
        redirect: 'manual', // don't follow redirects into private ranges
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const text = await res.text();
      // Hash the whole body — we only need to detect change, not parse slots.
      return createHash('sha256').update(text).digest('hex');
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async notify(
    watch: WatchRow,
    kind: 'changed' | 'reminder',
  ): Promise<boolean> {
    const label = watch.service_label ?? 'your appointment portal';
    // Dedupe so we don't spam: 'changed' is keyed to the calendar day, the
    // weekly reminder to the ISO week.
    const dedupeKey =
      kind === 'changed'
        ? `changed:${watch.id}:${new Date().toISOString().slice(0, 10)}`
        : `reminder:${watch.id}:${this.isoWeek()}`;

    const payload =
      kind === 'changed'
        ? {
            title: 'Appointment portal updated',
            body: `The booking page for ${label} changed — open it now to check for an available slot.`,
            url: '/appointments',
            tag: `slot-${watch.id}`,
          }
        : {
            title: 'Time to check your appointment portal',
            body: `Open the booking page for ${label} to look for an open slot.`,
            url: '/appointments',
            tag: `slot-${watch.id}`,
          };

    const result = await this.notifications.sendToUser(
      watch.user_id,
      'slot_alert',
      dedupeKey,
      payload,
    );
    return result.sent > 0;
  }

  private async recordEvent(
    watchId: string,
    outcome: string,
    detail: Record<string, unknown>,
  ): Promise<void> {
    await this.supabase
      .getClient()
      .from('appointment_watch_events')
      .insert({ watch_id: watchId, outcome, detail });
  }

  private async touch(
    watchId: string,
    when: string,
    state: string | null,
  ): Promise<void> {
    await this.supabase
      .getClient()
      .from('appointment_watches')
      .update({ last_checked_at: when, last_seen_state: state })
      .eq('id', watchId);
  }

  private isoWeek(): string {
    const d = new Date();
    const year = d.getUTCFullYear();
    const start = Date.UTC(year, 0, 1);
    const week = Math.floor((d.getTime() - start) / (7 * 86_400_000));
    return `${year}-W${week}`;
  }
}
