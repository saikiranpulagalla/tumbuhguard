import type { Session } from '../domain/session/state';

export interface SessionRecord extends Session {
  readonly integrityHash: string;
}

export interface AuditRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly revision: number;
  readonly eventType: string;
  readonly at: string;
  readonly payloadHash: string;
}

export interface MetaRecord {
  readonly key: string;
  readonly value: string;
}

export const DB_SCHEMA_VERSION = 1;
