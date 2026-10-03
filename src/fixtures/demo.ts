import { evaluateStandardization } from '../domain/protocol/evaluator';
import { expectedPositionFor, WORKING_STANDARDIZATION_PROFILE, WORKING_STANDARDIZATION_PROFILE_HASH } from '../domain/protocol/profile';
import type { Measurement, Observation, Session, SessionResult, Subject } from '../domain/session/state';

export type DemoFixtureId = 'cadre-a-good' | 'cadre-b-cancellation' | 'cadre-c-systematic-low' | 'invalid-reference';

export interface DemoFixtureRow {
  readonly id: string;
  readonly ageMonths: number;
  readonly r1: number;
  readonly r2: number;
  readonly ref1: number;
  readonly ref2: number;
}

export interface DemoFixture {
  readonly fixtureId: DemoFixtureId;
  readonly synthetic: true;
  readonly label: string;
  readonly purpose: string;
  readonly trainee: { readonly id: string; readonly label: string };
  readonly rows: readonly DemoFixtureRow[];
}

const ages = [12, 15, 18, 21, 23, 25, 30, 36, 42, 48] as const;
const referenceBase = [74.2, 76.8, 79.5, 81.1, 83.7, 86.4, 89.2, 91.8, 94.1, 97.0] as const;
const oneDecimal = (value: number) => Math.round(value * 10) / 10;

function rowsFrom(generator: (base: number, index: number) => Omit<DemoFixtureRow, 'id' | 'ageMonths'>): readonly DemoFixtureRow[] {
  return ages.map((ageMonths, index) => {
    const row = generator(referenceBase[index]!, index);
    return {
      id: `S${String(index + 1).padStart(2, '0')}`,
      ageMonths,
      r1: oneDecimal(row.r1),
      r2: oneDecimal(row.r2),
      ref1: oneDecimal(row.ref1),
      ref2: oneDecimal(row.ref2),
    };
  });
}

export const DEMO_FIXTURES: Readonly<Record<DemoFixtureId, DemoFixture>> = Object.freeze({
  'cadre-a-good': {
    fixtureId: 'cadre-a-good', synthetic: true, label: 'Cadre A',
    purpose: 'Good repeatability and good qualified-reference agreement.',
    trainee: { id: 'trainee-a', label: 'Cadre A' },
    rows: rowsFrom(base => ({ r1: base, r2: base - 0.1, ref1: base, ref2: base - 0.1 })),
  },
  'cadre-b-cancellation': {
    fixtureId: 'cadre-b-cancellation', synthetic: true, label: 'Cadre B',
    purpose: 'Poor repeatability whose positive/negative repeated deviations cancel in the subject means.',
    trainee: { id: 'trainee-b', label: 'Cadre B' },
    rows: rowsFrom(base => ({ r1: base + 1.0, r2: base - 1.1, ref1: base, ref2: base - 0.1 })),
  },
  'cadre-c-systematic-low': {
    fixtureId: 'cadre-c-systematic-low', synthetic: true, label: 'Cadre C',
    purpose: 'Excellent repeatability with systematic disagreement against the qualified reference.',
    trainee: { id: 'trainee-c', label: 'Cadre C' },
    rows: [
      {id:'S01',ageMonths:12,r1:73.0,r2:72.9,ref1:74.2,ref2:74.1},
      {id:'S02',ageMonths:15,r1:75.6,r2:75.7,ref1:76.8,ref2:76.9},
      {id:'S03',ageMonths:18,r1:78.3,r2:78.2,ref1:79.5,ref2:79.4},
      {id:'S04',ageMonths:21,r1:79.9,r2:80.0,ref1:81.1,ref2:81.2},
      {id:'S05',ageMonths:23,r1:82.5,r2:82.4,ref1:83.7,ref2:83.6},
      {id:'S06',ageMonths:25,r1:85.2,r2:85.3,ref1:86.4,ref2:86.5},
      {id:'S07',ageMonths:30,r1:88.0,r2:87.9,ref1:89.2,ref2:89.1},
      {id:'S08',ageMonths:36,r1:90.6,r2:90.7,ref1:91.8,ref2:91.9},
      {id:'S09',ageMonths:42,r1:92.9,r2:92.8,ref1:94.1,ref2:94.0},
      {id:'S10',ageMonths:48,r1:95.8,r2:95.9,ref1:97.0,ref2:97.1},
    ],
  },
  'invalid-reference': {
    fixtureId: 'invalid-reference', synthetic: true, label: 'Invalid Reference',
    purpose: 'Reference-measurer repeatability fails; trainee/reference verdict must be suppressed.',
    trainee: { id: 'trainee-invalid-ref', label: 'Cadre D' },
    rows: rowsFrom(base => ({ r1: base, r2: base - 0.1, ref1: base + 0.5, ref2: base - 0.6 })),
  },
});

export const DEMO_SESSION_ID = 'demo-standardization-001';

export function fixtureById(id: DemoFixtureId): DemoFixture {
  return DEMO_FIXTURES[id];
}

