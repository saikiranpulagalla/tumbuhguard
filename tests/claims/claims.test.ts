import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

it('keeps prohibited official-certification claims out of runtime UI', async () => {
  const files=['src/App.tsx','src/app/AppShell.tsx','src/features/results/ResultsPanel.tsx'];
  const body=(await Promise.all(files.map(f=>readFile(f,'utf8')))).join('\n').toLowerCase();
  for(const claim of ['who-certified cadre','kemenkes-certified system','official kemenkes certification workflow']) expect(body).not.toContain(claim);
});
