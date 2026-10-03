import { expect, it } from 'vitest';
import { transition } from '../../src/domain/session/transition';
import { createDemoSession } from '../../src/fixtures/demo';

it('rejects locking an incomplete measurement round at the domain boundary', () => {
  const draft = createDemoSession();
  const setup = transition(draft, { type:'VALIDATE_SETUP' });
  const open = transition(setup, { type:'OPEN_ROUND_1' });
  expect(() => transition(open, { type:'LOCK_ROUND_1' })).toThrow(/INCOMPLETE_ROUND/);
});
