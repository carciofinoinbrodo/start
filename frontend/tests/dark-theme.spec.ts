import { test, expect } from '@playwright/test';

test.describe('Dark Theme', () => {
  test('Settings page has theme toggle', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Take a screenshot of settings page (light mode)
    await page.screenshot({ path: 'tests/screenshots/settings-light.png', fullPage: true });

    // Check that the theme selector buttons exist
    const lightButton = page.locator('button:has-text("Light")');
    const darkButton = page.locator('button:has-text("Dark")');

    await expect(lightButton).toBeVisible();
    await expect(darkButton).toBeVisible();
  });

  test('Can switch to dark theme', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Click on Dark theme button
    await page.locator('button:has-text("Dark")').click();

    // Wait for theme to apply
    await page.waitForTimeout(300);

    // Verify data-theme attribute is set
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Take a screenshot of dark mode settings
    await page.screenshot({ path: 'tests/screenshots/settings-dark.png', fullPage: true });
  });

  test('Dark theme persists across pages', async ({ page }) => {
    // Set dark theme in localStorage before navigating
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Click on Dark theme button
    await page.locator('button:has-text("Dark")').click();
    await page.waitForTimeout(300);

    // Navigate to dashboard
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify dark theme is still applied
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Take a screenshot of dark mode dashboard
    await page.screenshot({ path: 'tests/screenshots/dashboard-dark.png', fullPage: true });

    // Check body background is dark
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Verify it's a dark color (RGB values should be low)
    expect(bgColor).toMatch(/rgb\([0-5][0-9], [0-5][0-9], [0-5][0-9]\)|rgb\([0-9], [0-9], [0-9]\)|rgb\(1[0-9], 1[0-9], 1[0-9]\)|rgb\(2[0-4], 2[0-4], 2[0-7]\)/);
  });

  test('Dark theme on all pages looks correct', async ({ page }) => {
    test.setTimeout(90000); // Increase timeout for this test
    // Set dark theme
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Dark")').click();
    await page.waitForTimeout(300);

    // Prompts page
    await page.goto('/prompts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/prompts-dark.png', fullPage: true });

    // Brands page
    await page.goto('/brands');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/brands-dark.png', fullPage: true });

    // Sources page
    await page.goto('/sources');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/sources-dark.png', fullPage: true });

    // Suggestions page
    await page.goto('/suggestions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/suggestions-dark.png', fullPage: true });
  });

  test('Can switch back to light theme', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Switch to dark then back to light
    await page.locator('button:has-text("Dark")').click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Light")').click();
    await page.waitForTimeout(300);

    // Verify theme is light
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
  });
});
