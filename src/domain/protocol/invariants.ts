import type { Measurement, Session } from '../session/state';

export class DomainInvariantError extends Error {
  constructor(public readonly code: string, message = code) {
    super(message);
    this.name = 'DomainInvariantError';
  }
}

export function assertDistinctMeasurers(session: Session): void {
  if (session.trainee.id === session.reference.id) throw new DomainInvariantError('MEASURER_ROLE_COLLISION');
}

export function assertSetupIntegrity(session: Session): void {
  assertDistinctMeasurers(session);
  const active = session.subjects.filter(s => s.status === 'ACTIVE');
  if (active.length !== session.protocolSnapshot.requiredSubjectCount) {
    throw new DomainInvariantError('SUBJECT_COUNT_INVALID');
  }
  const subjectIds = new Set<string>();
  for (const subject of active) {
    if (subjectIds.has(subject.id)) throw new DomainInvariantError('DUPLICATE_ACTIVE_SUBJECT');
    subjectIds.add(subject.id);
  }
  const stationSubjects = new Set<string>();
  const stationIds = new Set<string>();
  for (const station of session.stations) {
    if (!station.deviceId) throw new DomainInvariantError('MISSING_DEVICE_PROVENANCE');
    if (stationIds.has(station.id) || stationSubjects.has(station.subjectId)) throw new DomainInvariantError('DUPLICATE_STATION_ASSIGNMENT');
    stationIds.add(station.id);
    stationSubjects.add(station.subjectId);
  }
  for (const subject of active) {
    if (!stationSubjects.has(subject.id)) throw new DomainInvariantError('MISSING_STATION_PROVENANCE');
  }
}

export function assertMeasurementUnique(existing: readonly Measurement[], candidate: Measurement): void {
  if (existing.some(m => m.subjectId === candidate.subjectId && m.measurerId === candidate.measurerId && m.round === candidate.round)) {
    throw new DomainInvariantError('DUPLICATE_MEASUREMENT');
  }
}

export function assertMeasurementValue(valueCm: number): void {
  if (!Number.isFinite(valueCm) || valueCm <= 0) throw new DomainInvariantError('INVALID_MEASUREMENT_VALUE');
  if (valueCm < 30 || valueCm > 220) throw new DomainInvariantError('MEASUREMENT_OUT_OF_RANGE');
}

export function resultIsCurrent(session: Session): boolean {
  return session.result !== null && session.result.inputRevision === session.revision;
}

export function assertResultCurrent(session: Session): void {
  if (!resultIsCurrent(session)) throw new DomainInvariantError('RESULT_STALE');
}
