'use client';

import { useEffect } from 'react';

/**
 * Register the Treppd service worker once the app has mounted on the client.
 *
 * We do this in a tiny client component rather than calling `navigator.serviceWorker.register`
 * from the notifications flow because:
 *   1. The SW now also handles offline shell caching (Phase F7), so it should
 *      register on every page — not just when the user enables push.
 *   2. Registering on page load means background updates work (`onupdatefound`).
 *
 * We call `registerServiceWorker` from the notifications-api lib which is
 * already idempotent and safe to call repeatedly.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        // Registration failures are not fatal — the app still works
      }
    };
    void register();
  }, []);

  return null;
}
