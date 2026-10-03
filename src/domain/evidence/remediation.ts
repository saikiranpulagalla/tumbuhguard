import type { Session } from '../session/state';

export interface RemediationItem { readonly code: string; readonly text: string; }

export function deriveRemediation(session: Session): readonly RemediationItem[] {
  const result = session.result;
  if (!result) return [];
  const items: RemediationItem[] = [];
  if (!result.precisionPass) items.push({ code: 'REPEATABILITY', text: 'Review positioning, landmark alignment, reading technique, and repeat-measurement consistency.' });
  if (!result.referenceValid) items.push({ code: 'REFERENCE_VALIDITY', text: 'Repeat the standardization exercise with a reference measurer who meets the selected profile repeatability gate.' });
  else if (result.referencePass === false) items.push({ code: 'REFERENCE_AGREEMENT', text: 'Review systematic technique differences against the qualified reference measurer before re-standardization.' });
  if (session.observations.some(o => o.result === 'NEEDS_REVIEW')) items.push({ code: 'OBSERVED_SKILL', text: 'Address observed technique items marked for review.' });
  return items;
}
