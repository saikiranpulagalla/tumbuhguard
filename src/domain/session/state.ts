import type { MeasurementPosition, ProtocolProfile, AgeBand } from '../protocol/profile';

export type SessionState =
  | 'DRAFT' | 'SETUP_VALID' | 'ROUND1_OPEN' | 'ROUND1_LOCKED'
  | 'ROUND2_OPEN' | 'ROUND2_LOCKED' | 'REFERENCE_OPEN' | 'REFERENCE_LOCKED'
  | 'READY_TO_CALCULATE' | 'RESULT_VALID' | 'REMEDIATION' | 'CLOSED';

export type MeasurerRole = 'TRAINEE' | 'REFERENCE';
export type SubjectStatus = 'ACTIVE' | 'REPLACED';
export type DataMode = 'SYNTHETIC';
export type ObservationResult = 'OBSERVED_OK' | 'NEEDS_REVIEW' | 'NOT_OBSERVED';

export interface Measurer { readonly id: string; readonly label: string; readonly role: MeasurerRole; }
export interface Device { readonly id: string; readonly label: string; readonly type: string; }
export interface Subject {
  readonly id: string;
  readonly syntheticLabel: string;
  readonly ageMonths: number;
  readonly ageBand: AgeBand;
  readonly status: SubjectStatus;
  readonly replacementFor?: string;
}
export interface Station {
  readonly id: string;
  readonly label: string;
  readonly subjectId: string;
  readonly deviceId: string;
  readonly expectedPosition: MeasurementPosition;
}
export interface Measurement {
  readonly id: string;
  readonly sessionId: string;
  readonly measurerId: string;
  readonly subjectId: string;
  readonly stationId: string;
  readonly round: 1 | 2;
  readonly valueCm: number;
  readonly position: MeasurementPosition;
  readonly revision: number;
  readonly recordedAt: string;
}
export interface Observation {
  readonly id: string;
  readonly measurerId: string;
  readonly item: string;
  readonly result: ObservationResult;
  readonly note?: string;
}
export interface RemediationNote {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
}
export interface SessionResult {
  readonly calculationVersion: string;
  readonly inputRevision: number;
  readonly precisionTEM: number;
  readonly referenceTEM: number | null;
  readonly signedDifference: number | null;
  readonly referencePrecisionTEM: number;
  readonly referenceValid: boolean;
  readonly precisionPass: boolean;
  readonly referencePass: boolean | null;
}
export interface Session {
  readonly id: string;
  readonly protocolSnapshot: ProtocolProfile;
  readonly protocolHash: string;
  readonly protocolVersion: string;
  readonly state: SessionState;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly dataMode: DataMode;
  readonly parentSessionId?: string;
  readonly trainee: Measurer;
  readonly reference: Measurer;
  readonly subjects: readonly Subject[];
  readonly devices: readonly Device[];
  readonly stations: readonly Station[];
  readonly measurements: readonly Measurement[];
  readonly observations: readonly Observation[];
  readonly remediationNotes: readonly RemediationNote[];
  readonly result: SessionResult | null;
}

export interface BlindRoundSubjectDTO {
  readonly subjectId: string;
  readonly subjectLabel: string;
  readonly stationId: string;
  readonly stationLabel: string;
  readonly expectedPosition: MeasurementPosition;
}
