export const SCIENTIFIC_PARITY_STATUS = 'EXTERNAL_ORACLE_PARITY_PENDING' as const;

export const SAFE_CLAIMS = Object.freeze({
  context: 'Designed as a proposed practical QA workflow for the Posyandu cadre-training context.',
  methodology: 'WHO/UNICEF-aligned anthropometry standardization training and QA.',
  offline: 'After the application has successfully loaded once and cached its shell, the complete standardization workflow works without network connectivity.',
  blinding: 'The application enforces blinded measurement in the normal assessment workflow: Round-1 values are not exposed to the Round-2 entry interface.',
  integrity: 'Application-level revision history with integrity checks.',
});
