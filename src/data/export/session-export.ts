import type { Session } from '../../domain/session/state';
import { sha256Json } from '../transactions/hash';

export interface SessionBackup {
  readonly format: 'tumbuhguard-session-backup';
  readonly formatVersion: 2;
  readonly dataMode: 'SYNTHETIC';
  readonly synthetic: true;
  readonly exportedAt: string;
  readonly session: Session;
  readonly sha256: string;
}

export async function createSessionBackup(session: Session): Promise<SessionBackup> {
  const payload = {
    format: 'tumbuhguard-session-backup',
    formatVersion: 2,
    dataMode: 'SYNTHETIC',
    synthetic: true,
    exportedAt: new Date().toISOString(),
    session,
  } as const;
  return { ...payload, sha256: await sha256Json(payload) };
}

export async function verifySessionBackup(backup: SessionBackup): Promise<boolean> {
  if (backup.format !== 'tumbuhguard-session-backup' || backup.formatVersion !== 2 || backup.dataMode !== 'SYNTHETIC' || backup.synthetic !== true) return false;
  const { sha256, ...payload } = backup;
  return (await sha256Json(payload)) === sha256;
}
