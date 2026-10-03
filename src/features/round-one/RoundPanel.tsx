import { useMemo, useState } from 'react';
import { parseMeasurementInput } from '../../domain/schemas/measurement-input';
import type { MeasurementPosition } from '../../domain/protocol/profile';
import type { BlindRoundSubjectDTO, Session } from '../../domain/session/state';

interface EntryRow { subjectId: string; subjectLabel: string; stationId: string; stationLabel: string; expectedPosition: MeasurementPosition; }

const errorMessage: Record<string,string> = {
  EMPTY:'Measurement is required.', MALFORMED:'Enter a valid decimal value.', NON_POSITIVE:'Measurement must be greater than zero.', OUT_OF_RANGE:'Enter a realistic length/height between 30 and 220 cm.',
};

export function RoundPanel({ session, round, rows, onRecord, onLock, blinded = false }: {
  session: Session; round: 1|2; rows: readonly EntryRow[] | readonly BlindRoundSubjectDTO[];
  onRecord: (subjectId: string, stationId: string, valueCm: number, position: MeasurementPosition) => void;
  onLock: () => void; blinded?: boolean;
}) {
  const existing = useMemo(() => session.measurements.filter(m => m.measurerId === session.trainee.id && m.round === round && session.subjects.some(s=>s.id===m.subjectId&&s.status==='ACTIVE')), [session, round]);
  const [drafts, setDrafts] = useState<Record<string,string>>({});
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [positions, setPositions] = useState<Record<string,MeasurementPosition>>({});
  const submit = (row: EntryRow) => {
    const parsed = parseMeasurementInput(drafts[row.subjectId] ?? '');
    if (!parsed.ok) { setErrors(e => ({...e,[row.subjectId]:errorMessage[parsed.code]??parsed.code})); return; }
    onRecord(row.subjectId, row.stationId, parsed.valueCm, positions[row.subjectId] ?? row.expectedPosition);
    setErrors(e => ({...e,[row.subjectId]:''}));
  };
  return <section className="panel" aria-labelledby={`round-${round}-title`}>
    <div className="panel-heading"><div><span className="kicker">Screen {round===1?'3':'4'} · Trainee · Round {round}</span><h2 id={`round-${round}-title`}>{blinded ? 'Blinded repeat measurement' : 'First measurement round'}</h2></div><span className="count" aria-live="polite">{existing.length}/{rows.length} recorded</span></div>
    {blinded && <div className="blind-banner"><strong>Blinded repeat measurement</strong><span>Round-1 values are intentionally unavailable in this entry workflow.</span></div>}
    <div className="entry-table">
      {rows.map(row => {
        const done = existing.some(m => m.subjectId === row.subjectId);
        const errorId=`measurement-error-${round}-${row.subjectId}`;
        const inputId=`measurement-${round}-${row.subjectId}`;
        return <div className={`entry-row ${done?'recorded':''}`} key={row.subjectId}>
          <div><strong>{row.subjectLabel}</strong><small>{row.stationLabel} · {row.expectedPosition}</small></div>
          {done ? <span className="recorded-label">Recorded</span> : <>
            <label className="position-control"><span>Actual position</span><select aria-label={`${row.subjectLabel} actual position`} value={positions[row.subjectId] ?? row.expectedPosition} onChange={e=>setPositions(current=>({...current,[row.subjectId]:e.target.value as MeasurementPosition}))}><option value="RECUMBENT">RECUMBENT</option><option value="STANDING">STANDING</option></select></label>
            <label htmlFor={inputId}><span className="sr-only">{row.subjectLabel} measurement in centimetres</span><input id={inputId} inputMode="decimal" autoComplete="off" placeholder="cm" aria-invalid={Boolean(errors[row.subjectId])} aria-describedby={errors[row.subjectId]?errorId:undefined} value={drafts[row.subjectId] ?? ''} onChange={e => setDrafts(d => ({...d,[row.subjectId]:e.target.value}))}/></label>
            <button onClick={() => submit(row as EntryRow)}>Record</button>
          </>}
          {errors[row.subjectId] && <small id={errorId} className="error" role="alert">{errors[row.subjectId]}</small>}
        </div>;
      })}
    </div>
    <div className="sticky-action"><button className="primary" disabled={existing.length !== rows.length} onClick={onLock}>Lock Round {round}</button></div>
  </section>;
}
