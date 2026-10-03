import { CalculationInputError } from './tem';
import type { SubjectMeans } from './bias';

/**
 * Project working formula for trainee/reference agreement TEM.
 * EXTERNAL_ORACLE_PARITY_PENDING: this implementation must not be described as
 * WHO/DHS Annex-13 parity until checked against the authoritative supplied oracle.
 */
export function referenceAgreementTEM(rows: readonly SubjectMeans[]): number {
  if (rows.length === 0) throw new CalculationInputError('At least one subject mean is required');
  const ids = new Set<string>();
  let sumSquares = 0;
  for (const row of rows) {
    if (ids.has(row.subjectId)) throw new CalculationInputError(`Duplicate subjectId: ${row.subjectId}`);
    ids.add(row.subjectId);
    if (!Number.isFinite(row.traineeMean) || !Number.isFinite(row.referenceMean)) {
      throw new CalculationInputError('Subject means must be finite');
    }
    const difference = row.traineeMean - row.referenceMean;
    sumSquares += difference * difference;
  }
  return Math.sqrt(sumSquares / (2 * rows.length));
}
