import { afterEach, expect, it } from 'vitest';
import { TumbuhGuardDB } from '../../src/data/db';
import { SessionRepository } from '../../src/data/repositories/session-repository';
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
