import { useState } from 'react';
import type { Session } from '../../domain/session/state';

export function RemediationPanel({ session, onAddNote, onCreate, onClose }: {
  session: Session;
  onAddNote: (text: string) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  const [text,setText]=useState('');
  const submit=()=>{const value=text.trim(); if(!value)return; onAddNote(value); setText('');};
  return <section className="panel callout remediation-panel" aria-labelledby="remediation-title">
    <span className="kicker">Remediation</span>
    <h2 id="remediation-title">Review evidence before re-standardization</h2>
    <p>This session remains preserved. Add a concise supervisor note, then create a new linked session. The original measurements and result are never overwritten.</p>
    <div className="remediation-note-form">
      <label htmlFor="remediation-note">Supervisor remediation note</label>
      <textarea id="remediation-note" rows={3} value={text} onChange={event=>setText(event.target.value)} placeholder="Observed issue or technique to review"/>
      <button onClick={submit} disabled={!text.trim()}>Add remediation note</button>
    </div>
    {session.remediationNotes.length>0 && <div className="note-list" aria-label="remediation notes">{session.remediationNotes.map(note=><article key={note.id}><strong>Supervisor note</strong><span>{note.text}</span><small>{note.createdAt}</small></article>)}</div>}
    <div className="actions"><button className="primary" onClick={onCreate}>Create Re-standardization</button><button onClick={onClose}>Close without re-standardizing</button></div>
  </section>;
}
