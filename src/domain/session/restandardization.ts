import { DomainError } from '../errors';
import type { Session, Subject } from './state';

export function createRestandardizationSession(parent: Session, id: string, now: string): Session {
  if (parent.state !== 'REMEDIATION') throw new DomainError('INVALID_TRANSITION', 'Re-standardization can only be created from remediation');
  if (!id || id === parent.id) throw new DomainError('PROTOCOL_INVALID', 'Re-standardization requires a new session ID');

  const subjects: Subject[] = parent.subjects
    .filter(subject => subject.status === 'ACTIVE')
    .map(subject => ({
      id: subject.id,
      syntheticLabel: subject.syntheticLabel,
      ageMonths: subject.ageMonths,
      ageBand: subject.ageBand,
      status: 'ACTIVE',
    }));
  const activeIds = new Set(subjects.map(subject => subject.id));

  return {
    id,
    protocolSnapshot: { ...parent.protocolSnapshot },
    protocolHash: parent.protocolHash,
    protocolVersion: parent.protocolVersion,
    state: 'DRAFT',
    revision: 0,
    createdAt: now,
    updatedAt: now,
    dataMode: 'SYNTHETIC',
    parentSessionId: parent.id,
    trainee: { ...parent.trainee },
    reference: { ...parent.reference },
    subjects,
    devices: parent.devices.map(device => ({ ...device })),
    stations: parent.stations.filter(station => activeIds.has(station.subjectId)).map(station => ({ ...station })),
    measurements: [],
    observations: [],
    remediationNotes: [],
    result: null,
  };
}
