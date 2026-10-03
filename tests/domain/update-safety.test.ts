import { expect, it } from 'vitest';
import { canApplyServiceWorkerUpdate } from '../../src/app/update-policy';

it('defers service-worker reload through every active assessment state', () => {
  for (const state of ['SETUP_VALID','ROUND1_OPEN','ROUND1_LOCKED','ROUND2_OPEN','ROUND2_LOCKED','REFERENCE_OPEN','REFERENCE_LOCKED','READY_TO_CALCULATE','RESULT_VALID','REMEDIATION'] as const) {
    expect(canApplyServiceWorkerUpdate(false,state)).toBe(false);
  }
  expect(canApplyServiceWorkerUpdate(false,'DRAFT')).toBe(true);
  expect(canApplyServiceWorkerUpdate(false,'CLOSED')).toBe(true);
  expect(canApplyServiceWorkerUpdate(true,'ROUND2_OPEN')).toBe(false);
});
