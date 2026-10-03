import type { TumbuhGuardDB } from '../db';
import { DomainError } from '../../domain/errors';
import type { Session } from '../../domain/session/state';
import type { SessionRecord } from '../schema';
import { DB_SCHEMA_META_KEY, DB_SCHEMA_VERSION } from '../schema';
import { sha256Json } from '../transactions/hash';
import { assertSessionShape, parseStoredSessionRecord } from '../validation';

export class StaleRevisionError extends DomainError {
  constructor(public readonly expected: number, public readonly actual: number) {
    super('STALE_REVISION', `STALE_REVISION expected=${expected} actual=${actual}`);
    this.name = 'StaleRevisionError';
  }
}

export class SchemaIncompatibleError extends DomainError {
  constructor(public readonly storedVersion: string) {
    super('SCHEMA_INCOMPATIBLE', `Unsupported local schema version: ${storedVersion}`);
    this.name = 'SchemaIncompatibleError';
  }
}

export class SessionRepository {
  constructor(private readonly database: TumbuhGuardDB) {}

  private async assertSchemaCompatibility(): Promise<void> {
    const meta = await this.database.meta.get(DB_SCHEMA_META_KEY);
    if (!meta) {
      // A missing marker is the known v1 bootstrap shape used by this project.
      await this.database.meta.put({ key: DB_SCHEMA_META_KEY, value: String(DB_SCHEMA_VERSION) });
      return;
    }
    if (meta.value !== String(DB_SCHEMA_VERSION)) throw new SchemaIncompatibleError(meta.value);
  }

  private async validatedRecord(id: string): Promise<SessionRecord | undefined> {
    await this.assertSchemaCompatibility();
    const raw = await this.database.sessions.get(id);
    if (!raw) return undefined;
    const record = parseStoredSessionRecord(raw);
    const { integrityHash, ...session } = record;
    if ((await sha256Json(session)) !== integrityHash) throw new DomainError('STORED_RECORD_INVALID', 'Saved local session failed integrity verification');
    return record;
  }

  async get(id: string): Promise<Session | undefined> {
    const record = await this.validatedRecord(id);
    if (!record) return undefined;
    const { integrityHash: _, ...session } = record;
    return session;
  }

  async create(session: Session): Promise<void> {
    await this.assertSchemaCompatibility();
    assertSessionShape(session);
    const integrityHash = await sha256Json(session);
    await this.database.sessions.add({ ...session, integrityHash });
  }

  async saveCAS(session: Session, expectedRevision: number, eventType: string): Promise<Session> {
    await this.assertSchemaCompatibility();
    assertSessionShape(session);
    const integrityHash = await sha256Json(session);
    const auditId = crypto.randomUUID();
    const auditAt = new Date().toISOString();
    return this.database.transaction('rw', this.database.sessions, this.database.audit, async () => {
      const currentRaw = await this.database.sessions.get(session.id);
      if (!currentRaw) throw new Error('SESSION_NOT_FOUND');
      const current = parseStoredSessionRecord(currentRaw);
      if (current.revision !== expectedRevision) throw new StaleRevisionError(expectedRevision, current.revision);
      if (session.revision <= current.revision) throw new DomainError('REVISION_MUST_ADVANCE');
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
    try {
      await this.validatedRecord(id);
      return true;
    } catch {
      return false;
    }
  }

  async list(): Promise<readonly Session[]> {
    await this.assertSchemaCompatibility();
    const records = await this.database.sessions.orderBy('updatedAt').reverse().toArray();
    const sessions: Session[] = [];
    for (const raw of records) {
      const record = parseStoredSessionRecord(raw);
      const { integrityHash, ...session } = record;
      if ((await sha256Json(session)) !== integrityHash) throw new DomainError('STORED_RECORD_INVALID', `Integrity failure for session ${record.id}`);
      sessions.push(session);
    }
    return sessions;
  }
}
