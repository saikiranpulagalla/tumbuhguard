export function HomePanel({ offlineReady, isOffline, onStart, onDemo }: {
  offlineReady: boolean;
  isOffline: boolean;
  onStart: () => void;
  onDemo: () => void;
}) {
  return <section className="panel home-panel" aria-labelledby="home-title">
    <div className="home-copy">
      <span className="kicker">Guided Standardization Session</span>
      <h2 id="home-title">TumbuhGuard Standardize</h2>
      <p className="home-subtitle">Offline practical anthropometry standardization</p>
      <p>A measurement can be consistent and still disagree with a qualified reference. TumbuhGuard enforces the assessment workflow before it calculates the evidence.</p>
      <div className="badge-row" aria-label="build characteristics">
        <span className="badge">SYNTHETIC DEMO</span>
        {offlineReady && <span className="badge">{isOffline ? 'OFFLINE · CACHE READY' : 'OFFLINE READY'}</span>}
        <span className="badge">WHO/UNICEF-ALIGNED PROFILE</span>
      </div>
      <div className="actions home-actions">
        <button className="primary" onClick={onStart}>Start Assessment</button>
        <button onClick={onDemo}>Run 90-sec Demo</button>
      </div>
    </div>
    <aside className="home-principle" aria-label="TumbuhGuard principle">
      <strong>Validate the measurer, not just the measurement.</strong>
      <span>Protocol enforcement</span>
      <span>Blinded repeat workflow</span>
      <span>Qualified-reference validity</span>
      <span>Evidence + re-standardization</span>
    </aside>
  </section>;
}
