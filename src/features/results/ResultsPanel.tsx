import { useState } from 'react';
import type { Session } from '../../domain/session/state';
import { MetricCard } from '../../components/MetricCard';
import { deriveRemediation } from '../../domain/evidence/remediation';
import { summarizeEvidence } from '../../domain/evidence/evidence';

type EvidenceTab = 'MEASUREMENTS' | 'OBSERVATION' | 'EQUIPMENT' | 'PROTOCOL';

export function ResultsPanel({ session, onRemediate, onClose }: { session: Session; onRemediate:()=>void; onClose:()=>void }) {
  const [tab,setTab]=useState<EvidenceTab>('MEASUREMENTS');
  const r=session.result!;
  const remediation=deriveRemediation(session);
  const evidenceSummary=summarizeEvidence(session);
  const verdictWithheld=!r.protocolValidity.valid;
  const needsRemediation=!r.protocolValidity.valid || !r.precisionPass || !r.referenceValid || r.referencePass===false || remediation.length>0;
  const tabs: readonly {id:EvidenceTab;label:string}[]=[
    {id:'MEASUREMENTS',label:'Measurements'}, {id:'OBSERVATION',label:'Observation'}, {id:'EQUIPMENT',label:'Equipment'}, {id:'PROTOCOL',label:'Protocol'},
  ];
  return <section className="panel" aria-labelledby="results-title">
    <div className="panel-heading"><div><span className="kicker">Screen 6 · Results / Evidence</span><h2 id="results-title">Standardization evidence</h2></div><span className="revision">revision {session.revision}</span></div>
    <div className="metrics">
      <MetricCard label="Trainee repeatability TEM" value={`${r.precisionTEM.toFixed(3)} cm`} status={verdictWithheld?'QUANTITATIVE METRIC ONLY':r.precisionPass?'PASS':'NEEDS RE-STANDARDIZATION'} detail={`strict raw threshold < ${session.protocolSnapshot.precisionThreshold} cm`} tone={verdictWithheld?'blocked':r.precisionPass?'pass':'fail'}/>
      <MetricCard label="Reference repeatability TEM" value={`${r.referencePrecisionTEM.toFixed(3)} cm`} status={verdictWithheld?'QUANTITATIVE METRIC ONLY':r.referenceValid?'REFERENCE VALID':'REFERENCE INVALID'} detail={verdictWithheld?'Overall verdict withheld due to protocol deviation.':`reference validity < ${session.protocolSnapshot.expertPrecisionThreshold} cm`} tone={verdictWithheld?'blocked':r.referenceValid?'pass':'fail'}/>
      {r.referenceValid && r.referenceTEM !== null
        ? <MetricCard label="Reference agreement TEM" value={`${r.referenceTEM.toFixed(3)} cm`} status={verdictWithheld?'QUANTITATIVE METRIC ONLY':r.referencePass?'PASS':'NEEDS RE-STANDARDIZATION'} detail={verdictWithheld?'Overall verdict withheld due to protocol deviation.':`strict raw threshold < ${session.protocolSnapshot.referenceThreshold} cm`} tone={verdictWithheld?'blocked':r.referencePass?'pass':'fail'}/>
        : <MetricCard label="Reference agreement" value="Unavailable" status="WITHHELD" detail="Reference-measurer repeatability did not meet the selected protocol profile." tone="blocked"/>}
      <MetricCard label="Directional difference" value={r.signedDifference===null?'Withheld':`${r.signedDifference>=0?'+':''}${r.signedDifference.toFixed(3)} cm`} status="DESCRIPTIVE ONLY" detail="Signed mean difference can cancel; it is not a substitute for agreement." />
    </div>

    {!r.protocolValidity.valid && <div className="reference-blocked" role="status"><strong>Protocol deviation — verdict withheld.</strong> Standardization verdict withheld because one or more measurements did not follow the configured measurement position.</div>}
    {!r.referenceValid && <div className="reference-blocked" role="status"><strong>Reference agreement assessment unavailable:</strong> reference-measurer repeatability did not meet the selected protocol profile. Trainee repeatability remains visible.</div>}
    {r.referenceValid && r.referencePass===false && <div className="review-message" role="status"><strong>Reference disagreement detected.</strong> Review measurement technique and equipment conditions. The application preserves evidence and does not guess causality.</div>}
    {evidenceSummary.protocolDeviationCount>0 && <div className="review-message" role="status"><strong>Protocol-position deviation recorded.</strong> {evidenceSummary.protocolDeviationCount} active measurement{evidenceSummary.protocolDeviationCount===1?'':'s'} used a position different from the station expectation. Review the recorded evidence; no automatic length/height conversion was applied.</div>}

    <div className="oracle-warning"><strong>Method parity status</strong><code>EXTERNAL_ORACLE_PARITY_PENDING</code><span>The working agreement formula is not claimed as WHO/DHS Annex-13 parity until checked against the authoritative oracle.</span></div>

    <div className="evidence-tabs" aria-label="Evidence categories">
      {tabs.map(item=><button key={item.id} type="button" aria-pressed={tab===item.id} className={tab===item.id?'active':''} onClick={()=>setTab(item.id)}>{item.label}</button>)}
    </div>
    <div className="evidence-content">
      {tab==='MEASUREMENTS' && <div className="evidence-table-wrap"><table className="evidence-table"><thead><tr><th>Subject</th><th>Role</th><th>Round</th><th>Value</th><th>Expected position</th><th>Recorded position</th><th>Protocol flag</th><th>Station</th></tr></thead><tbody>{session.measurements.filter(m=>session.subjects.some(s=>s.id===m.subjectId&&s.status==='ACTIVE')).map(m=>{const subject=session.subjects.find(s=>s.id===m.subjectId)!;const station=session.stations.find(s=>s.id===m.stationId)!;const deviates=station.expectedPosition!==m.position;return <tr key={m.id}><td>{subject.syntheticLabel}</td><td>{m.measurerId===session.trainee.id?'Trainee':'Reference'}</td><td>{m.round}</td><td>{m.valueCm.toFixed(1)} cm</td><td>{station.expectedPosition}</td><td>{m.position}</td><td>{deviates?'POSITION DEVIATION':'—'}</td><td>{station.label}</td></tr>})}</tbody></table></div>}
      {tab==='OBSERVATION' && <div className="evidence-list">{session.observations.length?session.observations.map(o=><article key={o.id}><strong>{o.item}</strong><span>{o.result.replaceAll('_',' ')}</span>{o.note&&<small>{o.note}</small>}</article>):<p>No observation evidence recorded.</p>}</div>}
      {tab==='EQUIPMENT' && <div className="evidence-list">{session.devices.map(device=><article key={device.id}><strong>{device.label}</strong><span>{device.type}</span><small>{session.stations.filter(station=>station.deviceId===device.id).length} linked stations</small></article>)}</div>}
      {tab==='PROTOCOL' && <div className="protocol-evidence"><dl><dt>Profile</dt><dd>{session.protocolSnapshot.name}</dd><dt>Version</dt><dd>{session.protocolVersion}</dd><dt>Snapshot hash</dt><dd><code>{session.protocolHash}</code></dd><dt>Data mode</dt><dd>{session.dataMode}</dd><dt>Age composition</dt><dd>{session.protocolSnapshot.ageCompositionRule}</dd></dl></div>}
    </div>

    {remediation.length>0 && <div className="remediation-list"><h3>Supervisor review focus</h3>{remediation.map(item=><p key={item.code}><b>{item.code}</b> {item.text}</p>)}</div>}
    <div className="actions">{needsRemediation&&<button className="primary" onClick={onRemediate}>Review & create re-standardization</button>}<button onClick={onClose}>Close session</button></div>
  </section>;
}
