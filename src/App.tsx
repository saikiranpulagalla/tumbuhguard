import { useEffect, useRef, useState } from 'react';
import { AppShell } from './app/AppShell';
import { registerUpdateController, type UpdateController } from './app/update-controller';
import { canApplyServiceWorkerUpdate } from './app/update-policy';
import { calculateSession } from './app/workflow';
import { StateRail } from './components/StateRail';
import { SessionRepository, StaleRevisionError } from './data/repositories/session-repository';
import { db } from './data/db';
import { friendlyDomainError } from './domain/errors';
import { resultIsCurrent } from './domain/protocol/invariants';
import { transition } from './domain/session/transition';
import { createRestandardizationSession } from './domain/session/restandardization';
import { selectBlindRoundSubjects } from './domain/session/selectors';
import type { MeasurementPosition } from './domain/protocol/profile';
import type { SessionEvent } from './domain/session/events';
import type { Observation, Session as SessionModel } from './domain/session/state';
import { createCadreCFastDemoSession, createDemoSession, referenceFixtureMeasurements } from './fixtures/demo';
import { HomePanel } from './features/home/HomePanel';
import { SetupPanel } from './features/setup/SetupPanel';
import { RoundPanel } from './features/round-one/RoundPanel';
import { RoundTwoPanel } from './features/round-two/RoundTwoPanel';
import { ReferencePanel } from './features/reference/ReferencePanel';
import { EvidencePanel } from './features/evidence/EvidencePanel';
import { ResultsPanel } from './features/results/ResultsPanel';
import { RemediationPanel } from './features/remediation/RemediationPanel';
import { createSessionBackup } from './data/export/session-export';
import { hasCompleteRequiredObservationEvidence } from './domain/evidence/required-observations';

