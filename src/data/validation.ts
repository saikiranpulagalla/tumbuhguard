import { z } from 'zod';
import { DomainError } from '../domain/errors';
import { expectedPositionFor } from '../domain/protocol/profile';
import type { Session } from '../domain/session/state';
import type { SessionRecord } from './schema';

const protocolProfileSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  name: z.string().min(1),
  source: z.string().min(1),
  requiredSubjectCount: z.number().int().positive(),
  ageCompositionRule: z.string().min(1),
  precisionThreshold: z.number().finite().positive(),
  referenceThreshold: z.number().finite().positive(),
  expertPrecisionThreshold: z.number().finite().positive(),
});

const measurerSchema = z.object({
  id: z.string().min(1), label: z.string().min(1), role: z.enum(['TRAINEE', 'REFERENCE']),
});
const subjectSchema = z.object({
  id: z.string().min(1), syntheticLabel: z.string().min(1), ageMonths: z.number().int().nonnegative(),
  ageBand: z.enum(['UNDER_24_MONTHS', 'AT_OR_OVER_24_MONTHS']), status: z.enum(['ACTIVE', 'REPLACED']),
  replacementFor: z.string().min(1).optional(),
});
const deviceSchema = z.object({ id: z.string().min(1), label: z.string().min(1), type: z.string().min(1) });
const stationSchema = z.object({
  id: z.string().min(1), label: z.string().min(1), subjectId: z.string().min(1), deviceId: z.string().min(1),
  expectedPosition: z.enum(['RECUMBENT', 'STANDING']),
});
const measurementSchema = z.object({
  id: z.string().min(1), sessionId: z.string().min(1), measurerId: z.string().min(1), subjectId: z.string().min(1), stationId: z.string().min(1),
  round: z.union([z.literal(1), z.literal(2)]), valueCm: z.number().finite().min(30).max(220), position: z.enum(['RECUMBENT', 'STANDING']),
  revision: z.number().int().positive(), recordedAt: z.string().min(1),
});
const observationSchema = z.object({
  id: z.string().min(1), measurerId: z.string().min(1), item: z.string().min(1),
  result: z.enum(['OBSERVED_OK', 'NEEDS_REVIEW', 'NOT_OBSERVED']), note: z.string().optional(),
});
const remediationNoteSchema = z.object({ id: z.string().min(1), text: z.string().min(1), createdAt: z.string().min(1) });
const resultSchema = z.object({
  calculationVersion: z.string().min(1), inputRevision: z.number().int().nonnegative(),
  precisionTEM: z.number().finite().nonnegative(), referenceTEM: z.number().finite().nonnegative().nullable(),
  signedDifference: z.number().finite().nullable(), referencePrecisionTEM: z.number().finite().nonnegative(),
  referenceValid: z.boolean(), precisionPass: z.boolean(), referencePass: z.boolean().nullable(),
});

export const sessionSchema = z.object({
  id: z.string().min(1), protocolSnapshot: protocolProfileSchema, protocolHash: z.string().regex(/^[a-f0-9]{64}$/), protocolVersion: z.string().min(1),
  state: z.enum(['DRAFT','SETUP_VALID','ROUND1_OPEN','ROUND1_LOCKED','ROUND2_OPEN','ROUND2_LOCKED','REFERENCE_OPEN','REFERENCE_LOCKED','READY_TO_CALCULATE','RESULT_VALID','REMEDIATION','CLOSED']),
  revision: z.number().int().nonnegative(), createdAt: z.string().min(1), updatedAt: z.string().min(1), dataMode: z.literal('SYNTHETIC'),
  parentSessionId: z.string().min(1).optional(), trainee: measurerSchema, reference: measurerSchema,
  subjects: z.array(subjectSchema), devices: z.array(deviceSchema), stations: z.array(stationSchema), measurements: z.array(measurementSchema),
  observations: z.array(observationSchema), remediationNotes: z.array(remediationNoteSchema), result: resultSchema.nullable(),
});

export const sessionRecordSchema = sessionSchema.extend({ integrityHash: z.string().regex(/^[a-f0-9]{64}$/) });

