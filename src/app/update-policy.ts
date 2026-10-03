import type { SessionState } from '../domain/session/state';

export function canApplyServiceWorkerUpdate(showHome: boolean, state: SessionState): boolean {
  // Home visibility is presentation state, not protocol state. A waiting
  // service worker must never be allowed to force a reload merely because an
  // active assessment is temporarily rendered behind/alongside home UI.
  void showHome;
  return state === 'DRAFT' || state === 'CLOSED';
}
