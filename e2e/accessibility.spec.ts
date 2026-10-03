import { test, expect } from '@playwright/test';
import { loadCadreCFastDemo } from './helpers';

test('core controls are keyboard reachable and measurement input has an accessible label', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused=page.locator(':focus');
  await expect(focused).toBeVisible();
  await loadCadreCFastDemo(page);
  const input=page.getByLabel('Synthetic Subject 10 measurement in centimetres');
  await expect(input).toBeVisible();
  await input.focus();
  await expect(input).toBeFocused();
});

test.use({ viewport: { width: 390, height: 844 } });
test('measurement screen remains within a phone viewport without horizontal overflow', async ({ page }) => {
  await loadCadreCFastDemo(page);
  const overflow=await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole('button',{name:'Lock Round 2'})).toBeVisible();
});
