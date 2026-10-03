import { CalculationInputError } from './tem';

export interface SubjectMeans {
  readonly subjectId: string;
  readonly traineeMean: number;
  readonly referenceMean: number;
}

export function signedMeanDifference(rows: readonly SubjectMeans[]): number {
  if (rows.length === 0) throw new CalculationInputError('At least one subject mean is required');
  const ids = new Set<string>();
  let total = 0;
  for (const row of rows) {
    if (ids.has(row.subjectId)) throw new CalculationInputError(`Duplicate subjectId: ${row.subjectId}`);
    ids.add(row.subjectId);
    if (!Number.isFinite(row.traineeMean) || !Number.isFinite(row.referenceMean)) {
      throw new CalculationInputError('Subject means must be finite');
    }
    total += row.traineeMean - row.referenceMean;
  }
  return total / rows.length;
}
