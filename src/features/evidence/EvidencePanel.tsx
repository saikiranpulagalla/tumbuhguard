import type { Session } from '../../domain/session/state';
export function EvidencePanel({ session, onAdd }: { session: Session; onAdd:(item:string,result:'PASS'|'NEEDS_REVIEW')=>void }) {
  const items=['Correct positioning before reading','Equipment/station check performed','Reading recorded without prompting'];
  return <section className="panel compact"><div className="panel-heading"><div><span className="kicker">Observed skill evidence</span><h2>Technique observations</h2></div></div>
    {items.map(item=>{const existing=session.observations.find(o=>o.item===item);return <div className="observation-row" key={item}><span>{item}</span>{existing?<b>{existing.result.replace('_',' ')}</b>:<div><button onClick={()=>onAdd(item,'PASS')}>Observed</button><button className="ghost" onClick={()=>onAdd(item,'NEEDS_REVIEW')}>Needs review</button></div>}</div>})}
  </section>;
}
