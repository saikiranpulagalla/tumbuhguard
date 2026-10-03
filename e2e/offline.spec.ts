import { test, expect } from '@playwright/test';

async function waitForOfflineReady(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(async () => { if ('serviceWorker' in navigator) await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.getByRole('heading',{name:'TumbuhGuard Standardize'})).toBeVisible();
}

test('warm-cache complete Cadre C workflow and re-standardization work offline', async ({ page, context }) => {
  await waitForOfflineReady(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(/OFFLINE/).first()).toBeVisible();
  await page.getByRole('button',{name:'Run 90-sec Demo'}).click();
  await page.getByLabel('Synthetic Subject 10 measurement in centimetres').fill('95.9');
  await page.getByRole('button',{name:'Record'}).click();
  await expect(page.getByText('10/10 recorded')).toBeVisible();
  await page.getByRole('button',{name:'Lock Round 2'}).click();
  await page.getByRole('button',{name:'Open reference measurements'}).click();
  await page.getByRole('button',{name:'Load synthetic reference fixture'}).click();
  await expect(page.getByText('20/20 recorded')).toBeVisible();
  await page.getByRole('button',{name:'Lock reference measurements'}).click();
  await page.getByRole('button',{name:'Lock evidence & prepare calculation'}).click();
  await page.getByRole('button',{name:'Calculate deterministic QA result'}).click();
  await expect(page.getByText('0.849 cm')).toBeVisible();
  await page.getByRole('button',{name:'Review & create re-standardization'}).click();
  await page.getByLabel('Supervisor remediation note').fill('Review positioning and reference comparison before next attempt.');
  await page.getByRole('button',{name:'Add remediation note'}).click();
  await page.getByRole('button',{name:'Create Re-standardization'}).click();
  await expect(page.getByRole('heading',{name:'Standardization setup'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Standardization setup'})).toBeVisible();
});

test('denied persistent-storage permission does not break startup', async ({ page }) => {
  await page.addInitScript(() => {
    try { Object.defineProperty(navigator,'storage',{configurable:true,value:{persist:async()=>false}}); } catch { /* browser may expose a non-configurable implementation */ }
  });
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'TumbuhGuard Standardize'})).toBeVisible();
});
