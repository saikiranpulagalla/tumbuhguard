import { test, expect } from '@playwright/test';
import { loadCadreCFastDemo } from './helpers';

test('manifest is locally served and active workflow survives service-worker update checks', async ({ page, request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('TumbuhGuard Standardize');

  await loadCadreCFastDemo(page);
  const before=await page.getByText('9/10 recorded').textContent();
  await page.evaluate(async () => {
    const registration=await navigator.serviceWorker?.ready;
    await registration?.update();
  });
  await page.waitForTimeout(500);
  await expect(page.getByRole('heading',{name:'Blinded repeat measurement'})).toBeVisible();
  expect(await page.getByText('9/10 recorded').textContent()).toBe(before);
});
