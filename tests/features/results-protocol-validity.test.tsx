import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ResultsPanel } from '../../src/features/results/ResultsPanel';
import { createDemoSession, evaluateDemoFixture, fixtureMeasurements } from '../../src/fixtures/demo';

it('withholds pass-like reference presentation when a protocol deviation invalidates the verdict', () => {
  const base = createDemoSession();
  const measurements = fixtureMeasurements(base, 'cadre-a-good');
  const deviating = { ...measurements[0]!, position: measurements[0]!.position === 'RECUMBENT' ? 'STANDING' as const : 'RECUMBENT' as const };
  const revision = measurements.length + 1;
  const result = {
    ...evaluateDemoFixture('cadre-a-good'),
    inputRevision: revision,
    protocolValidity: {
      valid: false as const,
      deviations: [{ code: 'POSITION_MISMATCH' as const, subjectId: deviating.subjectId, stationId: deviating.stationId, measurerId: deviating.measurerId, round: deviating.round, expectedPosition: measurements[0]!.position, actualPosition: deviating.position }],
    },
  };
  render(<ResultsPanel session={{ ...base, state: 'RESULT_VALID', revision, measurements: [deviating, ...measurements.slice(1)], observations: [
    { id: 'o1', measurerId: base.trainee.id, item: 'Correct positioning before reading', result: 'OBSERVED_OK' },
    { id: 'o2', measurerId: base.trainee.id, item: 'Equipment/station check performed', result: 'OBSERVED_OK' },
    { id: 'o3', measurerId: base.trainee.id, item: 'Reading recorded without prompting', result: 'OBSERVED_OK' },
  ], result }} onRemediate={() => undefined} onClose={() => undefined} />);

  expect(screen.getByText('Protocol deviation — verdict withheld.')).toBeVisible();
  expect(screen.getAllByText('QUANTITATIVE METRIC ONLY')).toHaveLength(3);
  expect(screen.queryByText('REFERENCE VALID')).not.toBeInTheDocument();
});
