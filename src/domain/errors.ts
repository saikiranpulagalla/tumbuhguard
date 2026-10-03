export type DomainErrorCode =
  | 'INVALID_TRANSITION'
  | 'INCOMPLETE_ROUND'
  | 'DUPLICATE_MEASUREMENT'
  | 'STALE_REVISION'
  | 'RESULT_STALE'
  | 'REFERENCE_INVALID'
  | 'PROTOCOL_INVALID'
  | 'MALFORMED_MEASUREMENT'
  | 'SCHEMA_INCOMPATIBLE'
  | 'STORED_RECORD_INVALID'
  | 'SUBJECT_DUPLICATE'
  | 'STATION_DUPLICATE'
  | 'MEASURER_ROLE_COLLISION'
  | 'SUBJECT_COUNT_INVALID'
  | 'AGE_COMPOSITION_INVALID'
  | 'MISSING_DEVICE_PROVENANCE'
  | 'MISSING_STATION_PROVENANCE'
  | 'UNKNOWN_SUBJECT'
  | 'UNKNOWN_STATION'
  | 'STATION_SUBJECT_MISMATCH'
  | 'SESSION_ID_MISMATCH'
  | 'UNKNOWN_MEASURER'
  | 'ROUND_MEASURER_MISMATCH'
  | 'INVALID_MEASUREMENT_VALUE'
  | 'MEASUREMENT_OUT_OF_RANGE'
  | 'REVISION_MUST_ADVANCE'
  | 'STATION_CHANGE_REQUIRES_REVIEW'
  | 'SUBJECT_REPLACEMENT_INVALID'
  | 'SESSION_NOT_FOUND';

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message: string = code) {
    super(message);
    this.name = 'DomainError';
  }
}

const FRIENDLY: Partial<Record<DomainErrorCode, string>> = {
  INVALID_TRANSITION: 'That action is not available at the current protocol step.',
  INCOMPLETE_ROUND: 'Complete every active subject measurement before locking this round.',
  DUPLICATE_MEASUREMENT: 'This measurement has already been recorded.',
  STALE_REVISION: 'Another tab saved a newer revision. The latest local session has been reloaded.',
  RESULT_STALE: 'The displayed result is based on an older revision and must be recalculated.',
  REFERENCE_INVALID: 'Reference agreement is unavailable because reference repeatability did not meet the selected profile.',
  PROTOCOL_INVALID: 'The setup does not satisfy the selected protocol profile.',
  MALFORMED_MEASUREMENT: 'Enter a valid length/height value in centimetres.',
  SCHEMA_INCOMPATIBLE: 'This local database was created by an unsupported schema version.',
  STORED_RECORD_INVALID: 'The saved local session failed validation and was not loaded.',
  SUBJECT_DUPLICATE: 'Each active synthetic subject must be unique.',
  STATION_DUPLICATE: 'Each active subject must have one unique station assignment.',
  STATION_CHANGE_REQUIRES_REVIEW: 'Station assignments cannot be silently changed after measurements exist.',
  SESSION_NOT_FOUND: 'This local session no longer exists. It may have been reset or removed in another tab.',
};

export function friendlyDomainError(error: unknown): string {
  if (error instanceof DomainError) return FRIENDLY[error.code] ?? error.message;
  if (error instanceof Error) return error.message;
  return 'The action could not be completed.';
}
