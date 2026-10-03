import { test, expect } from '@playwright/test';
import { finishCadreCToResult, openHome } from './helpers';

test('home communicates locked competition scope and starts setup', async ({ page }) => {
  await openHome(page);
  await expect(page.getByText('SYNTHETIC DEMO')).toBeVisible();
  await expect(page.getByText('WHO/UNICEF-ALIGNED PROFILE')).toBeVisible();
  await page.getByRole('button',{name:'Start Assessment'}).click();
  await expect(page.getByRole('heading',{name:'Standardization setup'})).toBeVisible();
  await expect(page.getByText('Synthetic Subject 10')).toBeVisible();
  await page.getByRole('button',{name:'Validate synthetic setup'}).click();
  await expect(page.getByRole('heading',{name:'Setup valid'})).toBeVisible();
});

test('Cadre C proves repeatable measurements can still disagree with reference', async ({ page }) => {
  await finishCadreCToResult(page);
  await expect(page.getByText('0.071 cm').first()).toBeVisible();
  await expect(page.getByText('0.849 cm')).toBeVisible();
  await expect(page.getByText('-1.200 cm')).toBeVisible();
  await expect(page.getByText('Reference disagreement detected.')).toBeVisible();

  await page.getByRole('tab',{name:'Equipment'}).click();
  await expect(page.getByText('Demo length/height board')).toBeVisible();
  await page.getByRole('tab',{name:'Protocol'}).click();
  await expect(page.getByText('EXTERNAL_ORACLE_PARITY_PENDING').first()).toBeVisible();
});
