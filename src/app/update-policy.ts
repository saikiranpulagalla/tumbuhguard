import type { SessionState } from '../domain/session/state';

export function canApplyServiceWorkerUpdate(showHome: boolean, state: SessionState): boolean {
  return showHome || state === 'DRAFT' || state === 'CLOSED';
}
