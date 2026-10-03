import { useState } from 'react';
import type { ObservationResult, Session } from '../../domain/session/state';

const items=['Correct positioning before reading','Equipment/station check performed','Reading recorded without prompting'] as const;

export function EvidencePanel({ session, onAdd }: { session: Session; onAdd:(item:string,result:ObservationResult,note?:string)=>void }) {
  const [notes,setNotes]=useState<Record<string,string>>({});
  return <section className="panel compact" aria-labelledby="observation-title"><div className="panel-heading"><div><span className="kicker">Observed skill evidence</span><h2 id="observation-title">Technique observations</h2></div></div>
    <p className="muted">Observation supplements the quantitative QA result. It does not override the mathematics.</p>
    {items.map(item=>{const existing=session.observations.find(o=>o.item===item);return <div className="observation-row" key={item}><div><span>{item}</span>{existing?.note&&<small>{existing.note}</small>}</div>{existing?<b>{existing.result.replaceAll('_',' ')}</b>:<div className="observation-actions"><label><span className="sr-only">Optional note for {item}</span><input placeholder="Optional note" value={notes[item]??''} onChange={e=>setNotes(n=>({...n,[item]:e.target.value}))}/></label><button onClick={()=>onAdd(item,'OBSERVED_OK',notes[item])}>Observed OK</button><button className="ghost" onClick={()=>onAdd(item,'NEEDS_REVIEW',notes[item])}>Needs review</button><button className="ghost" onClick={()=>onAdd(item,'NOT_OBSERVED',notes[item])}>Not observed</button></div>}</div>})}
  </section>;
}
