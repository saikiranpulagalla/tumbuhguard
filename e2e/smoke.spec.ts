import { expect, test } from '@playwright/test';

test('B01 production preview loads the application shell', async ({ page }) => {
  await test.step('open production preview', async () => {
    await page.goto('/');
  });
  await test.step('render application home', async () => {
    await expect(page.getByRole('heading', { name: 'TumbuhGuard Standardize' }).first()).toBeVisible();
  });
});
