import { expect, test } from '@playwright/test';
import { finishCadreCToResult, loadCadreCFastDemo, openHome } from './helpers';

async function tabTo(page: import('@playwright/test').Page, target: string) {
  for (let index = 0; index < 40; index += 1) {
    if (await page.locator(target).evaluate(element => document.activeElement === element).catch(() => false)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Keyboard focus did not reach ${target}`);
}

test('A01, A02, A04, A07 and A08: labelled controls, errors, focus, blinding, and touch sizing', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Start Assessment' }).click();
  await page.getByRole('button', { name: 'Validate synthetic setup' }).click();
  await page.getByRole('button', { name: 'Open Round 1' }).click();
  const input = page.getByLabel('Synthetic Subject 01 measurement in centimetres');
  await expect(input).toBeVisible();
  await input.fill('80abc');
  await page.getByRole('button', { name: 'Record' }).first().click();
  const error = page.getByRole('alert');
  await expect(error).toBeVisible();
  await expect(input).toHaveAttribute('aria-describedby', await error.getAttribute('id'));
  await input.focus();
  await expect.poll(() => input.evaluate(element => getComputedStyle(element).outlineWidth)).not.toBe('0px');
  await expect(input).toHaveCSS('min-height', '44px');

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await loadCadreCFastDemo(page);
  await expect(page.locator('body')).not.toContainText('95.8');
  await expect(page.locator('[aria-label*="Round 1" i]')).toHaveCount(0);
});

test('A03: keyboard-only activation reaches workflow controls without a focus trap', async ({ page }) => {
  await openHome(page);
  await tabTo(page, 'button:has-text("Start Assessment")');
  await page.keyboard.press('Enter');
  await tabTo(page, 'button:has-text("Validate synthetic setup")');
  await page.keyboard.press('Space');
  await tabTo(page, 'button:has-text("Open Round 1")');
  await page.keyboard.press('Enter');
  await tabTo(page, '#measurement-1-S01');
  await page.keyboard.type('74.2');
  await page.keyboard.press('Enter');
  await expect(page.getByText('1/10 recorded')).toBeVisible();

  await page.getByRole('button', { name: 'Reset demo' }).focus();
  await page.keyboard.press('Enter');
  await tabTo(page, 'button:has-text("Run 90-sec Demo")');
  await page.keyboard.press('Enter');
  await tabTo(page, '#measurement-2-S10');
  await page.keyboard.type('95.9');
  await page.keyboard.press('Enter');
  await expect(page.getByText('10/10 recorded')).toBeVisible();
});

test('A05 and A06: evidence uses ordinary pressed buttons and exposes textual status', async ({ page }) => {
  await finishCadreCToResult(page);
  await expect(page.getByRole('tab')).toHaveCount(0);
  const measurements = page.getByRole('button', { name: 'Measurements' });
  const protocol = page.getByRole('button', { name: 'Protocol' });
  await expect(measurements).toHaveAttribute('aria-pressed', 'true');
  await protocol.focus();
  await page.keyboard.press('Space');
  await expect(protocol).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Reference disagreement detected.')).toBeVisible();
  await expect(page.getByText('NEEDS RE-STANDARDIZATION').first()).toBeVisible();
});
