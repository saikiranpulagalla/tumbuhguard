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
  ageCompositionRule: 'Competition synthetic cohort: exactly 5 subjects under 24 months and 5 subjects at/over 24 months. This composition is project-defined, not an official WHO/Kemenkes rule.',
  precisionThreshold: 0.6,
  referenceThreshold: 0.8,
  expertPrecisionThreshold: 0.4,
});

// SHA-256 of the stable-key JSON form of WORKING_STANDARDIZATION_PROFILE.
// scripts/release-check.ts independently verifies this value before release.
export const WORKING_STANDARDIZATION_PROFILE_HASH = 'd84ef983ce4cb82ca5d60e978e7f184addb8516b638bfefbbd81a5f2134f828d';

export function ageBandFor(ageMonths: number): AgeBand {
  if (!Number.isInteger(ageMonths) || ageMonths < 0) throw new Error('INVALID_AGE_MONTHS');
  return ageMonths < 24 ? 'UNDER_24_MONTHS' : 'AT_OR_OVER_24_MONTHS';
}

export function expectedPositionFor(ageMonths: number): MeasurementPosition {
  return ageBandFor(ageMonths) === 'UNDER_24_MONTHS' ? 'RECUMBENT' : 'STANDING';
}
