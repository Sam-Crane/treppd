/* Treppd service worker — Phase 3e + PWA offline shell (F-track)
 *
 * Responsibilities:
 *   - Handle Web Push events (Phase 3e) — show native notifications
 *   - Handle notification clicks — focus existing tab or open a new window
 *   - Cache an "app shell" (manifest, icons, logos) so the PWA loads offline
 *     once the user has opened it online at least once.
 *   - NEVER cache API responses or HTML pages — we want data to always be
 *     fresh, and the Next.js App Router has its own route cache.
 *
 * Small on purpose — offline roadmap/forms caching is out of scope for MVP.
 */

const CACHE_VERSION = 'treppd-shell-v1';
const SHELL_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/treppd-logo-horizontal.png',
  '/treppd-logo-vertical.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {
        // Any single asset missing shouldn't block SW install
      }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge old shell caches on version bump
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('treppd-shell-') && k !== CACHE_VERSION)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Cache-first strategy for known shell assets; network-first for everything else.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin GET requests; let the browser deal with cross-origin.
  if (url.origin !== self.location.origin) return;

  const isShell = SHELL_ASSETS.some((path) => url.pathname === path);
  if (!isShell) return; // pass through — don't intercept HTML / API calls

  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      }),
    ),
  );
});

// ---- Push notifications (Phase 3e) -----------------------------------------

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Treppd',
    body: 'You have a new notification.',
    url: '/',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      try {
        payload.body = event.data.text();
      } catch {
        /* keep defaults */
      }
    }
  }

  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    tag: payload.tag || 'treppd-notification',
    data: { url: payload.url || '/' },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.pathname === targetUrl || url.pathname.endsWith(targetUrl)) {
            return client.focus();
          }
        } catch {
          /* ignore */
        }
      }

      if (allClients.length > 0) {
        const client = allClients[0];
        if ('navigate' in client) {
          await client.navigate(targetUrl);
        }
        return client.focus();
      }

      return self.clients.openWindow(targetUrl);
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
