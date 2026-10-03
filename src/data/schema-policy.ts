export type SchemaCompatibilityDecision =
  | { readonly kind: 'BOOTSTRAP' }
  | { readonly kind: 'COMPATIBLE' }
  | { readonly kind: 'INCOMPATIBLE'; readonly storedVersion: string };

/**
 * Pure policy for application-level schema markers.
 *
 * A missing marker is safe to create only when there are no existing
 * application records. Otherwise the database may pre-date the current
 * schema contract and must be surfaced for explicit recovery/migration.
 */
export function classifySchemaCompatibility(
  storedVersion: string | undefined,
  currentVersion: number,
  hasExistingRecords: boolean,
): SchemaCompatibilityDecision {
  const expected = String(currentVersion);
  if (storedVersion === undefined) {
    return hasExistingRecords
      ? { kind: 'INCOMPATIBLE', storedVersion: 'MISSING' }
      : { kind: 'BOOTSTRAP' };
  }
  return storedVersion === expected
    ? { kind: 'COMPATIBLE' }
    : { kind: 'INCOMPATIBLE', storedVersion };
}
