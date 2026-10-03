import { afterEach, expect, it } from 'vitest';
import Dexie from 'dexie';
import { TumbuhGuardDB } from '../../src/data/db';
import { SchemaIncompatibleError, SessionRepository } from '../../src/data/repositories/session-repository';
import { sha256Json } from '../../src/data/transactions/hash';
import { createDemoSession, evaluateDemoFixture, fixtureMeasurements } from '../../src/fixtures/demo';

const databases: TumbuhGuardDB[] = [];
afterEach(async () => { for (const database of databases) { database.close(); await database.delete(); } databases.length = 0; });

it('rejects an unknown application schema marker instead of silently migrating it', async () => {
  const database = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(database);
  const repository = new SessionRepository(database);
  await repository.create(createDemoSession());
  await database.meta.put({ key: 'dbSchemaVersion', value: '999' });
  await expect(repository.get('demo-standardization-001')).rejects.toBeInstanceOf(SchemaIncompatibleError);
});

it('maps a newer physical IndexedDB version to a safe schema incompatibility failure', async () => {
  const name=`test-${crypto.randomUUID()}`;
  class FutureDB extends Dexie {
    constructor() {
      super(name);
      this.version(2).stores({ future: 'id' });
    }
  }
  const future = new FutureDB();
  await future.open();
  future.close();
  const database = new TumbuhGuardDB(name); databases.push(database);
  const repository = new SessionRepository(database);
  await expect(repository.list()).rejects.toMatchObject({ code:'SCHEMA_INCOMPATIBLE', storedVersion:'INDEXEDDB_NEWER' });
});

it('rejects existing records when the application schema marker is missing', async () => {
  const database = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(database);
  const session = createDemoSession();
  await database.sessions.add({ ...session, integrityHash: await sha256Json(session) });
  const repository = new SessionRepository(database);
  await expect(repository.get(session.id)).rejects.toMatchObject({ code: 'SCHEMA_INCOMPATIBLE', storedVersion: 'MISSING' });
});

it('bootstraps the schema marker only for an empty local database', async () => {
  const database = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(database);
  const repository = new SessionRepository(database);
  const session = createDemoSession();
  await repository.create(session);
  await expect(database.meta.get('dbSchemaVersion')).resolves.toMatchObject({ value: '1' });
});

it('rejects malformed stored data safely', async () => {
  const database = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(database);
  const repository = new SessionRepository(database);
  const session = createDemoSession();
  await repository.create(session);
  await database.sessions.update(session.id, { dataMode: 'REAL' as never });
  await expect(repository.get(session.id)).rejects.toMatchObject({ code: 'STORED_RECORD_INVALID' });
});

it('rejects a stored locked state whose required active measurements are incomplete', async () => {
  const database = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(database);
  const repository = new SessionRepository(database);
  const original = createDemoSession();
  await repository.create(original);
  const malformed = { ...original, state: 'ROUND1_LOCKED' as const, revision: 1 };
  await database.sessions.put({ ...malformed, integrityHash: await sha256Json(malformed) });
  await expect(repository.get(original.id)).rejects.toMatchObject({ code: 'STORED_RECORD_INVALID' });
});

it('rejects contradictory stored reference-validity result fields', async () => {
  const database = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(database);
  const repository = new SessionRepository(database);
  const base = createDemoSession('cadre-c-systematic-low');
  await repository.create(base);
  const measurements = fixtureMeasurements(base,'cadre-c-systematic-low');
  const validResult = evaluateDemoFixture('cadre-c-systematic-low');
  const malformed = {
    ...base,
    state: 'RESULT_VALID' as const,
    revision: measurements.length + 1,
    measurements,
    result: { ...validResult, referenceValid: false, inputRevision: measurements.length + 1 },
  };
  await database.sessions.put({ ...malformed, integrityHash: await sha256Json(malformed) });
  await expect(repository.get(base.id)).rejects.toMatchObject({ code: 'STORED_RECORD_INVALID' });
});
