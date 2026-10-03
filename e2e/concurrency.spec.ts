import { test, expect } from '@playwright/test';

test('CAS rejects stale second-tab save and BroadcastChannel provides UX warning', async ({ context }) => {
  const a=await context.newPage();
  await a.goto('/');
  await a.getByRole('button',{name:'Start Assessment'}).click();
  await expect(a.getByRole('heading',{name:'Standardization setup'})).toBeVisible();

  const b=await context.newPage();
  await b.goto('/');
  await expect(b.getByRole('heading',{name:'Standardization setup'})).toBeVisible();

  await a.getByRole('button',{name:'Validate synthetic setup'}).click();
  await expect(a.getByRole('heading',{name:'Setup valid'})).toBeVisible();
  await expect(b.getByText(/another TumbuhGuard tab changed/i)).toBeVisible();

  await b.getByRole('button',{name:'Validate synthetic setup'}).click();
  await expect(b.getByText(/STALE_REVISION/i)).toBeVisible();
  await expect(b.getByRole('heading',{name:'Setup valid'})).toBeVisible();
});
