import type { PropsWithChildren } from 'react';

export function AppShell({ children }: PropsWithChildren) {
  return <div className="app-shell">
    <header className="topbar">
      <div>
        <span className="eyebrow">FIK FAIR 2026 · IGNITE</span>
        <h1>TumbuhGuard <span>Standardize</span></h1>
      </div>
      <div className="offline-badge" aria-label="offline first">Offline-first</div>
    </header>
    <main>{children}</main>
    <footer>
      <strong>A measurement can be consistent and still be wrong.</strong>
      <span>Synthetic-data competition prototype · Not an official certification system.</span>
    </footer>
  </div>;
}
