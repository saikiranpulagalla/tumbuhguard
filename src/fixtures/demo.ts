import { expectedPositionFor, WORKING_STANDARDIZATION_PROFILE } from '../domain/protocol/profile';
import type { Measurement, Session, Subject } from '../domain/session/state';

const ages = [12, 15, 18, 21, 23, 25, 30, 36, 42, 48] as const;
const base = [74.2, 77.4, 80.1, 82.5, 84.0, 86.3, 91.2, 96.8, 101.4, 106.0] as const;

export const DEMO_SESSION_ID = 'demo-standardization-001';

export function createDemoSession(): Session {
  const createdAt = '2026-10-03T00:00:00.000Z';
  const subjects: Subject[] = ages.map((ageMonths, i) => ({
    id: `subject-${String(i + 1).padStart(2, '0')}`,
    syntheticLabel: `Synthetic Subject ${String(i + 1).padStart(2, '0')}`,
    ageMonths,
    ageBand: ageMonths < 24 ? 'UNDER_24_MONTHS' : 'AT_OR_OVER_24_MONTHS',
    status: 'ACTIVE',
  }));
  return {
    id: DEMO_SESSION_ID,
    protocolSnapshot: WORKING_STANDARDIZATION_PROFILE,
    protocolHash: '5ee2a1db6fcb1037767208907801b4d310dca53112086c5b9ac7a29f80fa7fd5',
    protocolVersion: WORKING_STANDARDIZATION_PROFILE.version,
    state: 'DRAFT', revision: 0, createdAt, updatedAt: createdAt, dataMode: 'SYNTHETIC',
    trainee: { id: 'trainee-01', label: 'Trainee A', role: 'TRAINEE' },
    reference: { id: 'reference-01', label: 'Qualified Reference', role: 'REFERENCE' },
    subjects,
    devices: [{ id: 'device-01', label: 'Demo length/height board', type: 'LENGTH_HEIGHT_BOARD' }],
    stations: subjects.map((s, i) => ({ id: `station-${i + 1}`, label: `Station ${i + 1}`, subjectId: s.id, deviceId: 'device-01', expectedPosition: expectedPositionFor(s.ageMonths) })),
    measurements: [], observations: [], result: null,
  };
}

export function demoMeasurements(session: Session): readonly Measurement[] {
  const out: Measurement[] = [];
  session.subjects.forEach((subject, i) => {
    const station = session.stations[i]!;
    const position = station.expectedPosition;
    const v = base[i]!;
    out.push({ id:`t1-${i}`,sessionId:session.id,measurerId:session.trainee.id,subjectId:subject.id,stationId:station.id,round:1,valueCm:v+0.1,position,revision:1,recordedAt:'2026-10-03T00:01:00Z' });
    out.push({ id:`t2-${i}`,sessionId:session.id,measurerId:session.trainee.id,subjectId:subject.id,stationId:station.id,round:2,valueCm:v-0.1,position,revision:2,recordedAt:'2026-10-03T00:02:00Z' });
    out.push({ id:`r1-${i}`,sessionId:session.id,measurerId:session.reference.id,subjectId:subject.id,stationId:station.id,round:1,valueCm:v+0.05,position,revision:3,recordedAt:'2026-10-03T00:03:00Z' });
    out.push({ id:`r2-${i}`,sessionId:session.id,measurerId:session.reference.id,subjectId:subject.id,stationId:station.id,round:2,valueCm:v-0.05,position,revision:4,recordedAt:'2026-10-03T00:04:00Z' });
  });
  return out;
}
