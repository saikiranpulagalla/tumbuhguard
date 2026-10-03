import type { TumbuhGuardDB } from '../db';
import type { Session } from '../../domain/session/state';
import type { SessionRecord } from '../schema';
import { sha256Json } from '../transactions/hash';

export class StaleRevisionError extends Error {
  readonly code = 'STALE_REVISION';
  constructor(public readonly expected: number, public readonly actual: number) {
    super(`STALE_REVISION expected=${expected} actual=${actual}`);
  }
}

export class UnsupportedSchemaError extends Error {
  readonly code = 'UNSUPPORTED_DB_SCHEMA';
}

export class SessionRepository {
  constructor(private readonly database: TumbuhGuardDB) {}

  async get(id: string): Promise<Session | undefined> {
    const record = await this.database.sessions.get(id);
    if (!record) return undefined;
    const { integrityHash: _, ...session } = record;
    return session;
  }

  async create(session: Session): Promise<void> {
    const integrityHash = await sha256Json(session);
    await this.database.sessions.add({ ...session, integrityHash });
  }

  async saveCAS(session: Session, expectedRevision: number, eventType: string): Promise<Session> {
    // Hash before opening the Dexie transaction. Web Crypto is an external async
    // operation and awaiting it inside an IndexedDB transaction can let that
    // transaction auto-close in some browsers.
    const integrityHash = await sha256Json(session);
    const auditId = crypto.randomUUID();
    const auditAt = new Date().toISOString();
    return this.database.transaction('rw', this.database.sessions, this.database.audit, async () => {
      const current = await this.database.sessions.get(session.id);
      if (!current) throw new Error('SESSION_NOT_FOUND');
      if (current.revision !== expectedRevision) throw new StaleRevisionError(expectedRevision, current.revision);
      if (session.revision <= current.revision) throw new Error('REVISION_MUST_ADVANCE');
      const next: SessionRecord = { ...session, integrityHash };
      await this.database.sessions.put(next);
      await this.database.audit.add({
        id: auditId, sessionId: session.id, revision: session.revision,
        eventType, at: auditAt, payloadHash: integrityHash,
      });
      return session;
    });
  }

  async verifyIntegrity(id: string): Promise<boolean> {
    const current = await this.database.sessions.get(id);
    if (!current) return false;
    const { integrityHash, ...session } = current;
    return (await sha256Json(session)) === integrityHash;
  }

  async list(): Promise<readonly Session[]> {
    const records = await this.database.sessions.orderBy('updatedAt').reverse().toArray();
    return records.map(({ integrityHash: _, ...session }) => session);
  }
}
