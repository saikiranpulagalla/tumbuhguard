import { describe, expect, it } from 'vitest';
import { DomainError } from '../../src/domain/errors';
import { transition } from '../../src/domain/session/transition';
import { REQUIRED_OBSERVATION_ITEMS } from '../../src/domain/evidence/required-observations';
import { createDemoSession, fixtureMeasurements } from '../../src/fixtures/demo';

function referenceLocked() {
  const base = createDemoSession();
  return {
    ...base,
    state: 'REFERENCE_LOCKED' as const,
    revision: 40,
    measurements: fixtureMeasurements(base, 'cadre-a-good'),
  };
}

function observation(item: string, id = item, measurerId = 'trainee-a') {
  return { id, measurerId, item, result: 'OBSERVED_OK' as const };
}

describe('required observation evidence', () => {
  it('rejects arbitrary or duplicate observations as substitutes for the canonical evidence', () => {
    const base = referenceLocked();
    const arbitrary = { ...base, observations: ['a', 'b', 'c'].map(id => observation('other item', id)) };
    const duplicate = { ...base, observations: ['a', 'b', 'c'].map(id => observation(REQUIRED_OBSERVATION_ITEMS[0], id)) };
    expect(() => transition(arbitrary, { type: 'MARK_READY' })).toThrow(DomainError);
    expect(() => transition(duplicate, { type: 'MARK_READY' })).toThrow(DomainError);
  });

  it('requires the trainee record for every canonical item and locks evidence after readiness', () => {
    const base = referenceLocked();
    const wrongMeasurer = {
      ...base,
      observations: REQUIRED_OBSERVATION_ITEMS.map((item, index) => observation(item, `o-${index}`, index === 0 ? base.reference.id : base.trainee.id)),
    };
    expect(() => transition(wrongMeasurer, { type: 'MARK_READY' })).toThrow(DomainError);

    const complete = {
      ...base,
      observations: REQUIRED_OBSERVATION_ITEMS.map((item, index) => observation(item, `o-${index}`)),
    };
    const ready = transition(complete, { type: 'MARK_READY' });
    expect(ready.state).toBe('READY_TO_CALCULATE');
    expect(() => transition(ready, { type: 'ADD_OBSERVATION', observation: observation('later', 'later') })).toThrow(/INVALID_TRANSITION/);
  });
});
