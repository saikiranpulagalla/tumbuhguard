import type { Session } from '../../domain/session/state';
import { sha256Json } from '../transactions/hash';

export interface SessionBackup {
  readonly format: 'tumbuhguard-session-backup';
  readonly formatVersion: 1;
  readonly exportedAt: string;
  readonly session: Session;
  readonly sha256: string;
}

export async function createSessionBackup(session: Session): Promise<SessionBackup> {
  return {
    format: 'tumbuhguard-session-backup',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    session,
    sha256: await sha256Json(session),
  };
}

export async function verifySessionBackup(backup: SessionBackup): Promise<boolean> {
  if (backup.format !== 'tumbuhguard-session-backup' || backup.formatVersion !== 1) return false;
  return (await sha256Json(backup.session)) === backup.sha256;
}
