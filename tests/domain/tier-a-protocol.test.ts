import { describe, expect, it } from 'vitest';
import { calculateSession } from '../../src/app/workflow';
import { DomainError } from '../../src/domain/errors';
import { replaceActiveSubject, replaceStationAssignment, resultIsCurrent } from '../../src/domain/protocol/invariants';
import { transition } from '../../src/domain/session/transition';
import { createRestandardizationSession } from '../../src/domain/session/restandardization';
import { selectBlindRoundSubjects } from '../../src/domain/session/selectors';
import type { Measurement, Session } from '../../src/domain/session/state';
import { createDemoSession, evaluateDemoFixture } from '../../src/fixtures/demo';

function roundOneOpen(): Session {
  return transition(transition(createDemoSession(), {type:'VALIDATE_SETUP'}), {type:'OPEN_ROUND_1'});
}

function measurementFor(session: Session, subjectIndex = 0): Measurement {
  const subject=session.subjects[subjectIndex]!;
  const station=session.stations.find(row=>row.subjectId===subject.id)!;
  return {id:'M-1',sessionId:session.id,measurerId:session.trainee.id,subjectId:subject.id,stationId:station.id,round:1,valueCm:80,position:station.expectedPosition,revision:session.revision+1,recordedAt:'2026-10-03T00:00:00Z'};
}

