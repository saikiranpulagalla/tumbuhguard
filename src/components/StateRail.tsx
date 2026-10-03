import type { SessionState } from '../domain/session/state';

const steps: readonly SessionState[] = ['DRAFT','SETUP_VALID','ROUND1_OPEN','ROUND1_LOCKED','ROUND2_OPEN','ROUND2_LOCKED','REFERENCE_OPEN','REFERENCE_LOCKED','READY_TO_CALCULATE','RESULT_VALID','REMEDIATION','CLOSED'];

export function StateRail({ state }: { state: SessionState }) {
  const index = steps.indexOf(state);
  return <ol className="state-rail" aria-label="protocol progress">
    {steps.map((step, i) => <li key={step} className={i < index ? 'done' : i === index ? 'current' : ''}>
      <span>{i + 1}</span><small>{step.replaceAll('_',' ')}</small>
    </li>)}
  </ol>;
}
