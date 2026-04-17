/**
 * Client for Web Push + notification preferences (Phase 3e).
 *
 * Exposed surface:
 *   - registerServiceWorker()  — one-time registration (idempotent)
 *   - subscribeToPush()        — asks permission, creates PushSubscription, POSTs to NestJS
 *   - unsubscribeFromPush()    — removes local sub + tells NestJS to forget it
 *   - getVapidKey()            — fetches the server's VAPID public key
 *   - getPreferences() / updatePreferences() — CRUD for /notifications/preferences
 *   - sendTestPush()           — dev-only handy check
 *
 * Browser support: Chrome/Edge/Firefox (all). Safari requires an installed PWA
 * AND Safari 16.4+. We surface a clear error to the user on unsupported.
 */
import { api } from './api';

export interface NotificationPreferences {
  user_id: string;
  visa_expiry_enabled: boolean;
  anmeldung_enabled: boolean;
  roadmap_nudges_enabled: boolean;
  digest_hour: number;
  timezone: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) return existing;
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

export async function getSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await registerServiceWorker();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export const notificationsApi = {
  getVapidKey: () =>
    api.get<{ key: string | null }>('/notifications/vapid-public-key'),

  getPreferences: () =>
    api.get<NotificationPreferences>('/notifications/preferences'),

  updatePreferences: (body: Partial<NotificationPreferences>) =>
    // Prefer PATCH but our tiny api client only exposes get/post/patch/delete
    api.patch<NotificationPreferences>('/notifications/preferences', body),

  subscribe: async (): Promise<PushSubscription> => {
    if (!isPushSupported()) {
      throw new Error('Push notifications are not supported on this device.');
    }
    const reg = await registerServiceWorker();
    if (!reg) {
      throw new Error('Could not register the service worker.');
    }

    // Fetch the VAPID key from the server (prefer runtime over build-time
    // env so a redeploy can rotate keys without a frontend rebuild).
    const { key } = await notificationsApi.getVapidKey();
    const vapidKey =
      key ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
    if (!vapidKey) {
      throw new Error('Push is not configured on the server.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was denied.');
    }

    // Cast through `BufferSource` — newer TS DOM libs over-constrain
    // Uint8Array to ArrayBuffer-backed-only, but the runtime accepts any
    // ArrayBufferView.
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    await api.post('/notifications/subscribe', {
      endpoint: sub.endpoint,
      keys: {
        p256dh: arrayBufferToBase64Url(sub.getKey('p256dh')),
        auth: arrayBufferToBase64Url(sub.getKey('auth')),
      },
      user_agent:
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });

    return sub;
  },

  unsubscribe: async (): Promise<void> => {
    const sub = await getSubscription();
    if (!sub) return;
    try {
      await api.delete(
        `/notifications/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`,
      );
    } catch {
      /* best-effort — still unsubscribe locally */
    }
    await sub.unsubscribe();
  },

  sendTestPush: () =>
    api.post<{ sent: number }>('/notifications/test'),
};
