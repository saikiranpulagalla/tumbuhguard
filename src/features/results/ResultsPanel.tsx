import type { Session } from '../../domain/session/state';
import { MetricCard } from '../../components/MetricCard';
import { deriveRemediation } from '../../domain/evidence/remediation';

export function ResultsPanel({ session, onRemediate, onClose }: { session: Session; onRemediate:()=>void; onClose:()=>void }) {
  const r=session.result!; const remediation=deriveRemediation(session);
  return <section className="panel">
    <div className="panel-heading"><div><span className="kicker">Deterministic QA result</span><h2>Standardization evidence</h2></div><span className="revision">revision {session.revision}</span></div>
    <div className="metrics">
      <MetricCard label="Trainee repeatability TEM" value={`${r.precisionTEM.toFixed(3)} cm`} detail={`strict threshold < ${session.protocolSnapshot.precisionThreshold} cm`} tone={r.precisionPass?'pass':'fail'}/>
      <MetricCard label="Reference repeatability TEM" value={`${r.referencePrecisionTEM.toFixed(3)} cm`} detail={`reference validity < ${session.protocolSnapshot.expertPrecisionThreshold} cm`} tone={r.referenceValid?'pass':'fail'}/>
      {r.referenceValid && r.referenceTEM !== null ? <MetricCard label="Reference agreement TEM" value={`${r.referenceTEM.toFixed(3)} cm`} detail={`strict threshold < ${session.protocolSnapshot.referenceThreshold} cm`} tone={r.referencePass?'pass':'fail'}/>:<MetricCard label="Reference agreement" value="Unavailable" detail="Reference-measurer repeatability did not meet the selected protocol profile." tone="blocked"/>}
      <MetricCard label="Signed mean difference" value={r.signedDifference===null?'Withheld':`${r.signedDifference>=0?'+':''}${r.signedDifference.toFixed(3)} cm`} detail="Descriptive evidence only; not a substitute for agreement." />
    </div>
    <div className="oracle-warning"><strong>Method parity status</strong><code>EXTERNAL_ORACLE_PARITY_PENDING</code><span>The working agreement formula is not claimed as WHO/DHS Annex-13 parity until checked against the authoritative oracle.</span></div>
    {remediation.length>0 && <div className="remediation-list"><h3>Remediation focus</h3>{remediation.map(i=><p key={i.code}><b>{i.code}</b> {i.text}</p>)}</div>}
    <div className="actions">{remediation.length>0&&<button className="primary" onClick={onRemediate}>Start remediation</button>}<button onClick={onClose}>Close session</button></div>
  </section>;
}
