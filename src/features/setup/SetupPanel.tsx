import type { Session } from '../../domain/session/state';

export function SetupPanel({ session, onValidate }: { session: Session; onValidate: () => void }) {
  return <section className="panel hero-panel">
    <div className="panel-copy">
      <span className="kicker">Guided Standardization Session</span>
      <h2>Validate the measurer, not just the measurement.</h2>
      <p>This workflow standardizes practical length/height measurement quality using blinded repeats, a qualified-reference validity gate, provenance and observed-skill evidence.</p>
      <div className="notice"><strong>Scientific boundary</strong><br/>Working competition profile. Reference-agreement oracle parity is marked <code>EXTERNAL_ORACLE_PARITY_PENDING</code>.</div>
      <button className="primary" onClick={onValidate}>Validate synthetic setup</button>
    </div>
    <div className="setup-facts">
      <div><b>{session.subjects.length}</b><span>Synthetic subjects</span></div>
      <div><b>1</b><span>Reference measurer</span></div>
      <div><b>{session.devices.length}</b><span>Provenance device</span></div>
      <div><b>{session.protocolSnapshot.version}</b><span>Protocol snapshot</span></div>
    </div>
  </section>;
}
