import { afterEach, expect, it } from 'vitest';
import { TumbuhGuardDB } from '../../src/data/db';
import { SchemaIncompatibleError, SessionRepository } from '../../src/data/repositories/session-repository';
import { createDemoSession } from '../../src/fixtures/demo';

const databases: TumbuhGuardDB[] = [];
afterEach(async () => { for (const database of databases) { database.close(); await database.delete(); } databases.length = 0; });

it('rejects an unknown application schema marker instead of silently migrating it', async () => {
  const database = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(database);
  const repository = new SessionRepository(database);
  await repository.create(createDemoSession());
  await database.meta.put({ key: 'dbSchemaVersion', value: '999' });
  await expect(repository.get('demo-standardization-001')).rejects.toBeInstanceOf(SchemaIncompatibleError);
});

it('rejects malformed stored data safely', async () => {
  const database = new TumbuhGuardDB(`test-${crypto.randomUUID()}`); databases.push(database);
  const repository = new SessionRepository(database);
  const session = createDemoSession();
  await repository.create(session);
  await database.sessions.update(session.id, { dataMode: 'REAL' as never });
  await expect(repository.get(session.id)).rejects.toMatchObject({ code: 'STORED_RECORD_INVALID' });
});
