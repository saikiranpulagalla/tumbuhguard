import { useState } from 'react';
import type { Session } from '../../domain/session/state';
import { parseMeasurementInput } from '../../domain/schemas/measurement-input';

const message: Record<string,string>={EMPTY:'Measurement is required.',MALFORMED:'Enter a valid decimal value.',NON_POSITIVE:'Measurement must be greater than zero.',OUT_OF_RANGE:'Enter 30–220 cm.'};

export function ReferencePanel({ session, onRecord, onLock, onLoadSyntheticFixture }: {
  session: Session;
  onRecord:(subjectId:string,stationId:string,round:1|2,value:number)=>void;
  onLock:()=>void;
  onLoadSyntheticFixture?:()=>void;
}) {
  const [drafts,setDrafts]=useState<Record<string,string>>({});
  const [errors,setErrors]=useState<Record<string,string>>({});
  const active=session.subjects.filter(s=>s.status==='ACTIVE');
  const ref = session.measurements.filter(m=>m.measurerId===session.reference.id && active.some(s=>s.id===m.subjectId));
  const set=(key:string,v:string)=>setDrafts(d=>({...d,[key]:v}));
  const record=(subjectId:string,stationId:string,round:1|2)=>{ const key=`${subjectId}-${round}`; const p=parseMeasurementInput(drafts[key]??''); if(!p.ok){setErrors(e=>({...e,[key]:message[p.code]??p.code}));return;} setErrors(e=>({...e,[key]:''})); onRecord(subjectId,stationId,round,p.valueCm); };
  return <section className="panel" aria-labelledby="reference-title">
    <div className="panel-heading"><div><span className="kicker">Screen 5 · Qualified reference</span><h2 id="reference-title">Reference repeat measurements</h2></div><span className="count" aria-live="polite">{ref.length}/{active.length*2} recorded</span></div>
    <p className="muted">The reference measurer is independently repeat-tested. Trainee reference agreement is withheld if this gate fails.</p>
    {onLoadSyntheticFixture && ref.length===0 && <div className="demo-helper"><span><strong>90-sec synthetic demo</strong><br/>Load the locked Cadre C reference readings instead of typing 20 demo values.</span><button onClick={onLoadSyntheticFixture}>Load synthetic reference fixture</button></div>}
    <div className="reference-grid">
      {active.map(subject=>{ const st=session.stations.find(s=>s.subjectId===subject.id)!; return <div className="reference-row" key={subject.id}>
        <div><strong>{subject.syntheticLabel}</strong><small>{st.expectedPosition}</small></div>
        {[1,2].map(n=>{ const round=n as 1|2; const done=ref.some(m=>m.subjectId===subject.id&&m.round===round); const key=`${subject.id}-${round}`; const inputId=`reference-${key}`; const errorId=`reference-error-${key}`; return done?<span key={key} className="recorded-label">R{round} recorded</span>:<div className="inline-input" key={key}><label htmlFor={inputId} className="sr-only">{subject.syntheticLabel} reference round {round} centimetres</label><input id={inputId} inputMode="decimal" autoComplete="off" placeholder={`R${round} cm`} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key]?errorId:undefined} value={drafts[key]??''} onChange={e=>set(key,e.target.value)}/><button onClick={()=>record(subject.id,st.id,round)}>Save</button>{errors[key]&&<small id={errorId} className="error" role="alert">{errors[key]}</small>}</div>; })}
      </div>})}
    </div>
    <div className="sticky-action"><button className="primary" disabled={ref.length!==active.length*2} onClick={onLock}>Lock reference measurements</button></div>
  </section>;
}
