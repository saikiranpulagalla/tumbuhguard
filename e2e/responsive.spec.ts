import { expect, test } from '@playwright/test';
import { finishCadreCToResult } from './helpers';

const widths = [320, 360, 390, 412, 768, 1024, 1440] as const;

async function assertViewportFit(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const controls = page.locator('button, input, select, textarea');
  for (let index = 0; index < await controls.count(); index += 1) {
    const box = await controls.nth(index).boundingBox();
    if (box) expect(box.height).toBeGreaterThanOrEqual(44);
  }
}

for (const width of widths) {
  test(`R${width}: Home through evidence remains usable without page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'TumbuhGuard Standardize' }).first()).toBeVisible();
    await assertViewportFit(page);

    await page.getByRole('button', { name: 'Start Assessment' }).click();
    await expect(page.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();
    await assertViewportFit(page);
    await page.getByRole('button', { name: 'Validate synthetic setup' }).click();
    await page.getByRole('button', { name: 'Open Round 1' }).click();
    await expect(page.getByRole('heading', { name: 'First measurement round' })).toBeVisible();
    await expect(page.getByLabel('Synthetic Subject 01 measurement in centimetres')).toHaveAttribute('inputmode', 'decimal');
    await assertViewportFit(page);

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Reset all local demo data' }).click();
    await finishCadreCToResult(page);
    await expect(page.getByRole('heading', { name: 'Standardization evidence' })).toBeVisible();
    await assertViewportFit(page);
    await page.getByRole('button', { name: 'Measurements' }).click();
    await assertViewportFit(page);
  });
}