function assertCrossFieldConsistency(session: Session): void {
  if (session.protocolVersion !== session.protocolSnapshot.version) {
    throw new DomainError('STORED_RECORD_INVALID', 'Stored protocol version does not match its snapshot');
  }
  if (session.result && session.result.inputRevision !== session.revision) {
    throw new DomainError('RESULT_STALE', 'Saved result does not match the current session revision');
  }
  if (session.trainee.role !== 'TRAINEE' || session.reference.role !== 'REFERENCE') {
    throw new DomainError('STORED_RECORD_INVALID', 'Stored measurer roles are invalid');
  }
  if (session.trainee.id === session.reference.id) {
    throw new DomainError('STORED_RECORD_INVALID', 'Stored session reuses one measurer for trainee and reference roles');
  }

  const subjectIds = new Set<string>();
  for (const subject of session.subjects) {
    if (subjectIds.has(subject.id)) throw new DomainError('STORED_RECORD_INVALID', 'Stored session contains duplicate subject IDs');
    if (subject.ageBand !== (subject.ageMonths < 24 ? 'UNDER_24_MONTHS' : 'AT_OR_OVER_24_MONTHS')) {
      throw new DomainError('STORED_RECORD_INVALID', 'Stored subject age band is inconsistent with age in months');
    }
    subjectIds.add(subject.id);
  }
  const activeIds = new Set(session.subjects.filter(subject => subject.status === 'ACTIVE').map(subject => subject.id));

  const deviceIds = new Set<string>();
  for (const device of session.devices) {
    if (deviceIds.has(device.id)) throw new DomainError('STORED_RECORD_INVALID', 'Stored session contains duplicate device IDs');
    deviceIds.add(device.id);
  }

  const stationIds = new Set<string>();
  const stationSubjectIds = new Set<string>();
  for (const station of session.stations) {
    if (stationIds.has(station.id)) throw new DomainError('STORED_RECORD_INVALID', 'Stored session contains duplicate station IDs');
    if (stationSubjectIds.has(station.subjectId)) throw new DomainError('STORED_RECORD_INVALID', 'Stored subject has more than one station assignment');
    const subject = session.subjects.find(item => item.id === station.subjectId);
    if (!subject) throw new DomainError('STORED_RECORD_INVALID', 'Stored station references an unknown subject');
    if (!deviceIds.has(station.deviceId)) throw new DomainError('STORED_RECORD_INVALID', 'Stored station references an unknown device');
    if (station.expectedPosition !== expectedPositionFor(subject.ageMonths)) {
      throw new DomainError('STORED_RECORD_INVALID', 'Stored station position expectation is inconsistent with subject age');
    }
    stationIds.add(station.id);
    stationSubjectIds.add(station.subjectId);
  }

  const measurementIds = new Set<string>();
  const measurementKeys = new Set<string>();
  for (const measurement of session.measurements) {
    if (measurementIds.has(measurement.id)) throw new DomainError('STORED_RECORD_INVALID', 'Stored session contains duplicate measurement IDs');
    if (measurement.sessionId !== session.id) throw new DomainError('STORED_RECORD_INVALID', 'Stored measurement references a different session');
    if (!subjectIds.has(measurement.subjectId)) throw new DomainError('STORED_RECORD_INVALID', 'Stored measurement references an unknown subject');
    const station = session.stations.find(item => item.id === measurement.stationId);
    if (!station) throw new DomainError('STORED_RECORD_INVALID', 'Stored measurement references an unknown station');
    if (station.subjectId !== measurement.subjectId) throw new DomainError('STORED_RECORD_INVALID', 'Stored measurement station/subject provenance is inconsistent');
    if (measurement.measurerId !== session.trainee.id && measurement.measurerId !== session.reference.id) {
      throw new DomainError('STORED_RECORD_INVALID', 'Stored measurement references an unknown measurer');
    }
    if (measurement.revision > session.revision) throw new DomainError('STORED_RECORD_INVALID', 'Stored measurement revision is newer than its session');
    const key = `${measurement.subjectId}\u0000${measurement.measurerId}\u0000${measurement.round}`;
    if (measurementKeys.has(key)) throw new DomainError('STORED_RECORD_INVALID', 'Stored session contains a duplicate subject/measurer/round measurement');
    measurementIds.add(measurement.id);
    measurementKeys.add(key);
  }

  if (session.state !== 'DRAFT' && activeIds.size !== session.protocolSnapshot.requiredSubjectCount) {
    throw new DomainError('STORED_RECORD_INVALID', 'Progressed session has the wrong active subject count');
  }
  if (session.state !== 'DRAFT') {
    for (const activeId of activeIds) {
      if (!stationSubjectIds.has(activeId)) throw new DomainError('STORED_RECORD_INVALID', 'Progressed session is missing active station provenance');
    }
    if (session.protocolSnapshot.id === 'tg-standardize-length-height') {
      const active = session.subjects.filter(subject => subject.status === 'ACTIVE');
      const under24 = active.filter(subject => subject.ageBand === 'UNDER_24_MONTHS').length;
      const atOrOver24 = active.filter(subject => subject.ageBand === 'AT_OR_OVER_24_MONTHS').length;
      if (under24 !== 5 || atOrOver24 !== 5) throw new DomainError('STORED_RECORD_INVALID', 'Progressed session has invalid competition age composition');
    }
  }

  const stateOrder = ['DRAFT','SETUP_VALID','ROUND1_OPEN','ROUND1_LOCKED','ROUND2_OPEN','ROUND2_LOCKED','REFERENCE_OPEN','REFERENCE_LOCKED','READY_TO_CALCULATE','RESULT_VALID','REMEDIATION','CLOSED'] as const;
  const atLeast = (state: typeof stateOrder[number]) => stateOrder.indexOf(session.state) >= stateOrder.indexOf(state);
  const hasMeasurement = (subjectId: string, measurerId: string, round: 1|2) => session.measurements.some(row => row.subjectId === subjectId && row.measurerId === measurerId && row.round === round);
  if (atLeast('ROUND1_LOCKED')) for (const id of activeIds) if (!hasMeasurement(id, session.trainee.id, 1)) throw new DomainError('STORED_RECORD_INVALID', 'Stored state claims Round 1 is locked but active measurements are incomplete');
  if (atLeast('ROUND2_LOCKED')) for (const id of activeIds) if (!hasMeasurement(id, session.trainee.id, 2)) throw new DomainError('STORED_RECORD_INVALID', 'Stored state claims Round 2 is locked but active measurements are incomplete');
  if (atLeast('REFERENCE_LOCKED')) for (const id of activeIds) {
    if (!hasMeasurement(id, session.reference.id, 1) || !hasMeasurement(id, session.reference.id, 2)) throw new DomainError('STORED_RECORD_INVALID', 'Stored state claims reference measurements are locked but active pairs are incomplete');
  }

  const resultState = session.state === 'RESULT_VALID' || session.state === 'REMEDIATION' || session.state === 'CLOSED';
  if (resultState && (!session.result || activeIds.size === 0)) {
    throw new DomainError('STORED_RECORD_INVALID', 'Result-bearing state is missing its current result');
  }
  if (!resultState && session.result) {
    throw new DomainError('STORED_RECORD_INVALID', 'Stored result appears before the result-valid protocol state');
  }
  if (session.result) {
    if (!session.result.referenceValid && (session.result.referenceTEM !== null || session.result.referencePass !== null || session.result.signedDifference !== null)) {
      throw new DomainError('STORED_RECORD_INVALID', 'Invalid reference result must withhold agreement and signed difference');
    }
    if (session.result.referenceValid && (session.result.referenceTEM === null || session.result.referencePass === null || session.result.signedDifference === null)) {
      throw new DomainError('STORED_RECORD_INVALID', 'Valid reference result is missing agreement evidence');
    }
  }
}

export function parseStoredSessionRecord(value: unknown): SessionRecord {
  const parsed = sessionRecordSchema.safeParse(value);
  if (!parsed.success) throw new DomainError('STORED_RECORD_INVALID', 'Saved local session failed schema validation');
  const record = parsed.data as SessionRecord;
  assertCrossFieldConsistency(record);
  return record;
}

export function assertSessionShape(value: unknown): asserts value is Session {
  const parsed = sessionSchema.safeParse(value);
  if (!parsed.success) throw new DomainError('STORED_RECORD_INVALID', 'Session failed schema validation');
  assertCrossFieldConsistency(parsed.data as Session);
}
