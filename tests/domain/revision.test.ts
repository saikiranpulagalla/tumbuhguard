import { describe, expect, it } from 'vitest';
import { resultIsCurrent } from '../../src/domain/protocol/invariants';
import type { Session } from '../../src/domain/session/state';

it('marks mismatched result revision stale', () => {
  const session = { revision: 15, result: { inputRevision: 14 } } as unknown as Session;
  expect(resultIsCurrent(session)).toBe(false);
});
