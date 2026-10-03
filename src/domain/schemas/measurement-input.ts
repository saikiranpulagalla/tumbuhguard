export type MeasurementParseResult =
  | { ok: true; valueCm: number }
  | { ok: false; code: 'EMPTY' | 'MALFORMED' | 'NON_POSITIVE' | 'OUT_OF_RANGE' };

export function parseMeasurementInput(raw: string): MeasurementParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, code: 'EMPTY' };
  if ((trimmed.match(/,/g) ?? []).length > 1 || (trimmed.includes(',') && trimmed.includes('.'))) {
    return { ok: false, code: 'MALFORMED' };
  }
  const normalized = trimmed.replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return { ok: false, code: 'MALFORMED' };
  const value = Number(normalized);
  if (!Number.isFinite(value)) return { ok: false, code: 'MALFORMED' };
  if (value <= 0) return { ok: false, code: 'NON_POSITIVE' };
  if (value < 30 || value > 220) return { ok: false, code: 'OUT_OF_RANGE' };
  return { ok: true, valueCm: value };
}
