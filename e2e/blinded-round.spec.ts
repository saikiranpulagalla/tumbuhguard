import { test, expect } from '@playwright/test';
import { loadCadreCFastDemo } from './helpers';

test('Round-2 normal workflow never exposes Round-1 values, including browser-back/hash navigation', async ({ page }) => {
  await loadCadreCFastDemo(page);
  await expect(page.getByText('Round-1 values are intentionally unavailable in this entry workflow.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('95.8');
  await expect(page.getByRole('heading',{name:'First measurement round'})).toHaveCount(0);

  await page.evaluate(() => history.pushState({probe:true},'',`${location.pathname}#probe`));
  await page.goBack();
  await expect(page.getByRole('heading',{name:'Blinded repeat measurement'})).toBeVisible();
  await expect(page.locator('body')).not.toContainText('95.8');
  await expect(page.getByRole('heading',{name:'First measurement round'})).toHaveCount(0);
});
