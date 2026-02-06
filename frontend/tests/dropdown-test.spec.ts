import { test } from '@playwright/test';

test('AI Source dropdown has light theme', async ({ page }) => {
  await page.goto('/prompts');
  await page.waitForLoadState('domcontentloaded');

  // Click the AI Source selector to open dropdown
  await page.locator('button:has-text("AI Overview")').first().click();

  // Wait for dropdown to appear
  await page.waitForTimeout(500);

  // Take a screenshot
  await page.screenshot({ path: 'tests/screenshots/ai-source-dropdown.png', fullPage: false });
});
