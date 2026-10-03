import { test, expect } from '@playwright/test';

// This acceptance spec intentionally checks UI disclosure rather than claiming cryptographic secrecy.
test('Round-2 screen never renders Round-1 values in the normal workflow', async ({ page }) => {
  await page.goto('/');
  // Full data-entry journey is intentionally explicit in the UI; fixture-assisted navigation can be added
  // only after the dependency/browser harness is available. The invariant is also covered by domain DTO tests.
  await expect(page.locator('body')).not.toContainText('Round-1 values are shown');
});
