import { test, expect } from '@playwright/test';

test('cached shell remains available offline after warmup', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByText('TumbuhGuard', { exact: false }).first()).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('TumbuhGuard', { exact: false }).first()).toBeVisible();
});
