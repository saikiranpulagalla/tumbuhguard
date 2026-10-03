import { describe, expect, it } from 'vitest';
import { evaluateStandardization } from '../../src/domain/protocol/evaluator';
import { WORKING_STANDARDIZATION_PROFILE, expectedPositionFor } from '../../src/domain/protocol/profile';
import { parseMeasurementInput } from '../../src/domain/schemas/measurement-input';

const pairsAtTem = (tem: number) => [{ subjectId: 's', first: 100, second: 100 - tem * Math.sqrt(2) }];

describe('strict threshold semantics', () => {
  it('does not round before comparison', () => {
    const p = WORKING_STANDARDIZATION_PROFILE;
    const subjectMeans = [{ subjectId: 's', traineeMean: 100, referenceMean: 100 }];
    const pass = evaluateStandardization(p, {
      traineePairs: pairsAtTem(0.599999), referencePairs: pairsAtTem(0.399999), subjectMeans, inputRevision: 7,
    });
    expect(pass.precisionPass).toBe(true);
    expect(pass.referenceValid).toBe(true);
    const fail = evaluateStandardization(p, {
      traineePairs: pairsAtTem(0.6), referencePairs: pairsAtTem(0.4), subjectMeans, inputRevision: 7,
    });
    expect(fail.precisionPass).toBe(false);
    expect(fail.referenceValid).toBe(false);
    expect(fail.referencePass).toBeNull();
    expect(fail.referenceTEM).toBeNull();
  });
});

describe('input parser', () => {
  it.each([['80', 80], ['80.2', 80.2], ['80,2', 80.2]])('accepts %s', (raw, expected) => {
    expect(parseMeasurementInput(raw)).toEqual({ ok: true, valueCm: expected });
  });
  it.each(['', '0', '-1', 'NaN', 'Infinity', '80,2,3', '80,2.3', 'abc'])('rejects %s', raw => {
    expect(parseMeasurementInput(raw).ok).toBe(false);
  });
});

describe('age/position', () => {
  it('tests exact 24-month boundary', () => {
    expect(expectedPositionFor(23)).toBe('RECUMBENT');
    expect(expectedPositionFor(24)).toBe('STANDING');
  });
});