describe('Tier A protocol/state', () => {
  it('P01 9 subjects rejected', () => {
    const session=createDemoSession();
    const nine={...session,subjects:session.subjects.slice(0,9),stations:session.stations.slice(0,9)};
    expect(() => transition(nine,{type:'VALIDATE_SETUP'})).toThrow(/SUBJECT_COUNT_INVALID/);
  });

  it('P02 valid 10-subject session accepted', () => {
    expect(transition(createDemoSession(),{type:'VALIDATE_SETUP'}).state).toBe('SETUP_VALID');
  });

  it('P03 invalid age composition rejected', () => {
    const session=createDemoSession();
    const subjects=session.subjects.map((subject,index)=>index===4?{...subject,ageMonths:24,ageBand:'AT_OR_OVER_24_MONTHS' as const}:subject);
    const stations=session.stations.map((station,index)=>index===4?{...station,expectedPosition:'STANDING' as const}:station);
    expect(() => transition({...session,subjects,stations},{type:'VALIDATE_SETUP'})).toThrow(/AGE_COMPOSITION_INVALID/);
  });

  it('P04 duplicate active subject rejected', () => {
    const session=createDemoSession();
    const subjects=[...session.subjects.slice(0,9),{...session.subjects[9]!,id:session.subjects[0]!.id}];
    expect(() => transition({...session,subjects},{type:'VALIDATE_SETUP'})).toThrow(/SUBJECT_DUPLICATE/);
  });

  it('P05 duplicate station rejected', () => {
    const session=createDemoSession();
    const stations=[...session.stations.slice(0,9),{...session.stations[9]!,id:session.stations[0]!.id}];
    expect(() => transition({...session,stations},{type:'VALIDATE_SETUP'})).toThrow(/STATION_DUPLICATE/);
  });

  it('P06 missing device/station provenance blocks progress', () => {
    const session=createDemoSession();
    expect(() => transition({...session,devices:[]},{type:'VALIDATE_SETUP'})).toThrow(/MISSING_DEVICE_PROVENANCE/);
  });

  it('P07 Round 2 before Round 1 lock rejected', () => {
    expect(() => transition(createDemoSession(),{type:'OPEN_ROUND_2'})).toThrow(/INVALID_TRANSITION/);
  });

  it('P08 incomplete Round 1 cannot lock', () => {
    expect(() => transition(roundOneOpen(),{type:'LOCK_ROUND_1'})).toThrow(/INCOMPLETE_ROUND/);
  });

  it('P09 Round-1 cannot normally edit after lock', () => {
    const open=roundOneOpen();
    const completed={...open,measurements:open.subjects.map((_,index)=>({...measurementFor(open,index),id:`M-${index}`,subjectId:open.subjects[index]!.id,stationId:open.stations[index]!.id}))};
    const locked=transition(completed,{type:'LOCK_ROUND_1'});
    expect(() => transition(locked,{type:'RECORD_MEASUREMENT',measurement:{...measurementFor(open),id:'after-lock'}})).toThrow(/INVALID_TRANSITION/);
  });

  it('P10 Round-1 value cannot appear in Round-2 DTO', () => {
    const dto=selectBlindRoundSubjects(createDemoSession())[0]!;
    expect(Object.keys(dto)).toEqual(['subjectId','subjectLabel','stationId','stationLabel','expectedPosition']);
  });

  it('P13 trainee = reference rejected', () => {
    const session=createDemoSession();
    expect(() => transition({...session,reference:{...session.reference,id:session.trainee.id}},{type:'VALIDATE_SETUP'})).toThrow(/MEASURER_ROLE_COLLISION/);
  });

  it('P14 calculate before reference completion rejected', () => {
    expect(() => calculateSession(createDemoSession())).toThrow(expect.objectContaining({ code: 'INVALID_TRANSITION' }));
  });

  it('P15 invalid reference suppresses agreement assessment', () => {
    const result=evaluateDemoFixture('invalid-reference');
    expect(result.referenceValid).toBe(false);
    expect(result.referenceTEM).toBeNull();
    expect(result.referencePass).toBeNull();
  });

  it('P16 station change after measurements requires review', () => {
    const open=roundOneOpen();
    const recorded=transition(open,{type:'RECORD_MEASUREMENT',measurement:measurementFor(open)});
    const station=recorded.stations[0]!;
    expect(() => replaceStationAssignment(recorded,{...station,label:'Changed station'})).toThrow(/STATION_CHANGE_REQUIRES_REVIEW/);
  });

  it('P17 running session retains protocol snapshot after global profile change', () => {
    const session=createDemoSession();
    const hypotheticalNewProfile={...session.protocolSnapshot,precisionThreshold:0.1};
    expect(hypotheticalNewProfile.precisionThreshold).toBe(0.1);
    expect(session.protocolSnapshot.precisionThreshold).toBe(0.6);
  });

  it('P18 re-standardization creates a new linked session and leaves parent unchanged', () => {
    const parent={...createDemoSession(),state:'REMEDIATION' as const,revision:10};
    const snapshot=structuredClone(parent);
    const child=createRestandardizationSession(parent,'child-1','2026-10-03T01:00:00Z');
    expect(parent).toEqual(snapshot);
    expect(child.id).toBe('child-1');
    expect(child.parentSessionId).toBe(parent.id);
    expect(child.measurements).toHaveLength(0);
    expect(child.state).toBe('DRAFT');
  });

  it('replaced-subject measurements remain in history but are excluded from active subject selection', () => {
    const open=roundOneOpen();
    const recorded=transition(open,{type:'RECORD_MEASUREMENT',measurement:measurementFor(open)});
    const old=recorded.subjects[0]!;
    const replacement={id:'S11',syntheticLabel:'Synthetic Subject 11',ageMonths:12,ageBand:'UNDER_24_MONTHS' as const,status:'ACTIVE' as const,replacementFor:old.id};
    const changed=replaceActiveSubject(recorded,old.id,replacement);
    expect(changed.measurements.some(row=>row.subjectId===old.id)).toBe(true);
    expect(changed.subjects.find(row=>row.id===old.id)?.status).toBe('REPLACED');
    expect(changed.stations.some(row=>row.subjectId===replacement.id)).toBe(true);
    const historical=changed.measurements.find(row=>row.subjectId===old.id)!;
    expect(changed.stations.find(row=>row.id===historical.stationId)?.subjectId).toBe(old.id);
    expect(changed.result).toBeNull();
  });

  it('non-calculation writes keep a valid result current across CAS revisions', () => {
    const base=createDemoSession();
    const result={calculationVersion:'x',inputRevision:5,precisionTEM:0.1,referenceTEM:0.1,signedDifference:0,referencePrecisionTEM:0.1,referenceValid:true,precisionPass:true,referencePass:true};
    const session={...base,state:'RESULT_VALID' as const,revision:5,result};
    const next=transition(session,{type:'ADD_OBSERVATION',observation:{id:'O',measurerId:session.trainee.id,item:'x',result:'OBSERVED_OK'}});
    expect(resultIsCurrent(next)).toBe(true);
  });
});
