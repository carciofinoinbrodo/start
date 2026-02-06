import { test, expect } from '@playwright/test';

test.describe('Visual Audit - All Screens', () => {

  // iPhone 14 Pro dimensions
  test.describe('Mobile (iPhone 14 Pro - 393x852)', () => {
    test.use({ viewport: { width: 393, height: 852 } });

    test('Dashboard mobile view', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/audit-mobile-dashboard.png', fullPage: true });
    });

    test('Prompts mobile view', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/audit-mobile-prompts.png', fullPage: true });
    });

    test('Sources mobile view', async ({ page }) => {
      await page.goto('/sources');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/audit-mobile-sources.png', fullPage: true });
    });

    test('Brands mobile view', async ({ page }) => {
      await page.goto('/brands');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/audit-mobile-brands.png', fullPage: true });
    });

    test('Settings mobile view', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/screenshots/audit-mobile-settings.png', fullPage: true });
    });

    test('Sidebar open on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Open sidebar
      const menuButton = page.locator('button[aria-label="Open menu"], button[aria-label="Open navigation menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/screenshots/audit-mobile-sidebar.png' });
      }
    });

    test('Dark mode mobile', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Dark")').click();
      await page.waitForTimeout(300);

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/audit-mobile-dashboard-dark.png', fullPage: true });
    });
  });

  // Desktop view
  test.describe('Desktop (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('Dashboard desktop view', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/audit-desktop-dashboard.png', fullPage: true });
    });

    test('Prompts desktop view', async ({ page }) => {
      await page.goto('/prompts');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/audit-desktop-prompts.png', fullPage: true });
    });

    test('Dark mode desktop', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Dark")').click();
      await page.waitForTimeout(300);

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/audit-desktop-dashboard-dark.png', fullPage: true });
    });
  });
});
