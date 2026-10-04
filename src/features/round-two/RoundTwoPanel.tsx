import { useState } from 'react';
import { parseMeasurementInput } from '../../domain/schemas/measurement-input';
import type { MeasurementPosition } from '../../domain/protocol/profile';
import type { BlindRoundSubjectDTO } from '../../domain/session/state';

export interface RoundTwoMeasurementInput {
  readonly subjectId: string;
  readonly stationId: string;
  readonly valueCm: number;
  readonly position: MeasurementPosition;
}

export interface RoundTwoScreenProps {
  readonly subjects: readonly BlindRoundSubjectDTO[];
  readonly completedSubjectIds: readonly string[];
  readonly onRecordMeasurement: (input: RoundTwoMeasurementInput) => void;
  readonly onLockRound: () => void;
}

const errorMessage: Record<string, string> = {
  EMPTY: 'Measurement is required.',
  MALFORMED: 'Enter a valid decimal value.',
  NON_POSITIVE: 'Measurement must be greater than zero.',
  OUT_OF_RANGE: 'Enter a realistic length/height between 30 and 220 cm.',
};

/**
 * The Round-2 presentation boundary deliberately accepts only blinded station
 * data and completion IDs. Session and measurement records stay in App, so a
 * future display change cannot read Round-1 values through component props.
 */
export function RoundTwoPanel({ subjects, completedSubjectIds, onRecordMeasurement, onLockRound }: RoundTwoScreenProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [positions, setPositions] = useState<Record<string, MeasurementPosition>>({});
  const completed = new Set(completedSubjectIds);

  const submit = (subject: BlindRoundSubjectDTO) => {
    const parsed = parseMeasurementInput(drafts[subject.subjectId] ?? '');
    if (!parsed.ok) {
      setErrors(current => ({ ...current, [subject.subjectId]: errorMessage[parsed.code] ?? parsed.code }));
      return;
    }
    onRecordMeasurement({
      subjectId: subject.subjectId,
      stationId: subject.stationId,
      valueCm: parsed.valueCm,
      position: positions[subject.subjectId] ?? subject.expectedPosition,
    });
    setErrors(current => ({ ...current, [subject.subjectId]: '' }));
  };

  return <section className="panel" aria-labelledby="round-2-title">
    <div className="panel-heading"><div><span className="kicker">Screen 4 · Trainee · Round 2</span><h2 id="round-2-title">Blinded repeat measurement</h2></div><span className="count" aria-live="polite">{completed.size}/{subjects.length} recorded</span></div>
    <div className="blind-banner"><strong>Blinded repeat measurement</strong><span>Round-1 values are intentionally unavailable in this entry workflow.</span></div>
    <div className="entry-table">
      {subjects.map(subject => {
        const done = completed.has(subject.subjectId);
        const errorId = `measurement-error-2-${subject.subjectId}`;
        const inputId = `measurement-2-${subject.subjectId}`;
        return <div className={`entry-row ${done ? 'recorded' : ''}`} key={subject.subjectId}>
          <div><strong>{subject.subjectLabel}</strong><small>{subject.stationLabel} · {subject.expectedPosition}</small></div>
          {done ? <span className="recorded-label">Recorded</span> : <>
            <label className="position-control"><span>Actual position</span><select aria-label={`${subject.subjectLabel} actual position`} value={positions[subject.subjectId] ?? subject.expectedPosition} onChange={event => setPositions(current => ({ ...current, [subject.subjectId]: event.target.value as MeasurementPosition }))}><option value="RECUMBENT">RECUMBENT</option><option value="STANDING">STANDING</option></select></label>
            <label htmlFor={inputId}><span className="sr-only">{subject.subjectLabel} measurement in centimetres</span><input id={inputId} inputMode="decimal" autoComplete="off" placeholder="cm" aria-invalid={Boolean(errors[subject.subjectId])} aria-describedby={errors[subject.subjectId] ? errorId : undefined} value={drafts[subject.subjectId] ?? ''} onChange={event => setDrafts(current => ({ ...current, [subject.subjectId]: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); submit(subject); } }} /></label>
            <button onClick={() => submit(subject)}>Record</button>
          </>}
          {errors[subject.subjectId] && <small id={errorId} className="error" role="alert">{errors[subject.subjectId]}</small>}
        </div>;
      })}
    </div>
    <div className="sticky-action"><button className="primary" disabled={completed.size !== subjects.length} onClick={onLockRound}>Lock Round 2</button></div>
  </section>;
}
