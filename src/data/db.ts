import Dexie, { type EntityTable } from 'dexie';
import type { AuditRecord, MetaRecord, SessionRecord } from './schema';

export class TumbuhGuardDB extends Dexie {
  sessions!: EntityTable<SessionRecord, 'id'>;
  audit!: EntityTable<AuditRecord, 'id'>;
  meta!: EntityTable<MetaRecord, 'key'>;

  constructor(name = 'tumbuhguard-standardize') {
    super(name);
    this.version(1).stores({
      sessions: 'id, state, updatedAt, revision, parentSessionId',
      audit: 'id, sessionId, revision, at',
      meta: 'key',
    });
  }
}

export const db = new TumbuhGuardDB();
