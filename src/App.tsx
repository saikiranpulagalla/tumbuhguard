import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from './app/AppShell';
import { calculateSession } from './app/workflow';
import { StateRail } from './components/StateRail';
import { SessionRepository, StaleRevisionError } from './data/repositories/session-repository';
import { db } from './data/db';
import { transition } from './domain/session/transition';
import { selectBlindRoundSubjects } from './domain/session/selectors';
import type { MeasurementPosition } from './domain/protocol/profile';
import type { SessionEvent } from './domain/session/events';
import type { Session as SessionModel } from './domain/session/state';
import { createDemoSession } from './fixtures/demo';
import { SetupPanel } from './features/setup/SetupPanel';
import { RoundPanel } from './features/round-one/RoundPanel';
import { ReferencePanel } from './features/reference/ReferencePanel';
import { EvidencePanel } from './features/evidence/EvidencePanel';
import { ResultsPanel } from './features/results/ResultsPanel';
import { createSessionBackup } from './data/export/session-export';

const repository = new SessionRepository(db);

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [session, setSession] = useState<SessionModel | null>(null);
  const [message, setMessage] = useState('Loading local session…');
  const [otherTab, setOtherTab] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    void (async () => {
      const existing = await repository.get('demo-standardization-001');
      if (existing) { setSession(existing); setMessage('Recovered local session.'); }
      else { const seed = createDemoSession(); await repository.create(seed); setSession(seed); setMessage('Synthetic demo ready.'); }
      try { await navigator.storage?.persist?.(); } catch { /* optional */ }
    })();
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('tumbuhguard-session');
      channel.onmessage = () => setOtherTab(true);
      channelRef.current = channel;
      return () => channel.close();
    }
  }, []);

  const apply = async (event: SessionEvent, label: string) => {
    if (!session) return;
    const expected = session.revision;
    try {
      const next = transition(session, event);
      await repository.saveCAS(next, expected, label);
      setSession(next); setMessage(`${label.replaceAll('_',' ')} saved locally.`);
      channelRef.current?.postMessage({ sessionId: next.id, revision: next.revision });
    } catch (error) {
      if (error instanceof StaleRevisionError) {
        setMessage('STALE_REVISION: another tab saved first. Reloading latest local session.');
        const latest = await repository.get(session.id); if (latest) setSession(latest);
      } else setMessage(error instanceof Error ? error.message : 'Save failed');
    }
  };

  const saveCalculated = async () => {
    if (!session) return;
    const expected = session.revision;
    try {
      const next = calculateSession(session);
      await repository.saveCAS(next, expected, 'CALCULATE_RESULT');
      setSession(next); setMessage('Deterministic result saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Calculation failed'); }
  };

  const reset = async () => {
    await db.transaction('rw', db.sessions, db.audit, async () => { await db.sessions.clear(); await db.audit.clear(); });
    const seed=createDemoSession(); await repository.create(seed); setSession(seed); setMessage('Demo reset to deterministic synthetic setup.');
  };

  const exportBackup = async () => { if (session) downloadJson(`tumbuhguard-${session.id}.json`, await createSessionBackup(session)); };

  const createRestandardization = async () => {
    if (!session) return;
    const expected = session.revision;
    const closed = transition(session, { type: 'CLOSE_SESSION' });
    await repository.saveCAS(closed, expected, 'CLOSE_FOR_RESTANDARDIZATION');
    const base = createDemoSession();
    const now = new Date().toISOString();
    const next: SessionModel = { ...base, id: crypto.randomUUID(), parentSessionId: session.id, createdAt: now, updatedAt: now };
    await repository.create(next);
    setSession(next);
    setMessage('New re-standardization session created; parent session remains closed.');
    channelRef.current?.postMessage({ sessionId: session.id, revision: closed.revision });
  };

  if (!session) return <AppShell><section className="panel"><p>{message}</p></section></AppShell>;

  const activeRows = session.stations.map(st => {
    const subject=session.subjects.find(s=>s.id===st.subjectId)!;
    return {subjectId:subject.id,subjectLabel:subject.syntheticLabel,stationId:st.id,stationLabel:st.label,expectedPosition:st.expectedPosition};
  });
  const blindRows = selectBlindRoundSubjects(session);
  const evidenceComplete = session.observations.length >= 3;

  const recordTrainee=(round:1|2)=>(subjectId:string, stationId:string, valueCm:number, position:MeasurementPosition) => void apply({type:'RECORD_MEASUREMENT',measurement:{id:crypto.randomUUID(),sessionId:session.id,measurerId:session.trainee.id,subjectId,stationId,round,valueCm,position,revision:session.revision+1,recordedAt:new Date().toISOString()}},`RECORD_ROUND_${round}`);
  const recordReference=(subjectId:string,stationId:string,round:1|2,valueCm:number) => { const station=session.stations.find(s=>s.id===stationId)!; void apply({type:'RECORD_MEASUREMENT',measurement:{id:crypto.randomUUID(),sessionId:session.id,measurerId:session.reference.id,subjectId,stationId,round,valueCm,position:station.expectedPosition,revision:session.revision+1,recordedAt:new Date().toISOString()}},'RECORD_REFERENCE'); };

  return <AppShell>
    {otherTab && <div className="tab-warning">Another TumbuhGuard tab changed this session. CAS protection is active; stale writes will be rejected. <button onClick={()=>setOtherTab(false)}>Dismiss</button></div>}
    <div className="toolbar"><span>{message}</span><div><button className="ghost" onClick={exportBackup}>Export JSON backup</button><button className="ghost" onClick={reset}>Reset demo</button></div></div>
    <StateRail state={session.state}/>

    {session.state==='DRAFT' && <SetupPanel session={session} onValidate={()=>void apply({type:'VALIDATE_SETUP'},'VALIDATE_SETUP')}/>} 
    {session.state==='SETUP_VALID' && <section className="panel callout"><h2>Setup valid</h2><p>Protocol snapshot, 10 synthetic subjects, station assignments and device provenance are complete.</p><button className="primary" onClick={()=>void apply({type:'OPEN_ROUND_1'},'OPEN_ROUND_1')}>Open Round 1</button></section>}
    {session.state==='ROUND1_OPEN' && <RoundPanel session={session} round={1} rows={activeRows} onRecord={recordTrainee(1)} onLock={()=>void apply({type:'LOCK_ROUND_1'},'LOCK_ROUND_1')}/>} 
    {session.state==='ROUND1_LOCKED' && <section className="panel callout"><h2>Round 1 locked</h2><p>Normal editing is blocked. Round 2 opens without exposing Round‑1 values.</p><button className="primary" onClick={()=>void apply({type:'OPEN_ROUND_2'},'OPEN_ROUND_2')}>Open blinded Round 2</button></section>}
    {session.state==='ROUND2_OPEN' && <RoundPanel session={session} round={2} rows={blindRows} blinded onRecord={recordTrainee(2)} onLock={()=>void apply({type:'LOCK_ROUND_2'},'LOCK_ROUND_2')}/>} 
    {session.state==='ROUND2_LOCKED' && <section className="panel callout"><h2>Trainee rounds locked</h2><p>Proceed to independent qualified-reference repeat measurements.</p><button className="primary" onClick={()=>void apply({type:'OPEN_REFERENCE'},'OPEN_REFERENCE')}>Open reference measurements</button></section>}
    {session.state==='REFERENCE_OPEN' && <ReferencePanel session={session} onRecord={recordReference} onLock={()=>void apply({type:'LOCK_REFERENCE'},'LOCK_REFERENCE')}/>} 
    {session.state==='REFERENCE_LOCKED' && <><EvidencePanel session={session} onAdd={(item,result)=>void apply({type:'ADD_OBSERVATION',observation:{id:crypto.randomUUID(),measurerId:session.trainee.id,item,result}},'ADD_OBSERVATION')}/><section className="panel compact"><button className="primary" disabled={!evidenceComplete} onClick={()=>void apply({type:'MARK_READY'},'MARK_READY')}>Lock evidence & prepare calculation</button></section></>}
    {session.state==='READY_TO_CALCULATE' && <section className="panel callout"><h2>Ready to calculate</h2><p>All active paired measurements and evidence are locked for this revision.</p><button className="primary" onClick={saveCalculated}>Calculate deterministic QA result</button></section>}
    {session.state==='RESULT_VALID' && <ResultsPanel session={session} onRemediate={()=>void apply({type:'START_REMEDIATION'},'START_REMEDIATION')} onClose={()=>void apply({type:'CLOSE_SESSION'},'CLOSE_SESSION')}/>} 
    {session.state==='REMEDIATION' && <section className="panel callout"><span className="kicker">Remediation</span><h2>Review technique, then create a new re-standardization session.</h2><p>This session remains intact. A re-standardization attempt must be a new session linked with <code>parentSessionId</code>; old measurements are never reopened.</p><button className="primary" onClick={()=>void createRestandardization()}>Create re-standardization session</button><button onClick={()=>void apply({type:'CLOSE_SESSION'},'CLOSE_SESSION')}>Close without re-standardizing</button></section>}
    {session.state==='CLOSED' && <section className="panel callout"><h2>Session closed</h2><p>The assessment record is retained locally with application-level revision history and integrity checks.</p><button onClick={exportBackup}>Export signed-hash JSON backup</button></section>}
  </AppShell>;
}
