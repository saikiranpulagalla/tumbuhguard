import { test, expect } from '@playwright/test';

test('second tab receives duplicate-tab warning', async ({ context }) => {
  const a=await context.newPage(); const b=await context.newPage();
  await a.goto('/'); await b.goto('/');
  await a.getByRole('button',{name:'Validate synthetic setup'}).click();
  await expect(b.getByText(/another TumbuhGuard tab changed/i)).toBeVisible();
});