export function createDemoSession(fixtureId: DemoFixtureId = 'cadre-a-good', id = fixtureId === 'cadre-a-good' ? DEMO_SESSION_ID : `demo-${fixtureId}`): Session {
  const fixture = fixtureById(fixtureId);
  const createdAt = '2026-10-03T00:00:00.000Z';
  const subjects: Subject[] = fixture.rows.map((row, index) => ({
    id: row.id,
    syntheticLabel: `Synthetic Subject ${String(index + 1).padStart(2, '0')}`,
    ageMonths: row.ageMonths,
    ageBand: row.ageMonths < 24 ? 'UNDER_24_MONTHS' : 'AT_OR_OVER_24_MONTHS',
    status: 'ACTIVE',
  }));
  return {
    id,
    protocolSnapshot: { ...WORKING_STANDARDIZATION_PROFILE },
    protocolHash: WORKING_STANDARDIZATION_PROFILE_HASH,
    protocolVersion: WORKING_STANDARDIZATION_PROFILE.version,
    state: 'DRAFT', revision: 0, createdAt, updatedAt: createdAt, dataMode: 'SYNTHETIC',
    trainee: { id: fixture.trainee.id, label: fixture.trainee.label, role: 'TRAINEE' },
    reference: { id: 'reference-01', label: 'Qualified Reference', role: 'REFERENCE' },
    subjects,
    devices: [{ id: 'device-01', label: 'Demo length/height board', type: 'LENGTH_HEIGHT_BOARD' }],
    stations: subjects.map((subject, index) => ({
      id: `station-${index + 1}`,
      label: `Station ${index + 1}`,
      subjectId: subject.id,
      deviceId: 'device-01',
      expectedPosition: expectedPositionFor(subject.ageMonths),
    })),
    measurements: [], observations: [], remediationNotes: [], result: null,
  };
}

export function fixtureMeasurements(session: Session, fixtureId: DemoFixtureId): readonly Measurement[] {
  const fixture = fixtureById(fixtureId);
  const out: Measurement[] = [];
  let revision = 1;
  fixture.rows.forEach(row => {
    const station = session.stations.find(item => item.subjectId === row.id);
    if (!station) throw new Error(`FIXTURE_STATION_MISSING:${row.id}`);
    const common = { sessionId: session.id, subjectId: row.id, stationId: station.id, position: station.expectedPosition } as const;
    out.push({ id:`${fixtureId}-t1-${row.id}`, ...common, measurerId:session.trainee.id, round:1, valueCm:row.r1, revision:revision++, recordedAt:'2026-10-03T00:01:00Z' });
    out.push({ id:`${fixtureId}-t2-${row.id}`, ...common, measurerId:session.trainee.id, round:2, valueCm:row.r2, revision:revision++, recordedAt:'2026-10-03T00:02:00Z' });
    out.push({ id:`${fixtureId}-r1-${row.id}`, ...common, measurerId:session.reference.id, round:1, valueCm:row.ref1, revision:revision++, recordedAt:'2026-10-03T00:03:00Z' });
    out.push({ id:`${fixtureId}-r2-${row.id}`, ...common, measurerId:session.reference.id, round:2, valueCm:row.ref2, revision:revision++, recordedAt:'2026-10-03T00:04:00Z' });
  });
  return out;
}

/** Backward-compatible alias used by earlier scripts/tests. */
export function demoMeasurements(session: Session): readonly Measurement[] {
  return fixtureMeasurements(session, 'cadre-a-good');
}

export function evaluateDemoFixture(fixtureId: DemoFixtureId): SessionResult {
  const session = createDemoSession(fixtureId);
  const measurements = fixtureMeasurements(session, fixtureId);
  const rows = fixtureById(fixtureId).rows;
  return evaluateStandardization(session.protocolSnapshot, {
    traineePairs: rows.map(row => ({ subjectId: row.id, first: row.r1, second: row.r2 })),
    referencePairs: rows.map(row => ({ subjectId: row.id, first: row.ref1, second: row.ref2 })),
    subjectMeans: rows.map(row => ({
      subjectId: row.id,
      traineeMean: (row.r1 + row.r2) / 2,
      referenceMean: (row.ref1 + row.ref2) / 2,
    })),
    inputRevision: measurements.length + 1,
  });
}

export function createCadreCFastDemoSession(): Session {
  const fixtureId: DemoFixtureId = 'cadre-c-systematic-low';
  const base = createDemoSession(fixtureId, 'demo-cadre-c-fast');
  const all = fixtureMeasurements(base, fixtureId);
  let demoRevision = 1;
  const roundOne = all.filter(m => m.measurerId === base.trainee.id && m.round === 1).map(m => ({ ...m, revision: demoRevision++ }));
  const roundTwoFirstNine = all.filter(m => m.measurerId === base.trainee.id && m.round === 2 && m.subjectId !== 'S10').map(m => ({ ...m, revision: demoRevision++ }));
  const observations: Observation[] = [
    { id:'demo-observation-1', measurerId:base.trainee.id, item:'Correct positioning before reading', result:'OBSERVED_OK', note:'Synthetic demo evidence' },
    { id:'demo-observation-2', measurerId:base.trainee.id, item:'Equipment/station check performed', result:'OBSERVED_OK', note:'Synthetic demo evidence' },
    { id:'demo-observation-3', measurerId:base.trainee.id, item:'Reading recorded without prompting', result:'OBSERVED_OK', note:'Synthetic demo evidence' },
  ];
  return {
    ...base,
    state: 'ROUND2_OPEN',
    revision: demoRevision + 6,
    updatedAt: '2026-10-03T00:02:30.000Z',
    measurements: [...roundOne, ...roundTwoFirstNine],
    observations,
  };
}

export function referenceFixtureMeasurements(session: Session, fixtureId: DemoFixtureId): readonly Measurement[] {
  return fixtureMeasurements(session, fixtureId).filter(measurement => measurement.measurerId === session.reference.id);
}
