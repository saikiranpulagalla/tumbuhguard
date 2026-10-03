import { repeatabilityTEM, type PairedMeasurement } from './tem';

export function referenceRepeatabilityTEM(pairs: readonly PairedMeasurement[]): number {
  return repeatabilityTEM(pairs);
}
