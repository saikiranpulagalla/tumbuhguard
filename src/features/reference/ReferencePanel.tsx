import { useState } from 'react';
import type { Session } from '../../domain/session/state';
import { parseMeasurementInput } from '../../domain/schemas/measurement-input';

export function ReferencePanel({ session, onRecord, onLock }: { session: Session; onRecord:(subjectId:string,stationId:string,round:1|2,value:number)=>void; onLock:()=>void }) {
  const [drafts,setDrafts]=useState<Record<string,string>>({});
  const ref = session.measurements.filter(m=>m.measurerId===session.reference.id);
  const set=(key:string,v:string)=>setDrafts(d=>({...d,[key]:v}));
  const record=(subjectId:string,stationId:string,round:1|2)=>{ const key=`${subjectId}-${round}`; const p=parseMeasurementInput(drafts[key]??''); if(p.ok) onRecord(subjectId,stationId,round,p.valueCm); };
  return <section className="panel">
    <div className="panel-heading"><div><span className="kicker">Qualified reference</span><h2>Reference repeat measurements</h2></div><span className="count">{ref.length}/{session.subjects.length*2}</span></div>
    <p className="muted">The reference measurer is independently repeat-tested. Trainee reference agreement is withheld if this gate fails.</p>
    <div className="reference-grid">
      {session.subjects.filter(s=>s.status==='ACTIVE').map(subject=>{ const st=session.stations.find(s=>s.subjectId===subject.id)!; return <div className="reference-row" key={subject.id}>
        <div><strong>{subject.syntheticLabel}</strong><small>{st.expectedPosition}</small></div>
        {[1,2].map(n=>{ const round=n as 1|2; const done=ref.some(m=>m.subjectId===subject.id&&m.round===round); const key=`${subject.id}-${round}`; return done?<span key={key} className="recorded-label">R{round} recorded</span>:<div className="inline-input" key={key}><input inputMode="decimal" placeholder={`R${round} cm`} value={drafts[key]??''} onChange={e=>set(key,e.target.value)}/><button onClick={()=>record(subject.id,st.id,round)}>Save</button></div>; })}
      </div>})}
    </div>
    <button className="primary" disabled={ref.length!==session.subjects.length*2} onClick={onLock}>Lock reference measurements</button>
  </section>;
}
