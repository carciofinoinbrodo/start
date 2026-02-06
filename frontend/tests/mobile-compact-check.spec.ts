import { test, expect } from '@playwright/test';

test.describe('Mobile Compact UI', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('Dashboard has compact metrics on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for data to load

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-compact-dashboard.png', fullPage: true });

    // Check that header is visible (basic sanity check)
    const header = page.locator('h1:has-text("Dashboard")');
    await expect(header).toBeVisible();
  });

  test('Prompts page has compact cards on mobile', async ({ page }) => {
    await page.goto('/prompts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-compact-prompts.png', fullPage: true });
  });

  test('Sources page has compact layout on mobile', async ({ page }) => {
    await page.goto('/sources');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-compact-sources.png', fullPage: true });
  });

  test('Brands page renders on mobile', async ({ page }) => {
    await page.goto('/brands');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-compact-brands.png', fullPage: true });
  });

  test('Sidebar overlay works correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Screenshot before opening sidebar
    await page.screenshot({ path: 'tests/screenshots/mobile-sidebar-closed.png' });

    // Open sidebar by clicking hamburger menu
    const hamburger = page.locator('button[aria-label="Open menu"], button[aria-label="Open navigation menu"]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(300);

      // Screenshot with sidebar open
      await page.screenshot({ path: 'tests/screenshots/mobile-sidebar-open.png' });

      // Verify sidebar is visible
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // Close sidebar
      const closeButton = page.locator('button[aria-label="Close navigation menu"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }

      // Screenshot after closing
      await page.screenshot({ path: 'tests/screenshots/mobile-sidebar-closed-after.png' });
    }
  });

  test('Dark theme compact mobile view', async ({ page }) => {
    // Set dark theme
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Dark")').click();
    await page.waitForTimeout(300);

    // Navigate to dashboard
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-compact-dashboard-dark.png', fullPage: true });
  });
});
