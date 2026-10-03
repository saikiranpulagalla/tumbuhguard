import { expect, it } from 'vitest';
import { calculateSession } from '../../src/app/workflow';
import { assertSessionShape } from '../../src/data/validation';
import { createDemoSession, fixtureMeasurements } from '../../src/fixtures/demo';

function calculated() {
  const base = createDemoSession('cadre-c-systematic-low');
  const measurements = fixtureMeasurements(base, 'cadre-c-systematic-low');
  return calculateSession({ ...base, state: 'READY_TO_CALCULATE', revision: measurements.length, measurements });
}

it('RI01 accepts a result derived from its source measurements', () => {
  expect(() => assertSessionShape(calculated())).not.toThrow();
});

it('RI02-RI08 rejects tampered derived values including protocol validity', () => {
  const session = calculated();
  for (const result of [
    { ...session.result!, precisionTEM: 0.2 }, { ...session.result!, referenceTEM: 0.2 },
    { ...session.result!, signedDifference: 0 }, { ...session.result!, precisionPass: false },
    { ...session.result!, referencePass: true }, { ...session.result!, referenceValid: false, referenceTEM: null, referencePass: null, signedDifference: null },
    { ...session.result!, protocolValidity: { valid: false as const, deviations: [] } },
  ]) expect(() => assertSessionShape({ ...session, result })).toThrow(expect.objectContaining({ code: 'RESULT_INTEGRITY_MISMATCH' }));
});

it('RI09-RI10 rejects a forged valid protocol result and a changed measurement', () => {
  const session = calculated();
  const first = session.measurements[0]!;
  const mismatch = { ...first, position: first.position === 'RECUMBENT' ? 'STANDING' as const : 'RECUMBENT' as const };
  expect(() => assertSessionShape({ ...session, measurements: [mismatch, ...session.measurements.slice(1)] })).toThrow(expect.objectContaining({ code: 'RESULT_INTEGRITY_MISMATCH' }));
  expect(() => assertSessionShape({ ...session, measurements: [{ ...first, valueCm: first.valueCm + 1 }, ...session.measurements.slice(1)] })).toThrow(expect.objectContaining({ code: 'RESULT_INTEGRITY_MISMATCH' }));
});
