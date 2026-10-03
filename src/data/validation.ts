import { z } from 'zod';
import { DomainError } from '../domain/errors';
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
  round: z.union([z.literal(1), z.literal(2)]), valueCm: z.number().finite().positive(), position: z.enum(['RECUMBENT', 'STANDING']),
  revision: z.number().int().nonnegative(), recordedAt: z.string().min(1),
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
  if (session.result && session.result.inputRevision !== session.revision) {
    throw new DomainError('RESULT_STALE', 'Saved result does not match the current session revision');
  }
  if (session.trainee.id === session.reference.id) {
    throw new DomainError('STORED_RECORD_INVALID', 'Stored session reuses one measurer for trainee and reference roles');
  }
  const activeIds = new Set(session.subjects.filter(subject => subject.status === 'ACTIVE').map(subject => subject.id));
  for (const measurement of session.measurements) {
    if (!session.subjects.some(subject => subject.id === measurement.subjectId)) {
      throw new DomainError('STORED_RECORD_INVALID', 'Stored measurement references an unknown subject');
    }
    if (!session.stations.some(station => station.id === measurement.stationId)) {
      throw new DomainError('STORED_RECORD_INVALID', 'Stored measurement references an unknown station');
    }
  }
  if (session.state === 'RESULT_VALID' && (!session.result || activeIds.size === 0)) {
    throw new DomainError('STORED_RECORD_INVALID', 'Result-valid state is missing its current result');
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
