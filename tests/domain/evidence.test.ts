import { expect, it } from 'vitest';
import { summarizeEvidence } from '../../src/domain/evidence/evidence';
import { deriveRemediation } from '../../src/domain/evidence/remediation';
import { transition } from '../../src/domain/session/transition';
import { createDemoSession } from '../../src/fixtures/demo';

it('flags recorded-position deviations as evidence without converting the measurement value', () => {
  const setup=transition(createDemoSession(),{type:'VALIDATE_SETUP'});
  const open=transition(setup,{type:'OPEN_ROUND_1'});
  const subject=open.subjects[0]!;
  const station=open.stations.find(row=>row.subjectId===subject.id)!;
  const recorded=transition(open,{type:'RECORD_MEASUREMENT',measurement:{
    id:'position-deviation',sessionId:open.id,measurerId:open.trainee.id,subjectId:subject.id,stationId:station.id,
    round:1,valueCm:73.0,position:station.expectedPosition==='RECUMBENT'?'STANDING':'RECUMBENT',revision:open.revision+1,recordedAt:'2026-10-03T00:00:00Z',
  }});
  expect(recorded.measurements[0]?.valueCm).toBe(73.0);
  expect(summarizeEvidence(recorded).protocolDeviationCount).toBe(1);
});

it('adds a neutral position-deviation review focus when a current result exists', () => {
  const base=createDemoSession();
  const station=base.stations[0]!;
  const session={...base,state:'RESULT_VALID' as const,revision:4,measurements:[{
    id:'position-deviation',sessionId:base.id,measurerId:base.trainee.id,subjectId:station.subjectId,stationId:station.id,
    round:1 as const,valueCm:73,position:station.expectedPosition==='RECUMBENT'?'STANDING' as const:'RECUMBENT' as const,revision:1,recordedAt:'2026-10-03T00:00:00Z',
  }],result:{calculationVersion:'test',inputRevision:4,precisionTEM:0.1,referenceTEM:0.1,signedDifference:0,referencePrecisionTEM:0.1,referenceValid:true,precisionPass:true,referencePass:true}};
  expect(deriveRemediation(session).some(item=>item.code==='POSITION_DEVIATION')).toBe(true);
});
