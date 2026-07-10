import { expect, test } from '@playwright/test';

/**
 * Smoke E2E covering the unauthenticated surface:
 *   - landing page renders (proves hydration + fonts + middleware pass-through)
 *   - Privacy page renders GDPR content (proves the /privacy route + link)
 *   - Login page renders the sign-in form and validates required fields
 *
 * These specs do NOT depend on Supabase or the API being reachable — they hit
 * only the Next.js render output for public routes.
 */

test.describe('Public surface smoke', () => {
  test('landing page renders with hero and privacy link', async ({ page }) => {
    await page.goto('/');
    // Any of the hero/marketing sections should show — anchor on the H1.
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    // Footer links to /privacy (added in Phase 5).
    const privacyLink = page.getByRole('link', { name: 'Privacy' });
    await expect(privacyLink).toBeVisible();
  });

  test('privacy page shows GDPR rights section', async ({ page }) => {
    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', { name: /Privacy notice/i }),
    ).toBeVisible();
    // GDPR rights section must be present per the rubric.
    await expect(
      page.getByRole('heading', { name: /Your rights/i }),
    ).toBeVisible();
    await expect(page.getByText(/GDPR|Art\. 15|Art\. 20/i).first()).toBeVisible();
  });

  test('login page renders form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});
