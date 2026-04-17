/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SupabaseService } from '../supabase/supabase.service';
import { PushService, type PushPayload } from './push.service';
import type { SubscribeDto } from './dto/subscribe.dto';
import type { UpdatePreferencesDto } from './dto/preferences.dto';

export interface NotificationPreferences {
  user_id: string;
  visa_expiry_enabled: boolean;
  anmeldung_enabled: boolean;
  roadmap_nudges_enabled: boolean;
  digest_hour: number;
  timezone: string;
}

const DEFAULT_PREFS: Omit<NotificationPreferences, 'user_id'> = {
  visa_expiry_enabled: true,
  anmeldung_enabled: true,
  roadmap_nudges_enabled: true,
  digest_hour: 9,
  timezone: 'Europe/Berlin',
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly pushService: PushService,
    private readonly logger: Logger,
  ) {}

  // ------------------------------------------------------------- subscriptions

  async subscribe(userId: string, dto: SubscribeDto): Promise<{ ok: true }> {
    if (!this.pushService.isReady()) {
      throw new ServiceUnavailableException(
        'Push notifications are not configured on the server.',
      );
    }

    const { error } = await this.supabase
      .getClient()
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: dto.endpoint,
          p256dh_key: dto.keys.p256dh,
          auth_key: dto.keys.auth,
          user_agent: dto.user_agent ?? null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      );

    if (error) {
      this.logger.warn({ err: error }, 'Failed to save push subscription');
      throw new ServiceUnavailableException('Could not save your subscription.');
    }
    return { ok: true };
  }

  async unsubscribe(userId: string, endpoint: string): Promise<{ ok: true }> {
    const { error } = await this.supabase
      .getClient()
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);
    if (error) {
      this.logger.warn({ err: error }, 'Failed to delete push subscription');
    }
    return { ok: true };
  }

  /** Fetch every subscription for one user. Used by the scheduler. */
  async getSubscriptions(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('push_subscriptions')
      .select('id, endpoint, p256dh_key, auth_key')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data as Array<{
      id: string;
      endpoint: string;
      p256dh_key: string;
      auth_key: string;
    }>;
  }

  /** Delete a single subscription by its row id (used to reap 410 Gone). */
  async deleteSubscriptionById(id: string): Promise<void> {
    await this.supabase
      .getClient()
      .from('push_subscriptions')
      .delete()
      .eq('id', id);
  }

  // ------------------------------------------------------------- preferences

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await this.supabase
      .getClient()
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.warn({ err: error }, 'Failed to load preferences');
      return { user_id: userId, ...DEFAULT_PREFS };
    }
    if (!data) {
      return { user_id: userId, ...DEFAULT_PREFS };
    }
    return data as NotificationPreferences;
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const merged: NotificationPreferences = {
      user_id: userId,
      visa_expiry_enabled: dto.visa_expiry_enabled ?? current.visa_expiry_enabled,
      anmeldung_enabled: dto.anmeldung_enabled ?? current.anmeldung_enabled,
      roadmap_nudges_enabled:
        dto.roadmap_nudges_enabled ?? current.roadmap_nudges_enabled,
      digest_hour: dto.digest_hour ?? current.digest_hour,
      timezone: dto.timezone ?? current.timezone,
    };

    const { error } = await this.supabase
      .getClient()
      .from('notification_preferences')
      .upsert(merged, { onConflict: 'user_id' });

    if (error) {
      this.logger.warn({ err: error }, 'Failed to update preferences');
      throw new ServiceUnavailableException('Could not update preferences.');
    }
    return merged;
  }

  // ------------------------------------------------------------- send + dedupe

  /** Core push send. Dedupes via notification_sent_log. Reaps dead subs. */
  async sendToUser(
    userId: string,
    notificationType: string,
    dedupeKey: string,
    payload: PushPayload,
  ): Promise<{ sent: number; skipped: 'already-sent' | 'none-subscribed' | null }> {
    // Dedupe check first
    const { data: existing } = await this.supabase
      .getClient()
      .from('notification_sent_log')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .eq('dedupe_key', dedupeKey)
      .maybeSingle();

    if (existing) {
      return { sent: 0, skipped: 'already-sent' };
    }

    const subs = await this.getSubscriptions(userId);
    if (subs.length === 0) {
      return { sent: 0, skipped: 'none-subscribed' };
    }

    let sent = 0;
    for (const sub of subs) {
      const result = await this.pushService.send(sub, payload);
      if (result.ok) {
        sent += 1;
      } else if (result.gone) {
        await this.deleteSubscriptionById(sub.id);
      }
    }

    if (sent > 0) {
      await this.supabase
        .getClient()
        .from('notification_sent_log')
        .insert({
          user_id: userId,
          notification_type: notificationType,
          dedupe_key: dedupeKey,
        });
    }

    return { sent, skipped: null };
  }

  /** Dev-only test push — NOT deduped, sent to every sub for the user. */
  async sendTestPush(userId: string): Promise<{ sent: number }> {
    const subs = await this.getSubscriptions(userId);
    let sent = 0;
    for (const sub of subs) {
      const result = await this.pushService.send(sub, {
        title: 'Treppd test notification',
        body: 'Push notifications are working correctly.',
        url: '/settings',
        tag: 'test',
      });
      if (result.ok) sent += 1;
      else if (result.gone) await this.deleteSubscriptionById(sub.id);
    }
    return { sent };
  }
}
