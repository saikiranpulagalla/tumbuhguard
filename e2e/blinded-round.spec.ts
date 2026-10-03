import { test, expect } from '@playwright/test';
import { loadCadreCFastDemo } from './helpers';

test('BL03-BL08 Round-2 navigation, reload, and reopen never expose Round-1 values', async ({ page, context }) => {
  await loadCadreCFastDemo(page);
  await expect(page.getByText('Round-1 values are intentionally unavailable in this entry workflow.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('95.8');
  await expect(page.getByRole('heading',{name:'First measurement round'})).toHaveCount(0);

  await page.evaluate(() => history.pushState({probe:true},'',`${location.pathname}#probe`));
  await page.goBack();
  await expect(page.getByRole('heading',{name:'Blinded repeat measurement'})).toBeVisible();
  await expect(page.locator('body')).not.toContainText('95.8');
  await expect(page.getByRole('heading',{name:'First measurement round'})).toHaveCount(0);

  await page.goForward();
  await expect(page.getByRole('heading',{name:'Blinded repeat measurement'})).toBeVisible();
  await expect(page.locator('body')).not.toContainText('95.8');

  await page.reload();
  await expect(page.getByRole('heading',{name:'Blinded repeat measurement'})).toBeVisible();
  await expect(page.locator('body')).not.toContainText('95.8');

  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(reopened.getByRole('heading',{name:'Blinded repeat measurement'})).toBeVisible();
  await expect(reopened.locator('body')).not.toContainText('95.8');
});

test('BL09 a second normal Round-2 tab remains blinded', async ({ page, context }) => {
  await loadCadreCFastDemo(page);
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByRole('heading',{name:'Blinded repeat measurement'})).toBeVisible();
  await expect(second.locator('body')).not.toContainText('95.8');
  await expect(second.getByRole('heading',{name:'First measurement round'})).toHaveCount(0);
});
});
