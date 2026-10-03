import { describe, expect, it } from 'vitest';
import { selectBlindRoundSubjects } from '../../src/domain/session/selectors';
import type { Session } from '../../src/domain/session/state';
import { WORKING_STANDARDIZATION_PROFILE } from '../../src/domain/protocol/profile';

it('round-2 DTO contains no prior values or verdicts', () => {
  const now = new Date().toISOString();
  const session: Session = {
    id:'x', protocolSnapshot:{...WORKING_STANDARDIZATION_PROFILE, requiredSubjectCount:1}, protocolHash:'h', protocolVersion:'v',
    state:'ROUND2_OPEN', revision:1, createdAt:now, updatedAt:now, dataMode:'SYNTHETIC',
    trainee:{id:'t',label:'Trainee',role:'TRAINEE'}, reference:{id:'r',label:'Reference',role:'REFERENCE'},
    subjects:[{id:'s',syntheticLabel:'Subject 01',ageMonths:12,ageBand:'UNDER_24_MONTHS',status:'ACTIVE'}],
    devices:[{id:'d',label:'Length board',type:'LENGTH_BOARD'}],
    stations:[{id:'st',label:'Station 01',subjectId:'s',deviceId:'d',expectedPosition:'RECUMBENT'}],
    measurements:[{id:'m1',sessionId:'x',measurerId:'t',subjectId:'s',stationId:'st',round:1,valueCm:80,position:'RECUMBENT',revision:1,recordedAt:now}],
    observations:[], remediationNotes:[], result:null,
  };
  const dto = selectBlindRoundSubjects(session)[0]!;
  expect(dto).toEqual({subjectId:'s',subjectLabel:'Subject 01',stationId:'st',stationLabel:'Station 01',expectedPosition:'RECUMBENT'});
  expect(Object.keys(dto)).not.toContain('round1Value');
  expect(JSON.stringify(dto)).not.toContain('80');
});
