import { assertMeasurementUnique, assertMeasurementValue, assertSetupIntegrity, DomainInvariantError } from '../protocol/invariants';
import type { SessionEvent } from './events';
import type { Session, SessionState } from './state';

const allowed: Readonly<Record<SessionState, readonly SessionEvent['type'][]>> = {
  DRAFT: ['VALIDATE_SETUP'],
  SETUP_VALID: ['OPEN_ROUND_1'],
  ROUND1_OPEN: ['RECORD_MEASUREMENT', 'LOCK_ROUND_1'],
  ROUND1_LOCKED: ['OPEN_ROUND_2'],
  ROUND2_OPEN: ['RECORD_MEASUREMENT', 'LOCK_ROUND_2'],
  ROUND2_LOCKED: ['OPEN_REFERENCE'],
  REFERENCE_OPEN: ['RECORD_MEASUREMENT', 'LOCK_REFERENCE'],
  REFERENCE_LOCKED: ['MARK_READY'],
  READY_TO_CALCULATE: ['SET_RESULT'],
  RESULT_VALID: ['ADD_OBSERVATION', 'START_REMEDIATION', 'CLOSE_SESSION', 'INVALIDATE_RESULT'],
  REMEDIATION: ['ADD_OBSERVATION', 'CLOSE_SESSION'],
  CLOSED: [],
};

function nextRevision(session: Session): Pick<Session, 'revision' | 'updatedAt'> {
  return { revision: session.revision + 1, updatedAt: new Date().toISOString() };
}

export function transition(session: Session, event: SessionEvent): Session {
  if (!allowed[session.state].includes(event.type)) throw new DomainInvariantError('INVALID_STATE_TRANSITION');
  switch (event.type) {
    case 'VALIDATE_SETUP':
      assertSetupIntegrity(session);
      return { ...session, state: 'SETUP_VALID', ...nextRevision(session) };
    case 'OPEN_ROUND_1': return { ...session, state: 'ROUND1_OPEN', ...nextRevision(session) };
    case 'LOCK_ROUND_1': return { ...session, state: 'ROUND1_LOCKED', ...nextRevision(session) };
    case 'OPEN_ROUND_2': return { ...session, state: 'ROUND2_OPEN', ...nextRevision(session) };
    case 'LOCK_ROUND_2': return { ...session, state: 'ROUND2_LOCKED', ...nextRevision(session) };
    case 'OPEN_REFERENCE': return { ...session, state: 'REFERENCE_OPEN', ...nextRevision(session) };
    case 'LOCK_REFERENCE': return { ...session, state: 'REFERENCE_LOCKED', ...nextRevision(session) };
    case 'MARK_READY': return { ...session, state: 'READY_TO_CALCULATE', ...nextRevision(session) };
    case 'RECORD_MEASUREMENT': {
      assertMeasurementValue(event.measurement.valueCm);
      assertMeasurementUnique(session.measurements, event.measurement);
      const isTrainee = event.measurement.measurerId === session.trainee.id;
      const isReference = event.measurement.measurerId === session.reference.id;
      if (!isTrainee && !isReference) throw new DomainInvariantError('UNKNOWN_MEASURER');
      if (session.state === 'ROUND1_OPEN' && (!isTrainee || event.measurement.round !== 1)) throw new DomainInvariantError('ROUND_MEASURER_MISMATCH');
      if (session.state === 'ROUND2_OPEN' && (!isTrainee || event.measurement.round !== 2)) throw new DomainInvariantError('ROUND_MEASURER_MISMATCH');
      if (session.state === 'REFERENCE_OPEN' && !isReference) throw new DomainInvariantError('ROUND_MEASURER_MISMATCH');
      const rev = session.revision + 1;
      return { ...session, measurements: [...session.measurements, { ...event.measurement, revision: rev }], result: null, revision: rev, updatedAt: new Date().toISOString() };
    }
    case 'SET_RESULT':
      if (event.result.inputRevision !== session.revision) throw new DomainInvariantError('RESULT_STALE');
      return { ...session, result: event.result, state: 'RESULT_VALID', ...nextRevision(session), revision: session.revision };
    case 'ADD_OBSERVATION':
      return { ...session, observations: [...session.observations, event.observation], ...nextRevision(session) };
    case 'START_REMEDIATION': return { ...session, state: 'REMEDIATION', ...nextRevision(session) };
    case 'CLOSE_SESSION': return { ...session, state: 'CLOSED', ...nextRevision(session) };
    case 'INVALIDATE_RESULT': return { ...session, result: null, state: 'READY_TO_CALCULATE', ...nextRevision(session) };
  }
}
