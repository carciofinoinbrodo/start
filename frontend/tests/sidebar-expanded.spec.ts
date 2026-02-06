import { test, expect } from '@playwright/test';

test('Sidebar expanded shows new prompt button and pro tip', async ({ page }) => {
  // Set viewport wider to ensure sidebar is not collapsed
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // First click the expand button if sidebar is collapsed
  const expandButton = page.locator('button[title="Expand sidebar"]');
  if (await expandButton.isVisible()) {
    await expandButton.click();
    await page.waitForTimeout(500);
  }

  // Check for "New prompt" button
  const newPromptButton = page.locator('button:has-text("New prompt")');
  await expect(newPromptButton).toBeVisible();

  // Check for "Pro tip" card
  const proTip = page.locator('text=Pro tip');
  await expect(proTip).toBeVisible();

  // Check for "Help & Support" link
  const helpLink = page.locator('text=Help & Support');
  await expect(helpLink).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: 'tests/screenshots/sidebar-expanded.png', fullPage: true });
});

test('Sidebar shows collapsed state correctly', async ({ page }) => {
  // Set viewport wider
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // First expand if collapsed
  const expandButton = page.locator('button[title="Expand sidebar"]');
  if (await expandButton.isVisible()) {
    await expandButton.click();
    await page.waitForTimeout(500);
  }

  // Now collapse the sidebar
  const collapseButton = page.locator('button[title="Collapse sidebar"]');
  if (await collapseButton.isVisible()) {
    await collapseButton.click();
    await page.waitForTimeout(500);
  }

  // Verify expanded elements are hidden
  const newPromptButton = page.locator('button:has-text("New prompt")');
  await expect(newPromptButton).not.toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: 'tests/screenshots/sidebar-collapsed.png', fullPage: true });
});
