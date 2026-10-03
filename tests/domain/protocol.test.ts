import { describe, expect, it } from 'vitest';
import { evaluateStandardization, passesStrictThreshold } from '../../src/domain/protocol/evaluator';
import { WORKING_STANDARDIZATION_PROFILE, expectedPositionFor } from '../../src/domain/protocol/profile';
import { parseMeasurementInput } from '../../src/domain/schemas/measurement-input';

const pairsAtTem = (tem: number) => [{ subjectId: 's', first: 100, second: 100 - tem * Math.sqrt(2) }];

describe('strict threshold semantics', () => {
  it('does not round before comparison', () => {
    expect(passesStrictThreshold(0.599999,0.6)).toBe(true);
    expect(passesStrictThreshold(0.6,0.6)).toBe(false);
    expect(passesStrictThreshold(0.399999,0.4)).toBe(true);
    expect(passesStrictThreshold(0.4,0.4)).toBe(false);
    expect(passesStrictThreshold(0.59996,0.6)).toBe(true);
    expect((0.59996).toFixed(3)).toBe('0.600');
  });

  it('suppresses agreement when computed reference repeatability is clearly above the boundary', () => {
    const p = WORKING_STANDARDIZATION_PROFILE;
    const subjectMeans = [{ subjectId: 's', traineeMean: 100, referenceMean: 100 }];
    const fail = evaluateStandardization(p, {
      traineePairs: pairsAtTem(0.1), referencePairs: pairsAtTem(0.4001), subjectMeans, inputRevision: 7,
    });
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
