import { DomainError } from '../domain/errors';
import { evaluateSessionResult } from '../domain/protocol/session-evaluation';
import { transition } from '../domain/session/transition';
import type { Measurement, Session } from '../domain/session/state';

export function buildEvaluation(session: Session) {
  return evaluateSessionResult({ ...session, revision: session.revision + 1 });
}

export function calculateSession(session: Session): Session {
  if (session.state !== 'READY_TO_CALCULATE') throw new DomainError('INVALID_TRANSITION', 'Calculation is only available after reference evidence is locked');
  return transition(session, { type: 'SET_RESULT', result: buildEvaluation(session) });
}

export function measurementsFor(session: Session, measurerId: string, round: 1 | 2): readonly Measurement[] {
  return session.measurements.filter(m => m.measurerId === measurerId && m.round === round);
}
