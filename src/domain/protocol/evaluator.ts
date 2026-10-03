import { referenceAgreementTEM, repeatabilityTEM, signedMeanDifference } from '../calculation';
import type { PairedMeasurement, SubjectMeans } from '../calculation';
import type { ProtocolProfile } from './profile';
import type { SessionResult } from '../session/state';

export interface EvaluationInput {
  readonly traineePairs: readonly PairedMeasurement[];
  readonly referencePairs: readonly PairedMeasurement[];
  readonly subjectMeans: readonly SubjectMeans[];
  readonly inputRevision: number;
}

export function evaluateStandardization(profile: ProtocolProfile, input: EvaluationInput): SessionResult {
  const precisionTEM = repeatabilityTEM(input.traineePairs);
  const referencePrecisionTEM = repeatabilityTEM(input.referencePairs);
  const referenceValid = referencePrecisionTEM < profile.expertPrecisionThreshold;
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
    precisionPass: precisionTEM < profile.precisionThreshold,
    referencePass: referenceValid && referenceTEM !== null ? referenceTEM < profile.referenceThreshold : null,
  };
}
