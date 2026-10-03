import type { BlindRoundSubjectDTO, Session } from './state';

export function activeSubjects(session: Session) {
  return session.subjects.filter(subject => subject.status === 'ACTIVE');
}

export function selectBlindRoundSubjects(session: Session): readonly BlindRoundSubjectDTO[] {
  const active = new Set(activeSubjects(session).map(s => s.id));
  return session.stations
    .filter(station => active.has(station.subjectId))
    .map(station => {
      const subject = session.subjects.find(s => s.id === station.subjectId);
      if (!subject) throw new Error('SUBJECT_NOT_FOUND');
      return {
        subjectId: subject.id,
        subjectLabel: subject.syntheticLabel,
        stationId: station.id,
        stationLabel: station.label,
        expectedPosition: station.expectedPosition,
      };
    });
}
