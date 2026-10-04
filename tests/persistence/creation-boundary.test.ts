import { afterEach, describe, expect, it } from 'vitest';
import { TumbuhGuardDB } from '../../src/data/db';
import { SessionRepository } from '../../src/data/repositories/session-repository';
import { sha256Json } from '../../src/data/transactions/hash';
import { createRestandardizationSession } from '../../src/domain/session/restandardization';
import { REQUIRED_OBSERVATION_ITEMS } from '../../src/domain/evidence/required-observations';
import { createDemoSession, DEMO_SESSION_ID, evaluateDemoFixture, fixtureMeasurements } from '../../src/fixtures/demo';

const databases: TumbuhGuardDB[] = [];
afterEach(async () => {
  for (const database of databases) { database.close(); await database.delete(); }
  databases.length = 0;
});

function newRepository() {
  const database = new TumbuhGuardDB(`test-${crypto.randomUUID()}`);
  databases.push(database);
  return { database, repository: new SessionRepository(database) };
}

function remediationParent() {
  const base = createDemoSession('cadre-c-systematic-low', 'parent-session');
  const measurements = fixtureMeasurements(base, 'cadre-c-systematic-low');
  const revision = measurements.length + 2;
  return {
    ...base,
    state: 'REMEDIATION' as const,
    revision,
    measurements,
    observations: REQUIRED_OBSERVATION_ITEMS.map((item, index) => ({ id: `observation-${index}`, measurerId: base.trainee.id, item, result: 'OBSERVED_OK' as const })),
    result: { ...evaluateDemoFixture('cadre-c-systematic-low'), inputRevision: revision },
  };
}

describe('narrow session-creation boundaries', () => {
  it('allows exactly one non-template active root, even under concurrent creation', async () => {
    const { repository } = newRepository();
    await repository.ensureHomeTemplate(createDemoSession());
    const first = createDemoSession('cadre-a-good', 'root-a');
    const second = createDemoSession('cadre-b-cancellation', 'root-b');
    const outcomes = await Promise.allSettled([repository.createRoot(first), repository.createRoot(second)]);
    expect(outcomes.filter(outcome => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter(outcome => outcome.status === 'rejected')).toHaveLength(1);
    const sessions = await repository.list();
    expect(sessions.filter(session => session.id !== DEMO_SESSION_ID && session.state !== 'CLOSED')).toHaveLength(1);
  });

  it('rejects ordinary creation of template, linked, or advanced records', async () => {
    const { repository } = newRepository();
    await repository.ensureHomeTemplate(createDemoSession());
    await expect(repository.createRoot(createDemoSession())).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    await expect(repository.createRoot({ ...createDemoSession('cadre-a-good', 'linked-root'), parentSessionId: 'parent' })).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    await expect(repository.createRoot({ ...createDemoSession('cadre-a-good', 'advanced-root'), state: 'ROUND2_OPEN', revision: 1 })).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('accepts linked children only through a clean child contract and closes the parent', async () => {
    const { database, repository } = newRepository();
    await repository.ensureHomeTemplate(createDemoSession());
    const parent = remediationParent();
    await database.sessions.add({ ...parent, integrityHash: await sha256Json(parent) });
    const cleanChild = createRestandardizationSession(parent, 'child-clean', '2026-10-03T01:00:00.000Z');
    await expect(repository.createLinkedCAS({ ...cleanChild, revision: 1 }, parent.id, parent.revision)).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    await expect(repository.createLinkedCAS({ ...cleanChild, measurements: [fixtureMeasurements(parent, 'cadre-c-systematic-low')[0]!] }, parent.id, parent.revision)).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    await repository.createLinkedCAS(cleanChild, parent.id, parent.revision);
    await expect(repository.get(parent.id)).resolves.toMatchObject({ state: 'CLOSED' });
    await expect(repository.get(cleanChild.id)).resolves.toMatchObject({ state: 'DRAFT', revision: 0, measurements: [], observations: [], remediationNotes: [], result: null });
  });

  it('rejects hash-recomputed unknown top-level and nested record fields', async () => {
    const { database, repository } = newRepository();
    const session = createDemoSession();
    await repository.ensureHomeTemplate(session);
    const topLevel = { ...session, unexpectedTopLevel: true };
    await database.sessions.put({ ...topLevel, integrityHash: await sha256Json(topLevel) } as never);
    await expect(repository.get(session.id)).rejects.toMatchObject({ code: 'STORED_RECORD_INVALID' });

    const nested = { ...session, subjects: [{ ...session.subjects[0]!, unexpectedNested: true }, ...session.subjects.slice(1)] };
    await database.sessions.put({ ...nested, integrityHash: await sha256Json(nested) } as never);
    await expect(repository.get(session.id)).rejects.toMatchObject({ code: 'STORED_RECORD_INVALID' });
  });
});
