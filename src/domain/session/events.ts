import type { Measurement, Observation, SessionResult } from './state';

export type SessionEvent =
  | { type: 'VALIDATE_SETUP' }
  | { type: 'OPEN_ROUND_1' }
  | { type: 'RECORD_MEASUREMENT'; measurement: Measurement }
  | { type: 'LOCK_ROUND_1' }
  | { type: 'OPEN_ROUND_2' }
  | { type: 'LOCK_ROUND_2' }
  | { type: 'OPEN_REFERENCE' }
  | { type: 'LOCK_REFERENCE' }
  | { type: 'MARK_READY' }
  | { type: 'SET_RESULT'; result: SessionResult }
  | { type: 'ADD_OBSERVATION'; observation: Observation }
  | { type: 'START_REMEDIATION' }
  | { type: 'CLOSE_SESSION' }
  | { type: 'INVALIDATE_RESULT' };