const repository = new SessionRepository(db);

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [session, setSession] = useState<SessionModel | null>(null);
  const [showHome, setShowHome] = useState(true);
  const [message, setMessage] = useState('Loading local session…');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [otherTab, setOtherTab] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const updateControllerRef = useRef<UpdateController | null>(null);
  const creatingRestandardizationRef = useRef(false);
  const startingAssessmentRef = useRef(false);
  const resettingRef = useRef(false);
  const loadingDemoRef = useRef(false);

  useEffect(() => {
    void (async () => {
      try {
        const local = await repository.list();
        const existing = local[0];
        if (existing) {
          setSession(existing);
          setShowHome(existing.state === 'DRAFT' && existing.id === 'demo-standardization-001' && !existing.parentSessionId);
          setMessage('Recovered latest local session.');
        } else {
          const seed = createDemoSession();
          try {
            await repository.create(seed);
            setSession(seed);
          } catch (error) {
            // React StrictMode may replay the mount effect in development.
            // If the other replay created the deterministic seed first, reuse
            // that exact local record rather than surfacing a false recovery
            // failure for a duplicate primary key.
            const raced = await repository.get(seed.id).catch(() => undefined);
            if (!raced) throw error;
            setSession(raced);
          }
          setShowHome(true);
          setMessage('Synthetic competition setup ready.');
        }
        try { await navigator.storage?.persist?.(); } catch { /* optional permission */ }
      } catch (error) {
        setLoadError(friendlyDomainError(error));
        setMessage('Local recovery requires review.');
      }
    })();

    const updateConnectivity=()=>setIsOffline(!navigator.onLine);
    window.addEventListener('online',updateConnectivity);
    window.addEventListener('offline',updateConnectivity);

    if ('serviceWorker' in navigator) {
      if (navigator.serviceWorker.controller) setOfflineReady(true);
      void navigator.serviceWorker.ready.then(() => setOfflineReady(true)).catch(() => undefined);
      updateControllerRef.current = registerUpdateController({
        onNeedRefresh: () => setUpdateAvailable(true),
        onOfflineReady: () => setOfflineReady(true),
      });
    }

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('tumbuhguard-session');
      channel.onmessage = event => {
        if (event.data?.reset) {
          // BroadcastChannel is only a UX hint; persistence still rejects all
          // stale writes.  Do not leave this tab rendering deleted session data.
          void repository.list().then(local => {
            const recovered = local[0];
            if (recovered) {
              setSession(recovered);
              setShowHome(true);
              setMessage('Local demo data were reset in another tab. Showing the current local session.');
            } else {
              setSession(null);
              setMessage('Local demo data were reset in another tab. Reload to create a new synthetic session.');
            }
          }).catch(error => setLoadError(friendlyDomainError(error)));
          return;
        }
        setOtherTab(true);
      };
      channelRef.current = channel;
    }
    return () => {
      window.removeEventListener('online',updateConnectivity);
      window.removeEventListener('offline',updateConnectivity);
      channelRef.current?.close();
    };
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
      } else setMessage(friendlyDomainError(error));
    }
  };

  const handleSaveError = async (error: unknown, sessionId: string) => {
    if (error instanceof StaleRevisionError) {
      setMessage('STALE_REVISION: another tab saved first. Reloading latest local session.');
      const latest = await repository.get(sessionId);
      if (latest) setSession(latest);
      return;
    }
    setMessage(friendlyDomainError(error));
  };

  const saveCalculated = async () => {
    if (!session) return;
    const expected = session.revision;
    try {
      const next = calculateSession(session);
      await repository.saveCAS(next, expected, 'CALCULATE_RESULT');
      setSession(next); setMessage('Deterministic QA result saved.');
      channelRef.current?.postMessage({ sessionId: next.id, revision: next.revision });
    } catch (error) { await handleSaveError(error,session.id); }
  };

  const reset = async () => {
    if (resettingRef.current) return;
    if (!window.confirm('Reset all local synthetic demo data? This permanently removes every locally stored assessment and its history.')) return;
    resettingRef.current = true;
    try {
      // Delete the local database rather than opening every current table to
      // clear it. This recovery path also works when a future/unsupported
      // physical IndexedDB version cannot be opened by this build.
      db.close();
      await db.delete();
      await db.open();
      const seed=createDemoSession();
      await repository.create(seed);
      setSession(seed); setShowHome(true); setLoadError(null); setOtherTab(false);
      setMessage('Demo reset to deterministic synthetic setup.');
      channelRef.current?.postMessage({ reset: true });
    } catch (error) {
      const friendly=friendlyDomainError(error);
      setLoadError(friendly);
      setMessage(friendly);
    } finally { resettingRef.current = false; }
  };

  const startAssessment = async () => {
    if (!session || startingAssessmentRef.current) return;
    startingAssessmentRef.current = true;
    try {
    const now=new Date().toISOString();
    const base=createDemoSession('cadre-a-good',`assessment-${crypto.randomUUID()}`);
    const next={...base,createdAt:now,updatedAt:now};
    await repository.create(next); setSession(next); setShowHome(false); setMessage('New synthetic assessment created.');
    } catch (error) { setMessage(friendlyDomainError(error)); }
    finally { startingAssessmentRef.current = false; }
  };

  const runFastDemo = async () => {
    if (loadingDemoRef.current) return;
    loadingDemoRef.current = true;
    try {
    const base=createCadreCFastDemoSession();
    const now=new Date().toISOString();
    const seed={...base,createdAt:now,updatedAt:now};
    await db.transaction('rw', db.sessions, db.audit, async () => {
      await db.sessions.delete(seed.id);
      await db.audit.where('sessionId').equals(seed.id).delete();
    });
    await repository.create(seed);
    setSession(seed); setShowHome(false); setLoadError(null);
    setMessage('Cadre C 90-sec demo loaded at blinded Round 2: enter the final S10 repeat (95.9 cm).');
    } catch (error) { setMessage(friendlyDomainError(error)); }
    finally { loadingDemoRef.current = false; }
  };

  const exportBackup = async () => { if (session) downloadJson(`tumbuhguard-${session.id}.json`, await createSessionBackup(session)); };

  const loadSyntheticReference = async () => {
    if (!session || session.state!=='REFERENCE_OPEN' || session.id!=='demo-cadre-c-fast') return;
    const expected=session.revision;
    try {
      let next=session;
      for (const measurement of referenceFixtureMeasurements(session,'cadre-c-systematic-low')) {
        next=transition(next,{type:'RECORD_MEASUREMENT',measurement:{...measurement,id:crypto.randomUUID(),revision:next.revision+1,recordedAt:new Date().toISOString()}});
      }
      await repository.saveCAS(next,expected,'LOAD_SYNTHETIC_REFERENCE_FIXTURE');
      setSession(next); setMessage('Synthetic qualified-reference readings loaded for the 90-sec demo.');
      channelRef.current?.postMessage({ sessionId: next.id, revision: next.revision });
    } catch(error) { await handleSaveError(error,session.id); }
  };

  const createRestandardization = async () => {
    if (!session || creatingRestandardizationRef.current) return;
    creatingRestandardizationRef.current = true;
    try {
      const now=new Date().toISOString();
      const next=createRestandardizationSession(session,crypto.randomUUID(),now);
      await repository.createLinkedCAS(next,session.id,session.revision);
      setSession(next); setShowHome(false);
      setMessage(`New re-standardization session linked to ${session.id}. Parent evidence is preserved as a closed historical record.`);
      channelRef.current?.postMessage({ sessionId: session.id, revision: session.revision });
    } catch(error) { await handleSaveError(error,session.id); }
    finally { creatingRestandardizationRef.current = false; }
  };

  const applyUpdate=async()=>{
    await updateControllerRef.current?.apply();
    setUpdateAvailable(false);
  };

  if (loadError && !session) return <AppShell offlineReady={offlineReady} isOffline={isOffline}><section className="panel callout"><h2>Local session needs recovery</h2><p>{loadError}</p><button className="primary" onClick={()=>void reset()}>Reset all local synthetic demo data</button></section></AppShell>;
  if (!session) return <AppShell offlineReady={offlineReady} isOffline={isOffline}><section className="panel"><p>{message}</p></section></AppShell>;
  if (showHome) {
    const homeUpdateSafe=canApplyServiceWorkerUpdate(true,session.state);
    return <AppShell offlineReady={offlineReady} isOffline={isOffline}>{updateAvailable&&<div className="update-banner" role="status"><span>{homeUpdateSafe?'Application update available.':'Application update available; reload is deferred while this assessment is active.'}</span><button disabled={!homeUpdateSafe} onClick={()=>void applyUpdate()}>Apply update</button></div>}{otherTab&&<div className="tab-warning" role="status">Another TumbuhGuard tab changed a local session. CAS protection is active; stale writes will be rejected. <button onClick={()=>setOtherTab(false)}>Dismiss</button></div>}<HomePanel offlineReady={offlineReady} isOffline={isOffline} onStart={()=>void startAssessment()} onDemo={()=>void runFastDemo()}/></AppShell>;
  }

  const activeSubjects=session.subjects.filter(subject=>subject.status==='ACTIVE');
  const activeRows = session.stations.filter(station=>activeSubjects.some(subject=>subject.id===station.subjectId)).map(station => {
    const subject=session.subjects.find(item=>item.id===station.subjectId)!;
    return {subjectId:subject.id,subjectLabel:subject.syntheticLabel,stationId:station.id,stationLabel:station.label,expectedPosition:station.expectedPosition};
  });
  const blindRows = selectBlindRoundSubjects(session);
  const evidenceComplete = hasCompleteRequiredObservationEvidence(session);

  const recordTrainee=(round:1|2)=>(subjectId:string, stationId:string, valueCm:number, position:MeasurementPosition) => void apply({type:'RECORD_MEASUREMENT',measurement:{id:crypto.randomUUID(),sessionId:session.id,measurerId:session.trainee.id,subjectId,stationId,round,valueCm,position,revision:session.revision+1,recordedAt:new Date().toISOString()}},`RECORD_ROUND_${round}`);
  const recordReference=(subjectId:string,stationId:string,round:1|2,valueCm:number,position:MeasurementPosition) => { void apply({type:'RECORD_MEASUREMENT',measurement:{id:crypto.randomUUID(),sessionId:session.id,measurerId:session.reference.id,subjectId,stationId,round,valueCm,position,revision:session.revision+1,recordedAt:new Date().toISOString()}},'RECORD_REFERENCE'); };
  const addObservation=(item:string,result:Observation['result'],note?:string)=>{
    const base={id:crypto.randomUUID(),measurerId:session.trainee.id,item,result};
    const observation:Observation=note?.trim()?{...base,note:note.trim()}:base;
    void apply({type:'ADD_OBSERVATION',observation},'ADD_OBSERVATION');
  };

  const updateSafe=canApplyServiceWorkerUpdate(showHome,session.state);

  return <AppShell offlineReady={offlineReady} isOffline={isOffline}>
    {updateAvailable && <div className="update-banner" role="status"><span>{updateSafe?'Application update available.':'Application update available; reload is deferred while this assessment is active.'}</span><button disabled={!updateSafe} onClick={()=>void applyUpdate()}>Apply update</button></div>}
    {otherTab && <div className="tab-warning" role="status">Another TumbuhGuard tab changed a local session. CAS protection is active; stale writes will be rejected. <button onClick={()=>setOtherTab(false)}>Dismiss</button></div>}
    <div className="toolbar"><span aria-live="polite">{message}</span><div><button className="ghost" onClick={exportBackup}>Export JSON backup</button><button className="ghost" onClick={()=>void reset()}>Reset all local demo data</button></div></div>
    <StateRail state={session.state}/>

    {session.state==='DRAFT' && <SetupPanel session={session} onValidate={()=>void apply({type:'VALIDATE_SETUP'},'VALIDATE_SETUP')}/>}
    {session.state==='SETUP_VALID' && <section className="panel callout"><h2>Setup valid</h2><p>Protocol snapshot, 10 synthetic subjects, age composition, station assignments and device provenance are complete.</p><button className="primary" onClick={()=>void apply({type:'OPEN_ROUND_1'},'OPEN_ROUND_1')}>Open Round 1</button></section>}
    {session.state==='ROUND1_OPEN' && <RoundPanel session={session} round={1} rows={activeRows} onRecord={recordTrainee(1)} onLock={()=>void apply({type:'LOCK_ROUND_1'},'LOCK_ROUND_1')}/>}
    {session.state==='ROUND1_LOCKED' && <section className="panel callout"><h2>Round 1 locked</h2><p>Normal editing is blocked. Round 2 opens without exposing Round-1 values.</p><button className="primary" onClick={()=>void apply({type:'OPEN_ROUND_2'},'OPEN_ROUND_2')}>Open blinded Round 2</button></section>}
    {session.state==='ROUND2_OPEN' && <RoundTwoPanel subjects={blindRows} completedSubjectIds={session.measurements.filter(measurement => measurement.measurerId === session.trainee.id && measurement.round === 2 && activeSubjects.some(subject => subject.id === measurement.subjectId)).map(measurement => measurement.subjectId)} onRecordMeasurement={input => recordTrainee(2)(input.subjectId, input.stationId, input.valueCm, input.position)} onLockRound={()=>void apply({type:'LOCK_ROUND_2'},'LOCK_ROUND_2')}/>}
    {session.state==='ROUND2_LOCKED' && <section className="panel callout"><h2>Trainee rounds locked</h2><p>Proceed to independent qualified-reference repeat measurements.</p><button className="primary" onClick={()=>void apply({type:'OPEN_REFERENCE'},'OPEN_REFERENCE')}>Open reference measurements</button></section>}
    {session.state==='REFERENCE_OPEN' && <ReferencePanel session={session} onRecord={recordReference} onLock={()=>void apply({type:'LOCK_REFERENCE'},'LOCK_REFERENCE')} {...(session.id==='demo-cadre-c-fast'?{onLoadSyntheticFixture:()=>void loadSyntheticReference()}:{})}/>}
    {session.state==='REFERENCE_LOCKED' && <><EvidencePanel session={session} onAdd={addObservation}/><section className="panel compact"><button className="primary" disabled={!evidenceComplete} onClick={()=>void apply({type:'MARK_READY'},'MARK_READY')}>Lock evidence & prepare calculation</button></section></>}
    {session.state==='READY_TO_CALCULATE' && <section className="panel callout"><h2>Ready to calculate</h2><p>All active paired measurements and evidence are locked for this revision.</p><button className="primary" onClick={()=>void saveCalculated()}>Calculate deterministic QA result</button></section>}
    {session.state==='RESULT_VALID' && (!resultIsCurrent(session)?<section className="panel callout"><h2>Result stale</h2><p>The saved result does not match this session revision and will not be displayed as current.</p></section>:<ResultsPanel session={session} onRemediate={()=>void apply({type:'START_REMEDIATION'},'START_REMEDIATION')} onClose={()=>void apply({type:'CLOSE_SESSION'},'CLOSE_SESSION')}/>)}
    {session.state==='REMEDIATION' && <RemediationPanel session={session} onAddNote={text=>void apply({type:'ADD_REMEDIATION_NOTE',note:{id:crypto.randomUUID(),text,createdAt:new Date().toISOString()}},'ADD_REMEDIATION_NOTE')} onCreate={()=>void createRestandardization()} onClose={()=>void apply({type:'CLOSE_SESSION'},'CLOSE_SESSION')}/>}
    {session.state==='CLOSED' && <section className="panel callout"><h2>Session closed</h2><p>The assessment record is retained locally with application-level revision history and integrity checks.</p><div className="actions"><button onClick={exportBackup}>Export hashed JSON backup</button><button className="primary" onClick={()=>setShowHome(true)}>Return Home</button></div></section>}
  </AppShell>;
}
