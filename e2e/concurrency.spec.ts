import { test, expect } from '@playwright/test';
import { finishCadreCToResult } from './helpers';

async function activeSessionId(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(async () => new Promise<string>((resolve, reject) => {
    const request = indexedDB.open('tumbuhguard-standardize');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('sessions', 'readonly');
      const records = transaction.objectStore('sessions').getAll();
      records.onerror = () => reject(records.error);
      records.onsuccess = () => {
        database.close();
        const active = records.result.find(record => record.state === 'REMEDIATION');
        if (!active) reject(new Error('Expected a remediation parent session'));
        else resolve(active.id);
      };
    };
  }));
}

async function linkedChildren(page: import('@playwright/test').Page, parentId: string): Promise<unknown[]> {
  return page.evaluate(async (id) => new Promise<unknown[]>((resolve, reject) => {
    const request = indexedDB.open('tumbuhguard-standardize');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('sessions', 'readonly');
      const records = transaction.objectStore('sessions').getAll();
      records.onerror = () => reject(records.error);
      records.onsuccess = () => {
        database.close();
        resolve(records.result.filter(record => record.parentSessionId === id));
      };
    };
  }), parentId);
}

async function activeNonTemplateCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(async () => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('tumbuhguard-standardize');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const records = database.transaction('sessions', 'readonly').objectStore('sessions').getAll();
      records.onerror = () => reject(records.error);
      records.onsuccess = () => {
        database.close();
        resolve(records.result.filter(record => record.id !== 'demo-standardization-001' && record.state !== 'CLOSED').length);
      };
    };
  }));
}

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

test('N03 concurrent tabs create exactly one active workflow head', async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await Promise.all([a.goto('/'), b.goto('/')]);
  await Promise.all([
    a.getByRole('button', { name: 'Start Assessment' }).click(),
    b.getByRole('button', { name: 'Start Assessment' }).click(),
  ]);
  await expect.poll(() => activeNonTemplateCount(a)).toBe(1);
  await expect.poll(async () => {
    const [aVisible, bVisible] = await Promise.all([
      a.getByRole('heading', { name: 'Standardization setup' }).isVisible().catch(() => false),
      b.getByRole('heading', { name: 'Standardization setup' }).isVisible().catch(() => false),
    ]);
    return Number(aVisible) + Number(bVisible);
  }).toBe(1);
});

test('N03 Assessment versus Demo race preserves exactly one active workflow head', async ({ context }) => {
  const assessment = await context.newPage();
  const demo = await context.newPage();
  await Promise.all([assessment.goto('/'), demo.goto('/')]);
  await Promise.all([
    assessment.getByRole('button', { name: 'Start Assessment' }).click(),
    demo.getByRole('button', { name: 'Run 90-sec Demo' }).click(),
  ]);
  await expect.poll(() => activeNonTemplateCount(assessment)).toBe(1);
});

test('N03 Demo versus Assessment race preserves exactly one active workflow head', async ({ context }) => {
  const demo = await context.newPage();
  const assessment = await context.newPage();
  await Promise.all([demo.goto('/'), assessment.goto('/')]);
  await Promise.all([
    demo.getByRole('button', { name: 'Run 90-sec Demo' }).click(),
    assessment.getByRole('button', { name: 'Start Assessment' }).click(),
  ]);
  await expect.poll(() => activeNonTemplateCount(demo)).toBe(1);
});

test('B08 reset rejects a stale-tab write without resurrecting the deleted session', async ({ context }) => {
  const a = await context.newPage();
  await a.goto('/');
  await a.getByRole('button', { name: 'Start Assessment' }).click();
  await expect(a.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();

  const b = await context.newPage();
  await b.goto('/');
  await expect(b.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();

  a.once('dialog', dialog => dialog.accept());
  await a.getByRole('button', { name: 'Reset all local demo data' }).click();
  await expect(a.getByRole('button', { name: 'Run 90-sec Demo' })).toBeVisible();

  await expect(b.getByRole('heading', { name: 'TumbuhGuard Standardize' }).first()).toBeVisible();
  await expect(b.getByRole('button', { name: 'Run 90-sec Demo' })).toBeVisible();
});

test('N06 SESSION_NOT_FOUND clears a stale screen without BroadcastChannel', async ({ context }) => {
  const a = await context.newPage();
  await a.goto('/');
  await a.getByRole('button', { name: 'Start Assessment' }).click();
  await expect(a.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();

  const b = await context.newPage();
  await b.addInitScript(() => {
    Object.defineProperty(window, 'BroadcastChannel', { value: undefined, configurable: true });
  });
  await b.goto('/');
  await expect(b.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();

  a.once('dialog', dialog => dialog.accept());
  await a.getByRole('button', { name: 'Reset all local demo data' }).click();
  await b.getByRole('button', { name: 'Validate synthetic setup' }).click();
  await expect(b.getByRole('button', { name: 'Start Assessment' })).toBeVisible();
  await expect(b.getByRole('heading', { name: 'Standardization setup' })).toHaveCount(0);
});

test('B11 rapid re-standardization creation makes exactly one clean child session', async ({ page }) => {
  await finishCadreCToResult(page);
  await page.getByRole('button', { name: 'Review & create re-standardization' }).click();
  await expect(page.getByRole('heading', { name: 'Review evidence before re-standardization' })).toBeVisible();
  const parentId = await activeSessionId(page);

  await page.getByRole('button', { name: 'Create Re-standardization' }).dblclick();
  await expect(page.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();

  const children = await linkedChildren(page, parentId) as Array<{ parentSessionId: string; state: string; measurements: unknown[]; result: unknown }>;
  expect(children).toHaveLength(1);
  expect(children[0]).toMatchObject({ parentSessionId: parentId, state: 'DRAFT', result: null });
  expect(children[0]?.measurements).toEqual([]);
});

test('B12 stale tab cannot create a second re-standardization child', async ({ context }) => {
  const a = await context.newPage();
  await finishCadreCToResult(a);
  await a.getByRole('button', { name: 'Review & create re-standardization' }).click();
  await expect(a.getByRole('heading', { name: 'Review evidence before re-standardization' })).toBeVisible();
  const parentId = await activeSessionId(a);

  const b = await context.newPage();
  await b.goto('/');
  await expect(b.getByRole('heading', { name: 'Review evidence before re-standardization' })).toBeVisible();

  await a.getByRole('button', { name: 'Create Re-standardization' }).click();
  await expect(a.getByRole('heading', { name: 'Standardization setup' })).toBeVisible();

  await b.getByRole('button', { name: 'Create Re-standardization' }).click();
  await expect(b.getByText(/STALE_REVISION/i)).toBeVisible();
  const children = await linkedChildren(b, parentId);
  expect(children).toHaveLength(1);
});
