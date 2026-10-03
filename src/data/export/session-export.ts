import type { Session } from '../../domain/session/state';
import { sha256Json } from '../transactions/hash';

export interface SessionBackup {
  readonly format: 'tumbuhguard-session-backup';
  readonly formatVersion: 1;
  readonly dataMode: 'SYNTHETIC';
  readonly synthetic: true;
  readonly exportedAt: string;
  readonly session: Session;
  readonly sha256: string;
}

export async function createSessionBackup(session: Session): Promise<SessionBackup> {
  return {
    format: 'tumbuhguard-session-backup',
    formatVersion: 1,
    dataMode: 'SYNTHETIC',
    synthetic: true,
    exportedAt: new Date().toISOString(),
    session,
    sha256: await sha256Json(session),
  };
}

export async function verifySessionBackup(backup: SessionBackup): Promise<boolean> {
  if (backup.format !== 'tumbuhguard-session-backup' || backup.formatVersion !== 1 || backup.dataMode !== 'SYNTHETIC' || backup.synthetic !== true) return false;
  return (await sha256Json(backup.session)) === backup.sha256;
}
