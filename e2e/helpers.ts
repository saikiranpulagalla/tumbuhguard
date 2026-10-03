import { expect, type Page } from '@playwright/test';

export async function openHome(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'TumbuhGuard Standardize'}).first()).toBeVisible();
}

export async function loadCadreCFastDemo(page: Page) {
  await openHome(page);
  await page.getByRole('button',{name:'Run 90-sec Demo'}).click();
  await expect(page.getByRole('heading',{name:'Blinded repeat measurement'})).toBeVisible();
  await expect(page.getByText('9/10 recorded')).toBeVisible();
}

export async function finishCadreCToResult(page: Page) {
  await loadCadreCFastDemo(page);
  const input=page.getByLabel('Synthetic Subject 10 measurement in centimetres');
  await input.fill('95.9');
  await page.getByRole('button',{name:'Record'}).click();
  await expect(page.getByText('10/10 recorded')).toBeVisible();
  await page.getByRole('button',{name:'Lock Round 2'}).click();
  await page.getByRole('button',{name:'Open reference measurements'}).click();
  await expect(page.getByRole('heading',{name:'Reference repeat measurements'})).toBeVisible();
  await page.getByRole('button',{name:'Load synthetic reference fixture'}).click();
  await expect(page.getByText('20/20 recorded')).toBeVisible();
  await page.getByRole('button',{name:'Lock reference measurements'}).click();
  await page.getByRole('button',{name:'Lock evidence & prepare calculation'}).click();
  await page.getByRole('button',{name:'Calculate deterministic QA result'}).click();
  await expect(page.getByRole('heading',{name:'Standardization evidence'})).toBeVisible();
}
