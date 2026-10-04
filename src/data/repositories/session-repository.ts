import type { TumbuhGuardDB } from '../db';
import { DomainError } from '../../domain/errors';
import type { Session } from '../../domain/session/state';
import type { SessionRecord } from '../schema';
import { DB_SCHEMA_META_KEY, DB_SCHEMA_VERSION } from '../schema';
import { classifySchemaCompatibility } from '../schema-policy';
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

  private async assertKnownPhysicalStores(): Promise<void> {
    const stores = await new Promise<readonly string[]>((resolve, reject) => {
      const request = indexedDB.open(this.database.name);
      request.onsuccess = () => {
        const names = Array.from(request.result.objectStoreNames);
        request.result.close();
        resolve(names);
      };
      request.onerror = () => reject(request.error);
    });
    const known = new Set(['sessions', 'audit', 'meta']);
    if (stores.some(store => !known.has(store))) throw new SchemaIncompatibleError('INDEXEDDB_NEWER');
  }

  private async assertProtocolSnapshotHash(session: Session): Promise<void> {
    if ((await sha256Json(session.protocolSnapshot)) !== session.protocolHash) {
      throw new DomainError('STORED_RECORD_INVALID', 'Protocol snapshot hash does not match the stored protocol snapshot');
    }
  }

  private async assertSchemaCompatibility(): Promise<void> {
    try {
      await this.assertKnownPhysicalStores();
      const meta = await this.database.meta.get(DB_SCHEMA_META_KEY);
      if (meta) {
        const decision = classifySchemaCompatibility(meta.value, DB_SCHEMA_VERSION, true);
        if (decision.kind === 'INCOMPATIBLE') throw new SchemaIncompatibleError(decision.storedVersion);
        return;
      }

      // Only a truly empty database may bootstrap the v1 marker. Existing
      // records without a marker could belong to an unknown/older schema and
      // must never be silently blessed as current.
      const [sessionCount, auditCount] = await Promise.all([
        this.database.sessions.count(),
        this.database.audit.count(),
      ]);
      const decision = classifySchemaCompatibility(undefined, DB_SCHEMA_VERSION, sessionCount > 0 || auditCount > 0);
      if (decision.kind === 'INCOMPATIBLE') throw new SchemaIncompatibleError(decision.storedVersion);
      await this.database.meta.put({ key: DB_SCHEMA_META_KEY, value: String(DB_SCHEMA_VERSION) });
    } catch (error) {
      if (error instanceof SchemaIncompatibleError) throw error;
      if (error instanceof Error && error.name === 'VersionError') throw new SchemaIncompatibleError('INDEXEDDB_NEWER');
      throw error;
    }
  }

  private async validatedRecord(id: string): Promise<SessionRecord | undefined> {
    await this.assertSchemaCompatibility();
    const raw = await this.database.sessions.get(id);
    if (!raw) return undefined;
    const record = parseStoredSessionRecord(raw);
    const { integrityHash, ...session } = record;
    if ((await sha256Json(session)) !== integrityHash) throw new DomainError('STORED_RECORD_INVALID', 'Saved local session failed integrity verification');
    await this.assertProtocolSnapshotHash(session);
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
    await this.assertProtocolSnapshotHash(session);
    const integrityHash = await sha256Json(session);
    await this.database.sessions.add({ ...session, integrityHash });
  }

  async createLinkedCAS(child: Session, parentId: string, expectedParentRevision: number, eventType = 'CREATE_RESTANDARDIZATION'): Promise<void> {
    if (child.parentSessionId !== parentId) throw new DomainError('PROTOCOL_INVALID', 'Linked session parent ID mismatch');
    assertSessionShape(child);
    await this.assertProtocolSnapshotHash(child);
    const verifiedParent = await this.validatedRecord(parentId);
    if (!verifiedParent) throw new DomainError('SESSION_NOT_FOUND');
    const { integrityHash: _, ...parent } = verifiedParent;
    const auditId = crypto.randomUUID();
    const auditAt = new Date().toISOString();
    // The child is the active continuation after this transaction. Make its
    // recency explicit so recovery resumes it instead of the revised parent.
    const nextChild: Session = {
      ...child,
      updatedAt: new Date(Date.parse(auditAt) + 1).toISOString(),
    };
    const childIntegrityHash = await sha256Json(nextChild);
    const nextParent: Session = {
      ...parent,
      // A remediation assessment has one direct continuation.  Closing the
      // parent in the same transaction makes it historical and prevents a
      // later current-revision sibling from being created.
      state: 'CLOSED',
      revision: parent.revision + 1,
      updatedAt: auditAt,
      result: parent.result ? { ...parent.result, inputRevision: parent.revision + 1 } : null,
    };
    const parentIntegrityHash = await sha256Json(nextParent);
    await this.database.transaction('rw', this.database.sessions, this.database.audit, async () => {
      const parentRaw = await this.database.sessions.get(parentId);
      if (!parentRaw) throw new DomainError('SESSION_NOT_FOUND');
      const parent = parseStoredSessionRecord(parentRaw);
      if (parent.revision !== expectedParentRevision) throw new StaleRevisionError(expectedParentRevision, parent.revision);
      if (parent.state !== 'REMEDIATION') throw new DomainError('INVALID_TRANSITION', 'Parent session is no longer in remediation');
      if (await this.database.sessions.where('parentSessionId').equals(parentId).count()) {
        throw new DomainError('INVALID_TRANSITION', 'Parent session already has a re-standardization continuation');
      }
      await this.database.sessions.add({ ...nextChild, integrityHash: childIntegrityHash });
      await this.database.sessions.put({ ...nextParent, integrityHash: parentIntegrityHash });
      await this.database.audit.add({
        id: auditId,
        sessionId: parentId,
        revision: nextParent.revision,
        eventType,
        at: auditAt,
        payloadHash: parentIntegrityHash,
      });
    });
  }

  async saveCAS(session: Session, expectedRevision: number, eventType: string): Promise<Session> {
    assertSessionShape(session);
    await this.assertProtocolSnapshotHash(session);
    // Verify the currently persisted record before preparing an overwrite.
    // Hashing intentionally stays outside the Dexie transaction because Web
    // Crypto promises can allow an IndexedDB transaction to auto-close.
    const verifiedCurrent = await this.validatedRecord(session.id);
    if (!verifiedCurrent) throw new DomainError('SESSION_NOT_FOUND');
    const integrityHash = await sha256Json(session);
    const auditId = crypto.randomUUID();
    const auditAt = new Date().toISOString();
    return this.database.transaction('rw', this.database.sessions, this.database.audit, async () => {
      const currentRaw = await this.database.sessions.get(session.id);
      if (!currentRaw) throw new DomainError('SESSION_NOT_FOUND');
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
    const records = await this.database.sessions.toArray();
    const sessions: Session[] = [];
    for (const raw of records) {
      const record = parseStoredSessionRecord(raw);
      const { integrityHash, ...session } = record;
      if ((await sha256Json(session)) !== integrityHash) throw new DomainError('STORED_RECORD_INVALID', `Integrity failure for session ${record.id}`);
      await this.assertProtocolSnapshotHash(session);
      sessions.push(session);
    }
    return sessions.sort((a,b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }
}
