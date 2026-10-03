import { test, expect } from '@playwright/test';

test('recovers session after refresh', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Validate synthetic setup' }).click();
  await expect(page.getByRole('heading', { name: 'Setup valid' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Setup valid' })).toBeVisible();
});
