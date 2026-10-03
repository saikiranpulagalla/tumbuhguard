export interface PairedMeasurement {
  readonly subjectId: string;
  readonly first: number;
  readonly second: number;
}

export class CalculationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalculationInputError';
  }
}

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new CalculationInputError(`${label} must be a finite positive number`);
  }
}

export function validateUniquePairs(pairs: readonly PairedMeasurement[]): void {
  if (pairs.length === 0) throw new CalculationInputError('At least one paired measurement is required');
  const seen = new Set<string>();
  for (const pair of pairs) {
    if (!pair.subjectId) throw new CalculationInputError('subjectId is required');
    if (seen.has(pair.subjectId)) throw new CalculationInputError(`Duplicate subjectId: ${pair.subjectId}`);
    seen.add(pair.subjectId);
    assertFinitePositive(pair.first, `${pair.subjectId}.first`);
    assertFinitePositive(pair.second, `${pair.subjectId}.second`);
  }
}

/** Technical Error of Measurement for repeated paired measurements. */
export function repeatabilityTEM(pairs: readonly PairedMeasurement[]): number {
  validateUniquePairs(pairs);
  const sumSquares = pairs.reduce((sum, pair) => {
    const d = pair.first - pair.second;
    return sum + d * d;
  }, 0);
  return Math.sqrt(sumSquares / (2 * pairs.length));
}
