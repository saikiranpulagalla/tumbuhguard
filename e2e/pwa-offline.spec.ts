import { expect, test } from '@playwright/test';

async function warmCache(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'TumbuhGuard Standardize' }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.ready.then(() => true))).toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

async function completeWorkflowOffline(page: import('@playwright/test').Page) {
  const roundOne = ['74.2', '76.8', '79.5', '81.1', '83.7', '86.4', '89.2', '91.8', '94.1', '97.0'];
  await page.getByRole('button', { name: 'Start Assessment' }).click();
  await page.getByRole('button', { name: 'Validate synthetic setup' }).click();
  await page.getByRole('button', { name: 'Open Round 1' }).click();
  for (const [index, value] of roundOne.entries()) {
    const subject = String(index + 1).padStart(2, '0');
    await page.getByLabel(`Synthetic Subject ${subject} measurement in centimetres`).fill(value);
    await page.getByRole('button', { name: 'Record' }).first().click();
  }
  await page.getByRole('button', { name: 'Lock Round 1' }).click();
  await page.getByRole('button', { name: 'Open blinded Round 2' }).click();
  await expect(page.getByRole('heading', { name: 'Blinded repeat measurement' })).toBeVisible();
  for (const [index, value] of roundOne.entries()) {
    const subject = String(index + 1).padStart(2, '0');
    await page.getByLabel(`Synthetic Subject ${subject} measurement in centimetres`).fill((Number(value) + 0.1).toFixed(1));
    await page.getByRole('button', { name: 'Record' }).first().click();
  }
  await page.getByRole('button', { name: 'Lock Round 2' }).click();
  await page.getByRole('button', { name: 'Open reference measurements' }).click();
  for (const [index, value] of roundOne.entries()) {
    const subject = String(index + 1).padStart(2, '0');
    for (const round of [1, 2] as const) {
      const input = page.getByLabel(`Synthetic Subject ${subject} reference round ${round} centimetres`);
      await input.fill((Number(value) + 2 + (round === 2 ? 0.1 : 0)).toFixed(1));
      await input.locator('xpath=following-sibling::button').click();
    }
  }
  await page.getByRole('button', { name: 'Lock reference measurements' }).click();
  for (let index = 0; index < 3; index += 1) await page.getByRole('button', { name: 'Observed OK' }).first().click();
  await page.getByRole('button', { name: 'Lock evidence & prepare calculation' }).click();
  await page.getByRole('button', { name: 'Calculate deterministic QA result' }).click();
  await expect(page.getByRole('heading', { name: 'Standardization evidence' })).toBeVisible();
}

test('O01-O07 and O10: warm-cached production workflow remains usable offline', async ({ page, context }) => {
  test.setTimeout(120_000);
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await warmCache(page);
  const applicationOrigin = new URL(page.url()).origin;

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'TumbuhGuard Standardize' }).first()).toBeVisible();
  await expect(page.getByText('OFFLINE').first()).toBeVisible();

  await completeWorkflowOffline(page);
  for (const label of ['Measurements', 'Observation', 'Equipment', 'Protocol']) {
    await page.getByRole('button', { name: label }).click();
  }
  await page.getByRole('button', { name: 'Review & create re-standardization' }).click();
  await page.getByRole('button', { name: 'Create Re-standardization' }).click();
  await expect(page.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();

  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(reopened.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();
  expect(requests.filter(url => new URL(url).origin !== applicationOrigin)).toEqual([]);
});

test('O08: a waiting worker does not reload an active assessment', async ({ page }) => {
  await warmCache(page);
  await page.getByRole('button', { name: 'Start Assessment' }).click();
  await page.getByRole('button', { name: 'Validate synthetic setup' }).click();
  await page.getByRole('button', { name: 'Open Round 1' }).click();
  await expect(page.getByRole('heading', { name: 'First measurement round' })).toBeVisible();

  const reloads: number[] = [];
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) reloads.push(Date.now()); });
  const waiting = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register('/__e2e-waiting-sw.js');
    await new Promise<void>((resolve, reject) => {
      const candidate = registration.installing;
      if (!candidate) { resolve(); return; }
      candidate.addEventListener('statechange', () => candidate.state === 'installed' && resolve());
      candidate.addEventListener('error', () => reject(new Error('waiting worker failed to install')));
    });
    return Boolean(registration.waiting);
  });
  expect(waiting).toBe(true);
  await expect(page.getByRole('heading', { name: 'First measurement round' })).toBeVisible();
  expect(reloads).toEqual([]);
});

test('O09: denied or missing persistent-storage APIs do not prevent local use', async ({ browser }) => {
  for (const storage of ['denied', 'missing'] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(mode => {
      Object.defineProperty(navigator, 'storage', {
        configurable: true,
        value: mode === 'denied' ? { persist: () => Promise.resolve(false) } : undefined,
      });
    }, storage);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Assessment' }).click();
    await page.getByRole('button', { name: 'Validate synthetic setup' }).click();
    await expect(page.getByRole('heading', { name: 'Setup valid' })).toBeVisible();
    await context.close();
  }
});
