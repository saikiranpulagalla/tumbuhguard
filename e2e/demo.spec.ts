import { test, expect } from '@playwright/test';

test('loads deterministic synthetic setup and advances setup gate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Validate the measurer/i })).toBeVisible();
  await expect(page.getByText('10', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Validate synthetic setup' }).click();
  await expect(page.getByRole('heading', { name: 'Setup valid' })).toBeVisible();
});
