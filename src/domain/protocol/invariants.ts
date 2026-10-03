import { DomainError } from '../errors';
import { ageBandFor, expectedPositionFor } from './profile';
import type { Measurement, Session, Station, Subject } from '../session/state';

export function assertDistinctMeasurers(session: Session): void {
  if (session.trainee.id === session.reference.id) throw new DomainError('MEASURER_ROLE_COLLISION');
}

export function assertSetupIntegrity(session: Session): void {
  assertDistinctMeasurers(session);
  const active = session.subjects.filter(s => s.status === 'ACTIVE');
  if (active.length !== session.protocolSnapshot.requiredSubjectCount) throw new DomainError('SUBJECT_COUNT_INVALID');

  const subjectIds = new Set<string>();
  for (const subject of active) {
    if (subjectIds.has(subject.id)) throw new DomainError('SUBJECT_DUPLICATE');
    if (subject.ageBand !== ageBandFor(subject.ageMonths)) throw new DomainError('PROTOCOL_INVALID', 'Subject age band does not match age in months');
    subjectIds.add(subject.id);
  }

  if (session.protocolSnapshot.id === 'tg-standardize-length-height') {
    const under24 = active.filter(s => s.ageBand === 'UNDER_24_MONTHS').length;
    const atOrOver24 = active.filter(s => s.ageBand === 'AT_OR_OVER_24_MONTHS').length;
    if (under24 !== 5 || atOrOver24 !== 5) throw new DomainError('AGE_COMPOSITION_INVALID');
  }

  const deviceIds = new Set(session.devices.map(device => device.id));
  const stationSubjects = new Set<string>();
  const stationIds = new Set<string>();
  for (const station of session.stations) {
    if (!station.deviceId || !deviceIds.has(station.deviceId)) throw new DomainError('MISSING_DEVICE_PROVENANCE');
    if (stationIds.has(station.id) || stationSubjects.has(station.subjectId)) throw new DomainError('STATION_DUPLICATE');
    const subject = active.find(item => item.id === station.subjectId);
    if (subject && station.expectedPosition !== expectedPositionFor(subject.ageMonths)) throw new DomainError('PROTOCOL_INVALID', 'Station expected position does not match subject age');
    stationIds.add(station.id);
    stationSubjects.add(station.subjectId);
  }
  for (const subject of active) if (!stationSubjects.has(subject.id)) throw new DomainError('MISSING_STATION_PROVENANCE');
}

export function assertMeasurementUnique(existing: readonly Measurement[], candidate: Measurement): void {
  if (existing.some(m => m.subjectId === candidate.subjectId && m.measurerId === candidate.measurerId && m.round === candidate.round)) {
    throw new DomainError('DUPLICATE_MEASUREMENT');
  }
}

export function assertMeasurementValue(valueCm: number): void {
  if (!Number.isFinite(valueCm) || valueCm <= 0) throw new DomainError('INVALID_MEASUREMENT_VALUE');
  if (valueCm < 30 || valueCm > 220) throw new DomainError('MEASUREMENT_OUT_OF_RANGE');
}

export function assertMeasurementProvenance(session: Session, candidate: Measurement): void {
  if (candidate.sessionId !== session.id) throw new DomainError('SESSION_ID_MISMATCH');
  const subject = session.subjects.find(s => s.id === candidate.subjectId && s.status === 'ACTIVE');
  if (!subject) throw new DomainError('UNKNOWN_SUBJECT');
  const station = session.stations.find(s => s.id === candidate.stationId);
  if (!station) throw new DomainError('UNKNOWN_STATION');
  if (station.subjectId !== candidate.subjectId) throw new DomainError('STATION_SUBJECT_MISMATCH');
  if (!session.devices.some(device => device.id === station.deviceId)) throw new DomainError('MISSING_DEVICE_PROVENANCE');
}

export function resultIsCurrent(session: Session): boolean {
  return session.result !== null && session.result.inputRevision === session.revision;
}

export function assertResultCurrent(session: Session): void {
  if (!resultIsCurrent(session)) throw new DomainError('RESULT_STALE');
}

export function replaceActiveSubject(session: Session, oldSubjectId: string, replacement: Subject): Session {
  if (!['DRAFT', 'SETUP_VALID', 'ROUND1_OPEN'].includes(session.state)) {
    throw new DomainError('SUBJECT_REPLACEMENT_INVALID', 'Subject replacement must occur before Round 1 is locked');
  }
  const old = session.subjects.find(subject => subject.id === oldSubjectId && subject.status === 'ACTIVE');
  if (!old || replacement.status !== 'ACTIVE' || replacement.replacementFor !== oldSubjectId) throw new DomainError('SUBJECT_REPLACEMENT_INVALID');
  if (session.subjects.some(subject => subject.id === replacement.id)) throw new DomainError('SUBJECT_DUPLICATE');
  if (replacement.ageBand !== ageBandFor(replacement.ageMonths)) throw new DomainError('SUBJECT_REPLACEMENT_INVALID', 'Replacement age band does not match age in months');
  const station = session.stations.find(row => row.subjectId === oldSubjectId);
  if (!station) throw new DomainError('MISSING_STATION_PROVENANCE');
  const replacementStationId = `${station.id}-replacement-${replacement.id}`;
  if (session.stations.some(row => row.id === replacementStationId)) throw new DomainError('STATION_DUPLICATE');
  const subjects = session.subjects.map(subject => subject.id === oldSubjectId ? { ...subject, status: 'REPLACED' as const } : subject);
  return {
    ...session,
    subjects: [...subjects, replacement],
    // Preserve the original station record so historical measurements retain
    // their subject/station provenance. The replacement receives a new active
    // assignment rather than rewriting history in place.
    stations: [...session.stations, {
      ...station,
      id: replacementStationId,
      label: `${station.label} · replacement`,
      subjectId: replacement.id,
      expectedPosition: expectedPositionFor(replacement.ageMonths),
    }],
    result: null,
    revision: session.revision + 1,
    updatedAt: new Date().toISOString(),
  };
}

export function replaceStationAssignment(session: Session, nextStation: Station): Session {
  const current = session.stations.find(station => station.id === nextStation.id);
  if (!current) throw new DomainError('UNKNOWN_STATION');
  if (session.measurements.some(measurement => measurement.stationId === current.id)) throw new DomainError('STATION_CHANGE_REQUIRES_REVIEW');
  return {
    ...session,
    stations: session.stations.map(station => station.id === nextStation.id ? nextStation : station),
    result: null,
    revision: session.revision + 1,
    updatedAt: new Date().toISOString(),
  };
}
