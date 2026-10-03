import { DomainError } from '../domain/errors';
import { evaluateStandardization } from '../domain/protocol/evaluator';
import { transition } from '../domain/session/transition';
import type { Measurement, Session } from '../domain/session/state';
import { activeSubjects } from '../domain/session/selectors';

export function buildEvaluation(session: Session) {
  const subjects = activeSubjects(session);
  const traineePairs = subjects.map(subject => {
    const rows = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.trainee.id);
    const first = rows.find(m => m.round === 1);
    const second = rows.find(m => m.round === 2);
    if (!first || !second) throw new DomainError('INCOMPLETE_ROUND', `Missing trainee measurement pair for ${subject.id}`);
    return { subjectId: subject.id, first: first.valueCm, second: second.valueCm };
  });
  const referencePairs = subjects.map(subject => {
    const rows = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.reference.id);
    const first = rows.find(m => m.round === 1);
    const second = rows.find(m => m.round === 2);
    if (!first || !second) throw new DomainError('INCOMPLETE_ROUND', `Missing reference measurement pair for ${subject.id}`);
    return { subjectId: subject.id, first: first.valueCm, second: second.valueCm };
  });
  const subjectMeans = subjects.map(subject => {
    const t = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.trainee.id);
    const r = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.reference.id);
    if (t.length !== 2 || r.length !== 2) throw new DomainError('INCOMPLETE_ROUND', `Missing agreement input for ${subject.id}`);
    return {
      subjectId: subject.id,
      traineeMean: (t[0]!.valueCm + t[1]!.valueCm) / 2,
      referenceMean: (r[0]!.valueCm + r[1]!.valueCm) / 2,
    };
  });
  return evaluateStandardization(session.protocolSnapshot, {
    traineePairs,
    referencePairs,
    subjectMeans,
    inputRevision: session.revision + 1,
  });
}

export function calculateSession(session: Session): Session {
  if (session.state !== 'READY_TO_CALCULATE') throw new DomainError('INVALID_TRANSITION', 'Calculation is only available after reference evidence is locked');
  return transition(session, { type: 'SET_RESULT', result: buildEvaluation(session) });
}

export function measurementsFor(session: Session, measurerId: string, round: 1 | 2): readonly Measurement[] {
  return session.measurements.filter(m => m.measurerId === measurerId && m.round === round);
}
