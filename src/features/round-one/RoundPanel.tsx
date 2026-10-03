import { useMemo, useState } from 'react';
import { parseMeasurementInput } from '../../domain/schemas/measurement-input';
import type { MeasurementPosition, } from '../../domain/protocol/profile';
import type { BlindRoundSubjectDTO, Session, Subject } from '../../domain/session/state';

interface EntryRow { subjectId: string; subjectLabel: string; stationId: string; stationLabel: string; expectedPosition: MeasurementPosition; }

export function RoundPanel({ session, round, rows, onRecord, onLock, blinded = false }: {
  session: Session; round: 1|2; rows: readonly EntryRow[] | readonly BlindRoundSubjectDTO[];
  onRecord: (subjectId: string, stationId: string, valueCm: number, position: MeasurementPosition) => void;
  onLock: () => void; blinded?: boolean;
}) {
  const existing = useMemo(() => session.measurements.filter(m => m.measurerId === session.trainee.id && m.round === round), [session, round]);
  const [drafts, setDrafts] = useState<Record<string,string>>({});
  const [errors, setErrors] = useState<Record<string,string>>({});
  const submit = (row: EntryRow) => {
    const parsed = parseMeasurementInput(drafts[row.subjectId] ?? '');
    if (!parsed.ok) { setErrors(e => ({...e,[row.subjectId]:parsed.code})); return; }
    onRecord(row.subjectId, row.stationId, parsed.valueCm, row.expectedPosition);
    setErrors(e => ({...e,[row.subjectId]:''}));
  };
  return <section className="panel">
    <div className="panel-heading"><div><span className="kicker">Trainee · Round {round}</span><h2>{blinded ? 'Blinded repeat measurement' : 'First measurement round'}</h2></div><span className="count">{existing.length}/{rows.length}</span></div>
    {blinded && <div className="blind-banner"><strong>Blinded repeat measurement</strong><span>Round-1 values are intentionally unavailable in this entry workflow.</span></div>}
    <div className="entry-table">
      {rows.map(row => {
        const done = existing.some(m => m.subjectId === row.subjectId);
        return <div className={`entry-row ${done?'recorded':''}`} key={row.subjectId}>
          <div><strong>{row.subjectLabel}</strong><small>{row.stationLabel} · {row.expectedPosition}</small></div>
          {done ? <span className="recorded-label">Recorded</span> : <>
            <label><span className="sr-only">Measurement cm</span><input inputMode="decimal" placeholder="cm" value={drafts[row.subjectId] ?? ''} onChange={e => setDrafts(d => ({...d,[row.subjectId]:e.target.value}))}/></label>
            <button onClick={() => submit(row as EntryRow)}>Record</button>
          </>}
          {errors[row.subjectId] && <small className="error">{errors[row.subjectId]}</small>}
        </div>;
      })}
    </div>
    <button className="primary" disabled={existing.length !== rows.length} onClick={onLock}>Lock Round {round}</button>
  </section>;
}
