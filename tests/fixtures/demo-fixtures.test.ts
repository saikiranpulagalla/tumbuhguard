import { describe, expect, it } from 'vitest';
import { createCadreCFastDemoSession, DEMO_FIXTURES, evaluateDemoFixture } from '../../src/fixtures/demo';

describe('deterministic demo fixtures', () => {
  it('marks every fixture synthetic and keeps exactly 10 subjects', () => {
    for (const fixture of Object.values(DEMO_FIXTURES)) {
      expect(fixture.synthetic).toBe(true);
      expect(fixture.rows).toHaveLength(10);
    }
  });

  it('Cadre A passes repeatability and qualified-reference agreement', () => {
    const result = evaluateDemoFixture('cadre-a-good');
    expect(result.precisionPass).toBe(true);
    expect(result.referenceValid).toBe(true);
    expect(result.referencePass).toBe(true);
  });

  it('Cadre B fails repeatability while signed mean difference cancels to zero', () => {
    const result = evaluateDemoFixture('cadre-b-cancellation');
    expect(result.precisionPass).toBe(false);
    expect(result.signedDifference).toBeCloseTo(0, 12);
  });

  it('Cadre C matches the locked systematic-low fixture', () => {
    const result = evaluateDemoFixture('cadre-c-systematic-low');
    expect(result.precisionTEM).toBeCloseTo(0.070710678, 8);
    expect(result.referenceTEM).toBeCloseTo(0.848528137, 8);
    expect(result.signedDifference).toBeCloseTo(-1.2, 8);
    expect(result.precisionPass).toBe(true);
    expect(result.referencePass).toBe(false);
  });

  it('invalid reference suppresses reference-agreement verdict and signed difference', () => {
    const result = evaluateDemoFixture('invalid-reference');
    expect(result.referenceValid).toBe(false);
    expect(result.referenceTEM).toBeNull();
    expect(result.referencePass).toBeNull();
    expect(result.signedDifference).toBeNull();
  });

  it('creates unique legal Round-2 demo instances without premature observations', () => {
    const first = createCadreCFastDemoSession();
    const second = createCadreCFastDemoSession();
    expect(first.id).not.toBe(second.id);
    expect(first.id).toMatch(/^demo-cadre-c-fast-/);
    expect(first.state).toBe('ROUND2_OPEN');
    expect(first.observations).toEqual([]);
  });
});
