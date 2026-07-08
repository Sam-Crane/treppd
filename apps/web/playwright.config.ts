import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright end-to-end tests.
 *
 * Runs against a real `next dev` server (so the tests exercise the actual
 * middleware, routing, and hydration paths). We stub the Supabase publishable
 * env vars if they're not set, so tests don't hard-depend on a live project —
 * the specs here cover UNAUTHENTICATED pages (landing, /privacy, /login form).
 *
 * Run locally:
 *   npm run e2e:install   # one-time; downloads Chromium
 *   npm run e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    // Isolated port so a running dev server isn't clobbered.
    command: 'next dev -H 127.0.0.1 -p 3100',
    port: 3100,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Test values that pass supabase-js client construction without hitting
      // the network; UNAUTHENTICATED specs never touch supabase.
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        'sb_publishable_test',
    },
  },
});
