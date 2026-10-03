import { afterEach, describe, expect, it } from 'vitest';
import { TumbuhGuardDB } from '../../src/data/db';
import { SessionRepository, StaleRevisionError } from '../../src/data/repositories/session-repository';
import { createDemoSession } from '../../src/fixtures/demo';

describe('revision CAS', () => {
  const databases: TumbuhGuardDB[] = [];
  afterEach(async () => { for (const db of databases) { db.close(); await db.delete(); } databases.length = 0; });

  it('rejects a stale second writer', async () => {
    const db = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(db);
    const repo = new SessionRepository(db);
    const original = createDemoSession();
    await repo.create(original);
    const a = { ...original, state: 'SETUP_VALID' as const, revision: 1 };
    await repo.saveCAS(a, 0, 'TAB_A');
    const b = { ...original, state: 'SETUP_VALID' as const, revision: 1 };
    await expect(repo.saveCAS(b, 0, 'TAB_B')).rejects.toBeInstanceOf(StaleRevisionError);
  });
});
