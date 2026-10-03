import { describe, expect, it } from 'vitest';
import { CalculationInputError, referenceAgreementTEM, repeatabilityTEM, signedMeanDifference } from '../../src/domain/calculation';
import { evaluateStandardization, passesStrictThreshold } from '../../src/domain/protocol/evaluator';
import { WORKING_STANDARDIZATION_PROFILE } from '../../src/domain/protocol/profile';
import { evaluateDemoFixture } from '../../src/fixtures/demo';

const pairForTem = (subjectId: string, tem: number) => ({ subjectId, first: 100, second: 100 - tem * Math.sqrt(2) });
const meansForAgreementTem = (tem: number) => [{ subjectId: 'S01', traineeMean: 100 + tem * Math.sqrt(2), referenceMean: 100 }];
const validReferencePair = pairForTem('S01', 0.1);

describe('Tier A mathematics', () => {
  it('M01 identical repeats -> TEM 0', () => {
    expect(repeatabilityTEM([{ subjectId:'S01', first:80, second:80 }])).toBe(0);
  });

  it('M02 constant 0.2 difference -> TEM ~= 0.141421', () => {
    expect(repeatabilityTEM([
      {subjectId:'S01',first:80,second:79.8},
      {subjectId:'S02',first:90,second:89.8},
    ])).toBeCloseTo(0.141421356237, 10);
  });

  it.skip('M03 authoritative golden fixture A — EXTERNAL_ORACLE_PARITY_PENDING', () => {});
  it.skip('M04 authoritative golden fixture B — EXTERNAL_ORACLE_PARITY_PENDING', () => {});

  it('M05 0.599999 repeatability passes', () => {
    expect(passesStrictThreshold(0.599999,0.6)).toBe(true);
  });

  it('M06 0.600000 repeatability fails', () => {
    expect(passesStrictThreshold(0.600000,0.6)).toBe(false);
  });

  it('M07 0.799999 reference agreement passes', () => {
    expect(passesStrictThreshold(0.799999,0.8)).toBe(true);
  });

  it('M08 0.800000 reference agreement fails', () => {
    expect(passesStrictThreshold(0.800000,0.8)).toBe(false);
  });

  it('M09 reference 0.399999 is valid', () => {
    expect(passesStrictThreshold(0.399999,0.4)).toBe(true);
  });

  it('M10 reference 0.400000 is invalid', () => {
    expect(passesStrictThreshold(0.400000,0.4)).toBe(false);
  });

  it('M11 cancellation does not hide disagreement', () => {
    const rows=[
      {subjectId:'S01',traineeMean:81,referenceMean:80},
      {subjectId:'S02',traineeMean:79,referenceMean:80},
    ];
    expect(signedMeanDifference(rows)).toBe(0);
    expect(referenceAgreementTEM(rows)).toBeCloseTo(Math.sqrt(0.5), 12);
  });

  it('M12 systematic shift -> excellent repeatability but poor reference agreement', () => {
    const result = evaluateDemoFixture('cadre-c-systematic-low');
    expect(result.precisionPass).toBe(true);
    expect(result.referencePass).toBe(false);
  });

  it('M13 raw TEM 0.59996 displays 0.600 but still passes', () => {
    const raw=0.59996;
    expect(raw.toFixed(3)).toBe('0.600');
    expect(passesStrictThreshold(raw,0.6)).toBe(true);
  });

  it('M14 subject input order does not affect ID-paired TEM', () => {
    const a=[{subjectId:'S01',first:80,second:80.2},{subjectId:'S02',first:90,second:89.7}];
    expect(repeatabilityTEM(a)).toBeCloseTo(repeatabilityTEM([...a].reverse()), 14);
  });

  it('M15 duplicate subject ID is rejected', () => {
    expect(() => repeatabilityTEM([{subjectId:'S01',first:80,second:80.1},{subjectId:'S01',first:81,second:81.1}])).toThrow(CalculationInputError);
  });

  it('M16 empty input produces typed failure', () => {
    expect(() => repeatabilityTEM([])).toThrow(CalculationInputError);
  });
});
