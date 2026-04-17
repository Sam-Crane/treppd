/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from './notifications.service';

interface ProfileRow {
  user_id: string;
  visa_expiry_date: string | null;
  arrival_date: string | null;
  bundesland: string | null;
  city: string | null;
  completed_steps: string[] | null;
}

interface PreferenceRow {
  user_id: string;
  visa_expiry_enabled: boolean;
  anmeldung_enabled: boolean;
}

/** Days between now (UTC midnight) and the target date (UTC midnight). */
function daysUntil(isoDate: string): number {
  const now = new Date();
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const target = new Date(isoDate);
  const targetUtc = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate(),
  );
  return Math.round((targetUtc - today) / (1000 * 60 * 60 * 24));
}

const VISA_WINDOWS = [90, 30, 7] as const;

@Injectable()
export class DeadlineScheduler {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
    private readonly logger: Logger,
  ) {}

  /** Runs every day at 09:00 server time. */
  @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: 'deadline-scan' })
  async dailyScan(): Promise<void> {
    this.logger.log('Deadline scheduler starting daily scan');
    await this.runScan();
  }

  /** Core logic — exposed so it can be invoked manually for testing. */
  async runScan(): Promise<{ profilesScanned: number; notificationsSent: number }> {
    const { data: profiles, error } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select(
        'user_id, visa_expiry_date, arrival_date, bundesland, city, completed_steps',
      );

    if (error || !profiles) {
      this.logger.warn({ err: error }, 'Failed to load profiles for scan');
      return { profilesScanned: 0, notificationsSent: 0 };
    }

    let sent = 0;
    for (const raw of profiles as ProfileRow[]) {
      try {
        const prefs = await this.getPrefs(raw.user_id);
        if (prefs.visa_expiry_enabled) {
          sent += await this.checkVisaExpiry(raw);
        }
        if (prefs.anmeldung_enabled) {
          sent += await this.checkAnmeldung(raw);
        }
      } catch (err) {
        this.logger.warn({ err, userId: raw.user_id }, 'Scan error for user');
      }
    }

    this.logger.log(
      { profiles: profiles.length, sent },
      'Deadline scheduler scan complete',
    );
    return { profilesScanned: profiles.length, notificationsSent: sent };
  }

  private async getPrefs(userId: string): Promise<PreferenceRow> {
    const { data } = await this.supabase
      .getClient()
      .from('notification_preferences')
      .select('user_id, visa_expiry_enabled, anmeldung_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) {
      // Defaults when user has never touched preferences
      return {
        user_id: userId,
        visa_expiry_enabled: true,
        anmeldung_enabled: true,
      };
    }
    return data as PreferenceRow;
  }

  private async checkVisaExpiry(profile: ProfileRow): Promise<number> {
    if (!profile.visa_expiry_date) return 0;
    const days = daysUntil(profile.visa_expiry_date);
    let sent = 0;
    for (const window of VISA_WINDOWS) {
      if (days === window) {
        const result = await this.notifications.sendToUser(
          profile.user_id,
          'visa_expiry',
          `${window}:${profile.visa_expiry_date}`,
          {
            title:
              window >= 30
                ? `Visa expires in ${window} days`
                : `Urgent: visa expires in ${window} days`,
            body:
              window >= 30
                ? `Your residence permit ends on ${profile.visa_expiry_date}. Start the renewal process now — most offices take 6-8 weeks.`
                : `Your residence permit ends on ${profile.visa_expiry_date}. Contact your local Ausländerbehörde immediately.`,
            url: '/roadmap',
            tag: `visa-expiry-${window}`,
          },
        );
        if (result.sent > 0) sent += 1;
      }
    }
    return sent;
  }

  private async checkAnmeldung(profile: ProfileRow): Promise<number> {
    if (!profile.arrival_date) return 0;
    if ((profile.completed_steps ?? []).includes('anmeldung')) return 0;
    const days = daysUntil(profile.arrival_date);
    // Arrival was N days ago → daysUntil is -N. Fire at -10 (4 days left
    // of the 14-day legal window) if Anmeldung still not completed.
    if (days !== -10) return 0;
    const result = await this.notifications.sendToUser(
      profile.user_id,
      'anmeldung_reminder',
      `10-days:${profile.arrival_date}`,
      {
        title: 'Anmeldung deadline in 4 days',
        body: 'You arrived 10 days ago. German law requires you to register your address within 14 days — book a Bürgeramt appointment now.',
        url: '/forms',
        tag: 'anmeldung-reminder',
      },
    );
    return result.sent > 0 ? 1 : 0;
  }
}
