import { DomainError } from '../errors';
import { activeSubjects } from '../session/selectors';
import type { Session, SessionResult } from '../session/state';
import { evaluateStandardization } from './evaluator';
import { evaluateProtocolValidity } from './invariants';

/** Pure canonical derivation for result creation and persisted-result verification. */
export function evaluateSessionResult(session: Session): SessionResult {
  const subjects = activeSubjects(session);
  const pairFor = (measurerId: string) => subjects.map(subject => {
    const rows = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === measurerId);
    const first = rows.find(m => m.round === 1); const second = rows.find(m => m.round === 2);
    if (!first || !second) throw new DomainError('INCOMPLETE_ROUND', `Missing measurement pair for ${subject.id}`);
    return { subjectId: subject.id, first: first.valueCm, second: second.valueCm };
  });
  const subjectMeans = subjects.map(subject => {
    const trainee = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.trainee.id);
    const reference = session.measurements.filter(m => m.subjectId === subject.id && m.measurerId === session.reference.id);
    if (trainee.length !== 2 || reference.length !== 2) throw new DomainError('INCOMPLETE_ROUND', `Missing agreement input for ${subject.id}`);
    return { subjectId: subject.id, traineeMean: (trainee[0]!.valueCm + trainee[1]!.valueCm) / 2, referenceMean: (reference[0]!.valueCm + reference[1]!.valueCm) / 2 };
  });
  return { ...evaluateStandardization(session.protocolSnapshot, { traineePairs: pairFor(session.trainee.id), referencePairs: pairFor(session.reference.id), subjectMeans, inputRevision: session.revision }), protocolValidity: evaluateProtocolValidity(session) };
}
