import { describe, expect, it } from 'vitest';
import { referenceAgreementTEM, repeatabilityTEM, signedMeanDifference } from '../../src/domain/calculation';

describe('repeatability TEM', () => {
  it('matches constant 0.2 cm difference oracle', () => {
    const tem = repeatabilityTEM([
      { subjectId: 'a', first: 80.0, second: 79.8 },
      { subjectId: 'b', first: 90.0, second: 89.8 },
    ]);
    expect(tem).toBeCloseTo(0.1414213562, 9);
  });

  it('returns zero for identical pairs', () => {
    expect(repeatabilityTEM([{ subjectId: 'a', first: 80, second: 80 }])).toBe(0);
  });

  it('rejects duplicate subject IDs', () => {
    expect(() => repeatabilityTEM([
      { subjectId: 'a', first: 80, second: 80.1 },
      { subjectId: 'a', first: 81, second: 81.1 },
    ])).toThrow(/Duplicate subjectId/);
  });
});

describe('agreement and signed difference', () => {
  it('proves zero signed bias does not imply agreement', () => {
    const rows = [
      { subjectId: 'a', traineeMean: 81, referenceMean: 80 },
      { subjectId: 'b', traineeMean: 79, referenceMean: 80 },
    ];
    expect(signedMeanDifference(rows)).toBe(0);
    expect(referenceAgreementTEM(rows)).toBeCloseTo(Math.sqrt(0.5), 12);
  });
});
