import { test, expect } from '@playwright/test';

async function openRoundOne(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button',{name:'Start Assessment'}).click();
  await page.getByRole('button',{name:'Validate synthetic setup'}).click();
  await page.getByRole('button',{name:'Open Round 1'}).click();
  await expect(page.getByRole('heading',{name:'First measurement round'})).toBeVisible();
}

test('hostile input: malformed decimal is rejected, comma decimal is accepted, double click cannot duplicate', async ({ page }) => {
  await openRoundOne(page);
  const input=page.getByLabel('Synthetic Subject 01 measurement in centimetres');
  await input.fill('80,2,3');
  await page.getByRole('button',{name:'Record'}).first().click();
  await expect(page.getByRole('alert')).toContainText('valid decimal');
  await expect(page.getByText('0/10 recorded')).toBeVisible();

  await input.fill('80,2');
  await page.getByRole('button',{name:'Record'}).first().dblclick();
  await expect(page.getByText('1/10 recorded')).toBeVisible();
  await expect(page.getByText('2/10 recorded')).toHaveCount(0);
});

test('B10 rapid Enter submits one measurement only', async ({ page }) => {
  await openRoundOne(page);
  const input=page.getByLabel('Synthetic Subject 01 measurement in centimetres');
  await input.fill('80,2');
  await Promise.all([
    input.press('Enter', { noWaitAfter: true }),
    input.press('Enter', { noWaitAfter: true }),
  ]);
  await expect(page.getByText('1/10 recorded')).toBeVisible();
  await expect(page.getByText('2/10 recorded')).toHaveCount(0);
});

test('reset reconstructs deterministic synthetic home state and survives reload', async ({ page }) => {
  await openRoundOne(page);
  await page.getByRole('button',{name:'Reset demo'}).click();
  await expect(page.getByRole('button',{name:'Run 90-sec Demo'})).toBeVisible();
  await expect(page.getByText('SYNTHETIC DEMO')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Run 90-sec Demo'})).toBeVisible();
});
