import { test, expect } from '@playwright/test';

test.describe('Campsite-inspired Light Theme', () => {
  test('Dashboard page has light theme styling', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');

    // Take a screenshot of the dashboard
    await page.screenshot({ path: 'tests/screenshots/dashboard.png', fullPage: true });

    // Check that the background is light (white or near-white)
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Verify it's a light color (RGB values should be high)
    expect(bgColor).toMatch(/rgb\(2[0-5][0-9], 2[0-5][0-9], 2[0-5][0-9]\)|rgb\(24[0-9], 24[0-9], 24[0-9]\)|rgb\(25[0-5], 25[0-5], 25[0-5]\)/);

    // Check that the sidebar exists
    const sidebar = page.locator('nav').first();
    await expect(sidebar).toBeVisible();

    // Check that metric cards are visible
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
  });

  test('Prompts page renders correctly', async ({ page }) => {
    await page.goto('/prompts');
    await page.waitForLoadState('domcontentloaded');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/prompts.png', fullPage: true });

    // Check header exists
    const header = page.locator('h1');
    await expect(header).toContainText('Prompts');
  });

  test('Brands page renders correctly', async ({ page }) => {
    await page.goto('/brands');
    await page.waitForLoadState('domcontentloaded');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/brands.png', fullPage: true });

    // Check header exists
    const header = page.locator('h1');
    await expect(header).toContainText('Brand');
  });

  test('Sources page renders correctly', async ({ page }) => {
    await page.goto('/sources');
    await page.waitForLoadState('domcontentloaded');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/sources.png', fullPage: true });

    // Check header exists
    const header = page.locator('h1');
    await expect(header).toContainText('Sources');
  });

  test('Suggestions page renders correctly', async ({ page }) => {
    await page.goto('/suggestions');
    await page.waitForLoadState('domcontentloaded');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/suggestions.png', fullPage: true });

    // Check header exists
    const header = page.locator('h1');
    await expect(header).toContainText('GEO Strategy');
  });

  test('Settings page renders correctly', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/settings.png', fullPage: true });

    // Check header exists
    const header = page.locator('h1');
    await expect(header).toContainText('Settings');
  });

  test('Navigation works across all pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click on Prompts in sidebar (use first match since there might be mobile nav)
    await page.locator('nav a[href="/prompts"]').first().click();
    await expect(page).toHaveURL(/.*prompts/);

    // Click on Brands
    await page.locator('nav a[href="/brands"]').first().click();
    await expect(page).toHaveURL(/.*brands/);

    // Click on Sources
    await page.locator('nav a[href="/sources"]').first().click();
    await expect(page).toHaveURL(/.*sources/);

    // Click on Suggestions
    await page.locator('nav a[href="/suggestions"]').first().click();
    await expect(page).toHaveURL(/.*suggestions/);

    // Go back to Dashboard (skip settings as it may be in collapsed section)
    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL('/');
  });

  test('Cards have proper light theme styling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check card styling
    const card = page.locator('.card').first();
    await expect(card).toBeVisible();

    const cardBgColor = await card.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Card should have white or near-white background
    expect(cardBgColor).toMatch(/rgb\(2[0-5][0-9], 2[0-5][0-9], 2[0-5][0-9]\)|rgb\(25[0-5], 25[0-5], 25[0-5]\)/);
  });
});
