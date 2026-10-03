import type { PropsWithChildren } from 'react';
import { BUILD_INFO } from './build-info';

export function AppShell({ children, offlineReady = false, isOffline = false }: PropsWithChildren<{offlineReady?: boolean; isOffline?: boolean}>) {
  return <div className="app-shell">
    <header className="topbar">
      <div>
        <span className="eyebrow">FIK FAIR 2026 · IGNITE</span>
        <h1>TumbuhGuard <span>Standardize</span></h1>
      </div>
      <div className="runtime-status" aria-label="offline application status">
        <strong>{isOffline?'OFFLINE':'LOCAL-FIRST'}</strong>
        <span>{offlineReady?'cache ready':'cache warming'}</span>
      </div>
    </header>
    <main>{children}</main>
    <footer>
      <strong>A measurement can be consistent and still be wrong.</strong>
      <span>Synthetic-data competition prototype · Not an official certification system.</span>
      <small>Build {BUILD_INFO.buildId} · {BUILD_INFO.scientificParity}</small>
    </footer>
  </div>;
}
