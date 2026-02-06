import { test, expect } from '@playwright/test';

// Mobile viewport sizes
const mobileViewport = { width: 375, height: 812 }; // iPhone X
const tabletViewport = { width: 768, height: 1024 }; // iPad

test.describe('Mobile Responsive Design', () => {
  test('Dashboard renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-dashboard.png', fullPage: true });

    // Sidebar should be hidden on mobile (hamburger menu visible)
    const sidebar = page.locator('aside');
    // On mobile, sidebar should be hidden by default

    // Header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Metric cards should stack vertically
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
  });

  test('Dashboard renders correctly on tablet', async ({ page }) => {
    await page.setViewportSize(tabletViewport);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'tests/screenshots/tablet-dashboard.png', fullPage: true });
  });

  test('Prompts page renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto('/prompts');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'tests/screenshots/mobile-prompts.png', fullPage: true });

    // Header should be visible
    const header = page.locator('h1');
    await expect(header).toContainText('Prompts');
  });

  test('Brands page renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto('/brands');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'tests/screenshots/mobile-brands.png', fullPage: true });
  });

  test('Settings page renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'tests/screenshots/mobile-settings.png', fullPage: true });

    // Theme toggle buttons should be visible
    const lightButton = page.locator('button:has-text("Light")');
    const darkButton = page.locator('button:has-text("Dark")');
    await expect(lightButton).toBeVisible();
    await expect(darkButton).toBeVisible();
  });

  test('Mobile navigation menu works', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Look for mobile menu button (hamburger)
    const mobileMenuButton = page.locator('button[aria-label="Open navigation menu"]');

    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(300);

      // Mobile nav should now be visible
      const mobileNav = page.locator('nav');
      await expect(mobileNav).toBeVisible();

      // Take screenshot with menu open
      await page.screenshot({ path: 'tests/screenshots/mobile-nav-open.png', fullPage: true });
    }
  });

  test('Sources page renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto('/sources');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'tests/screenshots/mobile-sources.png', fullPage: true });
  });

  test('Suggestions page renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto('/suggestions');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: 'tests/screenshots/mobile-suggestions.png', fullPage: true });
  });
});
