import { describe, expect, it } from 'vitest';
import { transition } from '../../src/domain/session/transition';
import { parseMeasurementInput } from '../../src/domain/schemas/measurement-input';
import { createDemoSession } from '../../src/fixtures/demo';

describe('Tier A measurement input', () => {
  it.each([['80.2',80.2],['80,2',80.2]])('accepts/normalizes %s', (raw, expected) => {
    expect(parseMeasurementInput(raw)).toEqual({ok:true,valueCm:expected});
  });
  it.each(['','0','-1','NaN','Infinity','80,2,3'])('rejects %s', raw => {
    expect(parseMeasurementInput(raw).ok).toBe(false);
  });
  it('I09 unrealistic magnitude rejected', () => {
    expect(parseMeasurementInput('999')).toEqual({ok:false,code:'OUT_OF_RANGE'});
  });
  it('I10 double submit does not duplicate a measurement', () => {
    let session=transition(createDemoSession(),{type:'VALIDATE_SETUP'});
    session=transition(session,{type:'OPEN_ROUND_1'});
    const subject=session.subjects[0]!; const station=session.stations[0]!;
    const measurement={id:'M1',sessionId:session.id,measurerId:session.trainee.id,subjectId:subject.id,stationId:station.id,round:1 as const,valueCm:80.2,position:station.expectedPosition,revision:session.revision+1,recordedAt:'2026-10-03T00:00:00Z'};
    const once=transition(session,{type:'RECORD_MEASUREMENT',measurement});
    expect(() => transition(once,{type:'RECORD_MEASUREMENT',measurement:{...measurement,id:'M2'}})).toThrow(/DUPLICATE_MEASUREMENT/);
  });
});
