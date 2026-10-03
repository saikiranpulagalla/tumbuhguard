import type { Session } from '../../domain/session/state';

export function SetupPanel({ session, onValidate }: { session: Session; onValidate: () => void }) {
  const active=session.subjects.filter(subject=>subject.status==='ACTIVE');
  return <section className="panel" aria-labelledby="setup-title">
    <div className="panel-heading">
      <div><span className="kicker">Screen 2 · Setup</span><h2 id="setup-title">Standardization setup</h2></div>
      <span className="badge">SYNTHETIC</span>
    </div>
    <p className="muted">Review the snapshotted competition profile, roles, synthetic cohort and station/device provenance before starting.</p>
    <div className="setup-summary">
      <div><span>Protocol</span><strong>{session.protocolSnapshot.name}</strong><small>v{session.protocolVersion}</small></div>
      <div><span>Trainee</span><strong>{session.trainee.label}</strong><small>TRAINEE</small></div>
      <div><span>Reference</span><strong>{session.reference.label}</strong><small>REFERENCE</small></div>
      <div><span>Device</span><strong>{session.devices[0]?.label}</strong><small>{session.devices[0]?.type}</small></div>
    </div>
    <div className="notice"><strong>Scientific boundary</strong><br/>Working competition profile. Exact Annex-13/DHS reference-agreement parity remains <code>EXTERNAL_ORACLE_PARITY_PENDING</code>.</div>
    <div className="subject-grid" aria-label="synthetic subject station assignments">
      {active.map(subject=>{const station=session.stations.find(row=>row.subjectId===subject.id)!;return <article key={subject.id} className="subject-card">
        <strong>{subject.syntheticLabel}</strong>
        <span>{subject.ageMonths} months · {subject.ageBand==='UNDER_24_MONTHS'?'under 24':'24 or over'}</span>
        <span>{station.label} · {station.expectedPosition}</span>
        <small>Device: {session.devices.find(device=>device.id===station.deviceId)?.label}</small>
      </article>})}
    </div>
    <div className="sticky-action"><button className="primary" onClick={onValidate}>Validate synthetic setup</button></div>
  </section>;
}
