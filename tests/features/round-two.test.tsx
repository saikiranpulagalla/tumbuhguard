import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { RoundTwoPanel } from '../../src/features/round-two/RoundTwoPanel';

it('BL02-BL04 renders only the blinded Round-2 projection without Round-1 DOM or ARIA leakage', () => {
  const { container } = render(<RoundTwoPanel
    subjects={[{ subjectId: 'subject-01', subjectLabel: 'Synthetic Subject 01', stationId: 'station-01', stationLabel: 'Station 01', expectedPosition: 'RECUMBENT' }]}
    completedSubjectIds={[]}
    onRecordMeasurement={() => undefined}
    onLockRound={() => undefined}
  />);

  expect(screen.getByRole('heading', { name: 'Blinded repeat measurement' })).toBeVisible();
  expect(screen.getByLabelText('Synthetic Subject 01 measurement in centimetres')).toBeVisible();
  expect(screen.getByText('Round-1 values are intentionally unavailable in this entry workflow.')).toBeVisible();

  const serialized = container.innerHTML;
  expect(serialized).not.toContain('95.8');
  expect(serialized).not.toMatch(/previous|difference|reference/i);
  expect(container.querySelectorAll('[aria-label*="previous" i], [aria-label*="round 1" i], [aria-describedby*="round-1" i], [data-round1], [data-previous]')).toHaveLength(0);
});
