import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSessionBackup } from '../../src/data/export/session-export';
import { createDemoSession } from '../../src/fixtures/demo';

async function collect(root:string):Promise<string[]> {
  const out:string[]=[];
  for(const entry of await readdir(root,{withFileTypes:true})) {
    const path=join(root,entry.name);
    if(entry.isDirectory()) out.push(...await collect(path));
    else if(/\.(ts|tsx)$/.test(entry.name)) out.push(path);
  }
  return out;
}

async function runtimeSource() {
  const files=await collect('src');
  return (await Promise.all(files.map(file=>readFile(file,'utf8')))).join('\n');
}

describe('Tier A privacy and claims', () => {
  it('S01-S03 runtime does not require NIK, real child names, or photos', async () => {
    const body=(await runtimeSource()).toLowerCase();
    expect(body).not.toMatch(/\bnik\b/);
    expect(body).not.toContain('child photo');
    expect(body).not.toContain('real child name');
  });

  it('S04 exports explicitly indicate synthetic data', async () => {
    const backup=await createSessionBackup(createDemoSession());
    expect(backup.dataMode).toBe('SYNTHETIC');
    expect(backup.synthetic).toBe(true);
    expect(backup.session.dataMode).toBe('SYNTHETIC');
  });

  it('S05-S06 runtime contains no positive official-certification claims', async () => {
    const body=(await runtimeSource()).toLowerCase();
    expect(body).not.toContain('kemenkes certified');
    expect(body).not.toContain('who certified cadre');
    expect(body).not.toContain('is an official kemenkes certification');
  });

  it('S07 runtime makes no unsupported causal blame statement', async () => {
    const body=(await runtimeSource()).toLowerCase();
    expect(body).not.toContain('the cadre used the equipment incorrectly');
    expect(body).not.toContain('the trainee was careless');
  });

  it('S08 core runtime contains no healthcare/cloud/API network call', async () => {
    const body=await runtimeSource();
    expect(body).not.toMatch(/\bfetch\s*\(/);
    expect(body).not.toMatch(/\bXMLHttpRequest\b/);
    expect(body).not.toMatch(/\bWebSocket\s*\(/);
    expect(body).not.toMatch(/\baxios\b/);
  });
});
