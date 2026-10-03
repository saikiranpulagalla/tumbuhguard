import { test, expect } from '@playwright/test';

test('manifest is locally served', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('TumbuhGuard Standardize');
});
