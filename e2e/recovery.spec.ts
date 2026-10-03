import { test, expect } from '@playwright/test';
import { finishCadreCToResult, loadCadreCFastDemo } from './helpers';

async function openRoundOne(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button',{name:'Start Assessment'}).click();
  await page.getByRole('button',{name:'Validate synthetic setup'}).click();
  await page.getByRole('button',{name:'Open Round 1'}).click();
  await expect(page.getByRole('heading',{name:'First measurement round'})).toBeVisible();
}

test('D01 refresh during Round 1 restores entered progress', async ({ page }) => {
  await openRoundOne(page);
  await page.getByLabel('Synthetic Subject 01 measurement in centimetres').fill('74.2');
  await page.getByRole('button',{name:'Record'}).first().click();
  await expect(page.getByText('1/10 recorded')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'First measurement round'})).toBeVisible();
  await expect(page.getByText('1/10 recorded')).toBeVisible();
});

test('D02 refresh after Round 1 lock preserves the locked state', async ({ page }) => {
  await openRoundOne(page);
  const values=['74.2','76.8','79.5','81.1','83.7','86.4','89.2','91.8','94.1','97.0'];
  for(let index=0;index<10;index++) {
    const label=`Synthetic Subject ${String(index+1).padStart(2,'0')} measurement in centimetres`;
    await page.getByLabel(label).fill(values[index]!);
    await page.getByRole('button',{name:'Record'}).first().click();
  }
  await expect(page.getByText('10/10 recorded')).toBeVisible();
  await page.getByRole('button',{name:'Lock Round 1'}).click();
  await expect(page.getByRole('heading',{name:'Round 1 locked'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Round 1 locked'})).toBeVisible();
});

test('D03 refresh during blinded Round 2 restores state and keeps Round 1 hidden', async ({ page }) => {
  await loadCadreCFastDemo(page);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Blinded repeat measurement'})).toBeVisible();
  await expect(page.getByText('9/10 recorded')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('95.8');
});

test('D04 refresh during reference entry restores recorded reference progress', async ({ page }) => {
  await loadCadreCFastDemo(page);
  await page.getByLabel('Synthetic Subject 10 measurement in centimetres').fill('95.9');
  await page.getByRole('button',{name:'Record'}).click();
  await expect(page.getByText('10/10 recorded')).toBeVisible();
  await page.getByRole('button',{name:'Lock Round 2'}).click();
  await page.getByRole('button',{name:'Open reference measurements'}).click();
  await page.getByLabel('Synthetic Subject 01 reference round 1 centimetres').fill('74.2');
  await page.getByRole('button',{name:'Save'}).first().click();
  await expect(page.getByText('1/20 recorded')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Reference repeat measurements'})).toBeVisible();
  await expect(page.getByText('1/20 recorded')).toBeVisible();
});

test('D05/D06 results survive refresh and browser page close/reopen', async ({ page, context }) => {
  await finishCadreCToResult(page);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Standardization evidence'})).toBeVisible();
  await expect(page.getByText('0.849 cm')).toBeVisible();
  await expect(page.getByText('73.0 cm')).toBeVisible();
  await expect(page.getByText('72.9 cm')).toBeVisible();
  await expect(page.getByText('74.2 cm')).toBeVisible();
  await page.close();
  const reopened=await context.newPage();
  await reopened.goto('/');
  await expect(reopened.getByRole('heading',{name:'Standardization evidence'})).toBeVisible();
});
