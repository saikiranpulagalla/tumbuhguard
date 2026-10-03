import { describe, expect, it } from 'vitest';
import { parseMeasurementInput } from '../../src/domain/schemas/measurement-input';

describe('hostile measurement-input corpus', () => {
  it.each([
    ['80', 80], ['80.0', 80], ['80.2', 80.2], ['80,2', 80.2], ['080.2', 80.2], [' 80.2 ', 80.2],
  ])('accepts the full supported form %j', (raw, valueCm) => {
    expect(parseMeasurementInput(raw)).toEqual({ ok: true, valueCm });
  });

  it.each([
    ['80.', 'MALFORMED'], ['.2', 'MALFORMED'], ['0.2', 'OUT_OF_RANGE'], ['0', 'NON_POSITIVE'],
    ['-0', 'MALFORMED'], ['-1', 'MALFORMED'], ['+80.2', 'MALFORMED'], ['NaN', 'MALFORMED'],
    ['Infinity', 'MALFORMED'], ['1e2', 'MALFORMED'], ['8e1', 'MALFORMED'], ['80,2,3', 'MALFORMED'],
    ['80.2.3', 'MALFORMED'], ['80abc', 'MALFORMED'], ['80.2cm', 'MALFORMED'], ['80,2cm', 'MALFORMED'],
    ['abc', 'MALFORMED'], ['', 'EMPTY'], [' ', 'EMPTY'],
  ] as const)('rejects hostile input %j without partial parsing', (raw, code) => {
    expect(parseMeasurementInput(raw)).toEqual({ ok: false, code });
  });
});
