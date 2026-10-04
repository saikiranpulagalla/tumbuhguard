import { DomainError } from '../errors';
import type { Observation, Session } from '../session/state';

/** The three competency observations required before a session can be calculated. */
export const REQUIRED_OBSERVATION_ITEMS = [
  'Correct positioning before reading',
  'Equipment/station check performed',
  'Reading recorded without prompting',
] as const;

const requiredItems = new Set<string>(REQUIRED_OBSERVATION_ITEMS);

export function isRequiredObservationItem(item: string): item is typeof REQUIRED_OBSERVATION_ITEMS[number] {
  return requiredItems.has(item);
}

/**
 * Required observations are collected by the trainee supervisor record.  Extra
 * observations remain allowed, but cannot substitute for this fixed set.
 */
export function assertObservationEvidence(session: Session, requireComplete: boolean): void {
  const ids = new Set<string>();
  const requiredSeen = new Set<string>();
  for (const observation of session.observations) {
    if (ids.has(observation.id)) throw new DomainError('PROTOCOL_INVALID', 'Observation IDs must be unique');
    ids.add(observation.id);
    if (observation.measurerId !== session.trainee.id && observation.measurerId !== session.reference.id) {
      throw new DomainError('UNKNOWN_MEASURER', 'Observation references an unknown measurer');
    }
    if (isRequiredObservationItem(observation.item)) {
      if (observation.measurerId !== session.trainee.id) {
        throw new DomainError('PROTOCOL_INVALID', 'Required observation must be recorded for the trainee');
      }
      if (requiredSeen.has(observation.item)) {
        throw new DomainError('PROTOCOL_INVALID', 'Required observation may be recorded only once');
      }
      requiredSeen.add(observation.item);
    }
  }
  if (requireComplete && REQUIRED_OBSERVATION_ITEMS.some(item => !requiredSeen.has(item))) {
    throw new DomainError('PROTOCOL_INVALID', 'All required observation evidence must be recorded before calculation');
  }
}

export function hasCompleteRequiredObservationEvidence(session: Session): boolean {
  try {
    assertObservationEvidence(session, true);
    return true;
  } catch {
    return false;
  }
}

export function assertObservationCanBeAdded(session: Session, observation: Observation): void {
  assertObservationEvidence({ ...session, observations: [...session.observations, observation] }, false);
}
