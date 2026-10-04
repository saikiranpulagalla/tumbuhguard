import { DomainError } from '../errors';
import { assertMeasurementProvenance, assertMeasurementUnique, assertMeasurementValue, assertSetupIntegrity } from '../protocol/invariants';
import { assertObservationCanBeAdded, assertObservationEvidence } from '../evidence/required-observations';
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
  REFERENCE_LOCKED: ['MARK_READY', 'ADD_OBSERVATION'],
  READY_TO_CALCULATE: ['SET_RESULT'],
  RESULT_VALID: ['START_REMEDIATION', 'CLOSE_SESSION', 'INVALIDATE_RESULT'],
  REMEDIATION: ['ADD_REMEDIATION_NOTE', 'CLOSE_SESSION'],
  CLOSED: [],
};

function assertRoundComplete(session: Session, measurerId: string, round: 1 | 2): void {
  const activeIds = new Set(session.subjects.filter(subject => subject.status === 'ACTIVE').map(subject => subject.id));
  const rows = session.measurements.filter(m => m.measurerId === measurerId && m.round === round && activeIds.has(m.subjectId));
  if (rows.length !== activeIds.size) throw new DomainError('INCOMPLETE_ROUND');
}

function nextRevision(session: Session): Pick<Session, 'revision' | 'updatedAt'> {
  return { revision: session.revision + 1, updatedAt: new Date().toISOString() };
}

function advanceKeepingResultCurrent(session: Session): Pick<Session, 'revision' | 'updatedAt' | 'result'> {
  const next = nextRevision(session);
  return { ...next, result: session.result ? { ...session.result, inputRevision: next.revision } : null };
}

export function transition(session: Session, event: SessionEvent): Session {
  if (!allowed[session.state].includes(event.type)) throw new DomainError('INVALID_TRANSITION');
  switch (event.type) {
    case 'VALIDATE_SETUP':
      assertSetupIntegrity(session);
      return { ...session, state: 'SETUP_VALID', ...nextRevision(session) };
    case 'OPEN_ROUND_1': return { ...session, state: 'ROUND1_OPEN', ...nextRevision(session) };
    case 'LOCK_ROUND_1':
      assertRoundComplete(session, session.trainee.id, 1);
      return { ...session, state: 'ROUND1_LOCKED', ...nextRevision(session) };
    case 'OPEN_ROUND_2': return { ...session, state: 'ROUND2_OPEN', ...nextRevision(session) };
    case 'LOCK_ROUND_2':
      assertRoundComplete(session, session.trainee.id, 2);
      return { ...session, state: 'ROUND2_LOCKED', ...nextRevision(session) };
    case 'OPEN_REFERENCE': return { ...session, state: 'REFERENCE_OPEN', ...nextRevision(session) };
    case 'LOCK_REFERENCE':
      assertRoundComplete(session, session.reference.id, 1);
      assertRoundComplete(session, session.reference.id, 2);
      return { ...session, state: 'REFERENCE_LOCKED', ...nextRevision(session) };
    case 'MARK_READY':
      assertObservationEvidence(session, true);
      return { ...session, state: 'READY_TO_CALCULATE', ...nextRevision(session) };
    case 'RECORD_MEASUREMENT': {
      assertMeasurementValue(event.measurement.valueCm);
      assertMeasurementProvenance(session, event.measurement);
      assertMeasurementUnique(session.measurements, event.measurement);
      const isTrainee = event.measurement.measurerId === session.trainee.id;
      const isReference = event.measurement.measurerId === session.reference.id;
      if (!isTrainee && !isReference) throw new DomainError('UNKNOWN_MEASURER');
      if (session.state === 'ROUND1_OPEN' && (!isTrainee || event.measurement.round !== 1)) throw new DomainError('ROUND_MEASURER_MISMATCH');
      if (session.state === 'ROUND2_OPEN' && (!isTrainee || event.measurement.round !== 2)) throw new DomainError('ROUND_MEASURER_MISMATCH');
      if (session.state === 'REFERENCE_OPEN' && !isReference) throw new DomainError('ROUND_MEASURER_MISMATCH');
      const rev = session.revision + 1;
      return { ...session, measurements: [...session.measurements, { ...event.measurement, revision: rev }], result: null, revision: rev, updatedAt: new Date().toISOString() };
    }
    case 'SET_RESULT': {
      const next = nextRevision(session);
      if (event.result.inputRevision !== next.revision) throw new DomainError('RESULT_STALE');
      return { ...session, result: event.result, state: 'RESULT_VALID', ...next };
    }
    case 'ADD_OBSERVATION':
      assertObservationCanBeAdded(session, event.observation);
      return { ...session, observations: [...session.observations, event.observation], ...advanceKeepingResultCurrent(session) };
    case 'START_REMEDIATION': return { ...session, state: 'REMEDIATION', ...advanceKeepingResultCurrent(session) };
    case 'ADD_REMEDIATION_NOTE':
      if (!event.note.text.trim()) throw new DomainError('PROTOCOL_INVALID', 'Remediation note cannot be empty');
      return { ...session, remediationNotes: [...session.remediationNotes, event.note], ...advanceKeepingResultCurrent(session) };
    case 'CLOSE_SESSION': return { ...session, state: 'CLOSED', ...advanceKeepingResultCurrent(session) };
    case 'INVALIDATE_RESULT': return { ...session, result: null, state: 'READY_TO_CALCULATE', ...nextRevision(session) };
  }
}
