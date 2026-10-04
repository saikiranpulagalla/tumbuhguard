import { test, expect } from '@playwright/test';
import { finishCadreCToResult } from './helpers';

async function rootAssessmentCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(async () => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('tumbuhguard-standardize');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const rows = database.transaction('sessions', 'readonly').objectStore('sessions').getAll();
      rows.onerror = () => reject(rows.error);
      rows.onsuccess = () => { database.close(); resolve(rows.result.filter(row => String(row.id).startsWith('assessment-')).length); };
    };
  }));
}

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
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button',{name:'Reset all local demo data'}).click();
  await expect(page.getByRole('button',{name:'Run 90-sec Demo'})).toBeVisible();
  await expect(page.getByText('SYNTHETIC DEMO')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Run 90-sec Demo'})).toBeVisible();
});

test('rapid Start Assessment creates exactly one independent root session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Assessment' }).dblclick();
  await expect(page.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();
  await expect.poll(() => rootAssessmentCount(page)).toBe(1);
});

test('rapid demo/reset activations remain deterministic and confirmation is cancellable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Run 90-sec Demo' }).dblclick();
  await expect(page.getByRole('heading', { name: 'Blinded repeat measurement' })).toBeVisible();

  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Reset all local demo data' }).click();
  await expect(page.getByRole('heading', { name: 'Blinded repeat measurement' })).toBeVisible();

  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset all local demo data' }).dblclick();
  await expect(page.getByRole('button', { name: 'Run 90-sec Demo' })).toBeVisible();
});

test('closed session remains preserved when the user returns Home', async ({ page }) => {
  await finishCadreCToResult(page);
  await page.getByRole('button', { name: 'Close session' }).click();
  await expect(page.getByRole('heading', { name: 'Session closed' })).toBeVisible();
  await page.getByRole('button', { name: 'Return Home' }).click();
  await expect(page.getByRole('button', { name: 'Start Assessment' })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('tumbuhguard-standardize');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const rows = database.transaction('sessions', 'readonly').objectStore('sessions').getAll();
      rows.onerror = () => reject(rows.error);
      rows.onsuccess = () => { database.close(); resolve(rows.result.filter(row => row.state === 'CLOSED').length); };
    };
  }))).toBeGreaterThan(0);
});
