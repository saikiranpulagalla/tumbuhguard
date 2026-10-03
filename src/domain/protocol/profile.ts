export type MeasurementPosition = 'RECUMBENT' | 'STANDING';
export type AgeBand = 'UNDER_24_MONTHS' | 'AT_OR_OVER_24_MONTHS';

export interface ProtocolProfile {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly source: string;
  readonly requiredSubjectCount: number;
  readonly ageCompositionRule: string;
  readonly precisionThreshold: number;
  readonly referenceThreshold: number;
  readonly expertPrecisionThreshold: number;
}

export const WORKING_STANDARDIZATION_PROFILE: ProtocolProfile = Object.freeze({
  id: 'tg-standardize-length-height',
  version: '0.9.0-working',
  name: 'TumbuhGuard Working Length/Height Standardization Profile',
  source: 'Project working profile; external authoritative parity pending',
  requiredSubjectCount: 10,
  ageCompositionRule: 'Synthetic demo cohort avoids ambiguous age/position edge cases; exact 24-month behavior tested separately.',
  precisionThreshold: 0.6,
  referenceThreshold: 0.8,
  expertPrecisionThreshold: 0.4,
});

export function ageBandFor(ageMonths: number): AgeBand {
  if (!Number.isInteger(ageMonths) || ageMonths < 0) throw new Error('INVALID_AGE_MONTHS');
  return ageMonths < 24 ? 'UNDER_24_MONTHS' : 'AT_OR_OVER_24_MONTHS';
}

export function expectedPositionFor(ageMonths: number): MeasurementPosition {
  return ageBandFor(ageMonths) === 'UNDER_24_MONTHS' ? 'RECUMBENT' : 'STANDING';
}
