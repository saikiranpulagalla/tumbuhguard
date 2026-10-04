import { afterEach, describe, expect, it } from 'vitest';
import { TumbuhGuardDB } from '../../src/data/db';
import { SessionRepository, StaleRevisionError } from '../../src/data/repositories/session-repository';
import { createRestandardizationSession } from '../../src/domain/session/restandardization';
import { REQUIRED_OBSERVATION_ITEMS } from '../../src/domain/evidence/required-observations';
import { createDemoSession, evaluateDemoFixture, fixtureMeasurements } from '../../src/fixtures/demo';

function remediationParent() {
  const base=createDemoSession('cadre-c-systematic-low','parent-session');
  const measurements=fixtureMeasurements(base,'cadre-c-systematic-low');
  const revision=measurements.length+2;
  return {
    ...base,
    state:'REMEDIATION' as const,
    revision,
    measurements,
    observations: REQUIRED_OBSERVATION_ITEMS.map((item, index) => ({ id: `observation-${index}`, measurerId: base.trainee.id, item, result: 'OBSERVED_OK' as const })),
    result:{...evaluateDemoFixture('cadre-c-systematic-low'),inputRevision:revision},
  };
}

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

  it('creates re-standardization only when the parent remediation revision is current', async () => {
    const db = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(db);
    const repo = new SessionRepository(db);
    const parent=remediationParent();
    await repo.create(parent);

    const child=createRestandardizationSession(parent,'child-current','2026-10-03T01:00:00Z');
    await repo.createLinkedCAS(child,parent.id,parent.revision);
    await expect(repo.get(child.id)).resolves.toMatchObject({parentSessionId:parent.id,state:'DRAFT'});
    const persistedChild = await repo.get(child.id);
    const persistedParent = await repo.get(parent.id);
    expect(persistedParent).toMatchObject({ state: 'CLOSED' });
    expect(persistedChild?.updatedAt > (persistedParent?.updatedAt ?? '')).toBe(true);
    await expect(repo.createLinkedCAS(createRestandardizationSession(parent,'child-race','2026-10-03T01:00:01Z'),parent.id,parent.revision)).rejects.toBeInstanceOf(StaleRevisionError);
    await expect(repo.get('child-race')).resolves.toBeUndefined();

    const current=await repo.get(parent.id);
    if (!current) throw new Error('parent should exist');
    const sibling={ ...child, id: 'child-sibling', updatedAt: '2026-10-03T01:01:00Z' };
    await expect(repo.createLinkedCAS(sibling,current.id,current.revision)).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    const staleChild=createRestandardizationSession(parent,'child-stale','2026-10-03T01:02:00Z');
    await expect(repo.createLinkedCAS(staleChild,parent.id,parent.revision)).rejects.toBeInstanceOf(StaleRevisionError);
    await expect(repo.get(staleChild.id)).resolves.toBeUndefined();
  });
});
