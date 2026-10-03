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
    if (!first || !second) throw new Error(`MISSING_TRAINEE_PAIR:${subject.id}`);
    return { subjectId: subject.id, first: first.valueCm, second: second.valueCm };
  });
  const referencePairs = subjects.map(subject => {
    const rows = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.reference.id);
    const first = rows.find(m => m.round === 1);
    const second = rows.find(m => m.round === 2);
    if (!first || !second) throw new Error(`MISSING_REFERENCE_PAIR:${subject.id}`);
    return { subjectId: subject.id, first: first.valueCm, second: second.valueCm };
  });
  const subjectMeans = subjects.map(subject => {
    const t = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.trainee.id);
    const r = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.reference.id);
    if (t.length !== 2 || r.length !== 2) throw new Error(`MISSING_MEAN_INPUT:${subject.id}`);
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
  if (session.state !== 'READY_TO_CALCULATE') throw new Error('NOT_READY_TO_CALCULATE');
  return transition(session, { type: 'SET_RESULT', result: buildEvaluation(session) });
}

export function measurementsFor(session: Session, measurerId: string, round: 1 | 2): readonly Measurement[] {
  return session.measurements.filter(m => m.measurerId === measurerId && m.round === round);
}
