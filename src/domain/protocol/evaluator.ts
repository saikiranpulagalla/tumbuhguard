import { referenceAgreementTEM, repeatabilityTEM, signedMeanDifference } from '../calculation';
import { CalculationInputError } from '../calculation/tem';
import type { PairedMeasurement, SubjectMeans } from '../calculation';
import type { ProtocolProfile } from './profile';
import type { SessionResult } from '../session/state';

export interface EvaluationInput {
  readonly traineePairs: readonly PairedMeasurement[];
  readonly referencePairs: readonly PairedMeasurement[];
  readonly subjectMeans: readonly SubjectMeans[];
  readonly inputRevision: number;
}

/** Strict raw-value boundary evaluator. Display rounding must never be fed into this function. */
export function passesStrictThreshold(rawValue: number, threshold: number): boolean {
  if (!Number.isFinite(rawValue) || rawValue < 0) throw new CalculationInputError('rawValue must be finite and non-negative');
  if (!Number.isFinite(threshold) || threshold <= 0) throw new CalculationInputError('threshold must be finite and positive');
  return rawValue < threshold;
}

export function evaluateStandardization(profile: ProtocolProfile, input: EvaluationInput): SessionResult {
  const precisionTEM = repeatabilityTEM(input.traineePairs);
  const referencePrecisionTEM = repeatabilityTEM(input.referencePairs);
  const referenceValid = passesStrictThreshold(referencePrecisionTEM, profile.expertPrecisionThreshold);
  const referenceTEM = referenceValid ? referenceAgreementTEM(input.subjectMeans) : null;
  const signedDifference = referenceValid ? signedMeanDifference(input.subjectMeans) : null;
  return {
    calculationVersion: 'tg-calc-0.9.0',
    inputRevision: input.inputRevision,
    precisionTEM,
    referenceTEM,
    signedDifference,
    referencePrecisionTEM,
    referenceValid,
    precisionPass: passesStrictThreshold(precisionTEM, profile.precisionThreshold),
    referencePass: referenceValid && referenceTEM !== null ? passesStrictThreshold(referenceTEM, profile.referenceThreshold) : null,
  };
}
