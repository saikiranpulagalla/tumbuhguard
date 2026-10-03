import type { Observation, Session } from '../session/state';

export interface EvidenceSummary {
  readonly protocolDeviationCount: number;
  readonly needsReviewCount: number;
  readonly notObservedCount: number;
}

export function summarizeEvidence(session: Session): EvidenceSummary {
  const activeIds = new Set(session.subjects.filter(s => s.status === 'ACTIVE').map(s => s.id));
  let protocolDeviationCount = 0;
  for (const measurement of session.measurements) {
    if (!activeIds.has(measurement.subjectId)) continue;
    const station = session.stations.find(s => s.id === measurement.stationId);
    if (station && station.expectedPosition !== measurement.position) protocolDeviationCount++;
  }
  return {
    protocolDeviationCount,
    needsReviewCount: session.observations.filter(o => o.result === 'NEEDS_REVIEW').length,
    notObservedCount: session.observations.filter(o => o.result === 'NOT_OBSERVED').length,
  };
}

export function observation(id: string, measurerId: string, item: string, result: Observation['result'], note?: string): Observation {
  return note ? { id, measurerId, item, result, note } : { id, measurerId, item, result };
}
