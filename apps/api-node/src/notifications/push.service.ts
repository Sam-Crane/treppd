import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import * as webpush from 'web-push';

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Wrapper around the `web-push` library.
 * - Configures VAPID once at boot if keys are present in env.
 * - Silently no-ops with a warning if keys are missing (dev laptops).
 * - Returns structured success/failure so the scheduler can reap dead
 *   subscriptions (HTTP 410 Gone) from the DB.
 */
@Injectable()
export class PushService implements OnModuleInit {
  private isConfigured = false;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:hello@treppd.de';

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID keys not set — push notifications are disabled. Subscribe endpoint will refuse.',
      );
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.isConfigured = true;
    this.logger.log('Web Push VAPID configured');
  }

  /** Returns the public key so the frontend can subscribe. */
  getPublicKey(): string | null {
    if (!this.isConfigured) return null;
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? null;
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Send a payload to one subscription.
   * Returns `{ ok: true }` on success or `{ ok: false, gone: true/false }`
   * on failure so the caller can decide whether to purge the row.
   */
  async send(
    subscription: PushSubscriptionRecord,
    payload: PushPayload,
  ): Promise<{ ok: true } | { ok: false; gone: boolean; error: string }> {
    if (!this.isConfigured) {
      return { ok: false, gone: false, error: 'vapid-not-configured' };
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
          },
        },
        JSON.stringify(payload),
        {
          TTL: 60 * 60 * 24, // 24h — push services can queue briefly
          urgency: 'normal',
        },
      );
      return { ok: true };
    } catch (err) {
      const error = err as { statusCode?: number; message?: string };
      // 404 / 410 indicate the subscription is permanently dead.
      const gone = error.statusCode === 404 || error.statusCode === 410;
      this.logger.warn(
        {
          statusCode: error.statusCode,
          gone,
          endpoint: subscription.endpoint.slice(0, 60),
        },
        gone
          ? 'Push subscription is gone; caller should delete the row'
          : 'Push send failed',
      );
      return { ok: false, gone, error: error.message ?? 'unknown' };
    }
  }
}
