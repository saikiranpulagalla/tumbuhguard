import { expect, it } from 'vitest';
import { calculateSession } from '../../src/app/workflow';
import { fixtureMeasurements, createDemoSession } from '../../src/fixtures/demo';
import { evaluateProtocolValidity } from '../../src/domain/protocol/invariants';

function readySession() {
  const base = createDemoSession();
  const measurements = fixtureMeasurements(base, 'cadre-a-good');
  return { ...base, state: 'READY_TO_CALCULATE' as const, revision: measurements.length, measurements };
}

it('PV01 accepts matching positions for the active cohort', () => {
  expect(evaluateProtocolValidity(readySession())).toEqual({ valid: true, deviations: [] });
});

it('PV02-PV05 withholds the verdict for any trainee or reference round mismatch', () => {
  for (const measurementIndex of [0, 10, 20, 30]) {
    const session = readySession();
    const measurement = session.measurements[measurementIndex]!;
    const measurements = session.measurements.map((item, index) => index === measurementIndex ? { ...item, position: item.position === 'RECUMBENT' ? 'STANDING' as const : 'RECUMBENT' as const } : item);
    const result = calculateSession({ ...session, measurements }).result!;
    expect(result.protocolValidity.valid).toBe(false);
    expect(result.protocolValidity.deviations).toHaveLength(1);
    expect(result.precisionPass).toBe(true);
    expect(result.referencePass).toBe(true);
  }
});

it('PV06 preserves multiple deviations and ignores replaced-subject history', () => {
  const session = readySession();
  const first = session.measurements[0]!;
  const second = session.measurements[1]!;
  const mismatched = session.measurements.map((item, index) => index < 2 ? { ...item, position: item.position === 'RECUMBENT' ? 'STANDING' as const : 'RECUMBENT' as const } : item);
  expect(evaluateProtocolValidity({ ...session, measurements: mismatched }).deviations).toHaveLength(2);
  const inactive = { ...first, subjectId: session.subjects[0]!.id, position: first.position === 'RECUMBENT' ? 'STANDING' as const : 'RECUMBENT' as const };
  expect(evaluateProtocolValidity({ ...session, subjects: session.subjects.map((subject, index) => index === 0 ? { ...subject, status: 'REPLACED' as const } : subject), measurements: [...session.measurements, inactive] }).valid).toBe(true);
  void second;
});
