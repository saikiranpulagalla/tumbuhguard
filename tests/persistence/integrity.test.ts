import { afterEach, expect, it } from 'vitest';
import { TumbuhGuardDB } from '../../src/data/db';
import { SessionRepository } from '../../src/data/repositories/session-repository';
import { sha256Json } from '../../src/data/transactions/hash';
import { transition } from '../../src/domain/session/transition';
import { createDemoSession } from '../../src/fixtures/demo';

it('detects application-level record corruption', async () => {
  const db = new TumbuhGuardDB(`test-${crypto.randomUUID()}`);
  const repo = new SessionRepository(db);
  await repo.create(createDemoSession());
  expect(await repo.verifyIntegrity('demo-standardization-001')).toBe(true);
  await db.sessions.update('demo-standardization-001', { protocolVersion: 'corrupted' });
  expect(await repo.verifyIntegrity('demo-standardization-001')).toBe(false);
  db.close(); await db.delete();
});

it('refuses to overwrite a corrupted current record through CAS', async () => {
  const db = new TumbuhGuardDB(`test-${crypto.randomUUID()}`);
  const repo = new SessionRepository(db);
  const original = createDemoSession();
  await repo.create(original);
  await db.sessions.update(original.id, { protocolVersion: 'corrupted-without-hash-update' });
  const next = transition(original, { type: 'VALIDATE_SETUP' });
  await expect(repo.saveCAS(next, original.revision, 'VALIDATE_SETUP')).rejects.toMatchObject({ code: 'STORED_RECORD_INVALID' });
  db.close(); await db.delete();
});

it('rejects a session whose protocol snapshot content and protocol hash disagree', async () => {
  const db = new TumbuhGuardDB(`test-${crypto.randomUUID()}`);
  const repo = new SessionRepository(db);
  const original = createDemoSession();
  await repo.create(original);
  const mutated = { ...original, protocolSnapshot: { ...original.protocolSnapshot, precisionThreshold: 0.1 } };
  await db.sessions.put({ ...mutated, integrityHash: await sha256Json(mutated) });
  await expect(repo.get(original.id)).rejects.toMatchObject({ code: 'STORED_RECORD_INVALID' });
  db.close(); await db.delete();
});
