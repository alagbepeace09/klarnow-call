import { useState } from 'react';
import { ANNOTATIONS, PERMISSION_FLAGS } from '../annotations.js';

const KIND_LABEL = { demo: 'Demo', pending: 'Pending', live: 'Live', failure: 'Failure', recovery: 'Recovery', flag: 'Product review' };

/** Inline state marker. Shown only when annotations are on. */
export function Tag({ kind = 'demo', label, show }) {
  if (!show) return null;
  return (
    <span className={'ann-tag k-' + kind}>
      <i aria-hidden="true" />{KIND_LABEL[kind]}{label ? ' · ' + label : ''}
    </span>
  );
}

/** Per-screen handoff note: who acts, input, record change, where it shows next. */
export function AnnotationDock({ screen, show, onClose }) {
  const [open, setOpen] = useState(false);
  const a = ANNOTATIONS[screen];
  if (!show || !a) return null;
  return (
    <aside className={'ann-dock' + (open ? ' open' : '')} aria-label={'Annotation for screen ' + screen}>
      <button className="ann-dock-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="n">{screen}</span><b>{a.title}</b><span className="t">{open ? 'Annotation' : 'Read annotation'}</span>
        <span className="chev" aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      {open && (
        <div className="ann-dock-body">
          <dl>
            <div><dt>Who can act</dt><dd>{a.who}</dd></div>
            <div><dt>Input required</dt><dd>{a.input}</dd></div>
            <div><dt>Record that changes</dt><dd>{a.record}</dd></div>
            <div><dt>Where the next person sees it</dt><dd>{a.next}</dd></div>
          </dl>
          <ul className="ann-states">
            {a.states.map((st, i) => <li key={i}><span className={'ann-tag k-' + st[0]}><i aria-hidden="true" />{KIND_LABEL[st[0]]}</span>{st[1]}</li>)}
          </ul>
          {(screen === '07' || screen === '08' || screen === '05') && (
            <div className="ann-flags"><span className="ann-tag k-flag"><i aria-hidden="true" />Product review</span><ul>{PERMISSION_FLAGS.map((f) => <li key={f}>{f}</li>)}</ul></div>
          )}
          <button className="ann-hide" onClick={onClose}>Hide annotations</button>
        </div>
      )}
    </aside>
  );
}

const SCREENS = [
  ['/', '01 Landing'],
  ['/start?site=canalstreetkitchen.co.uk', '02 Website scan'],
  ['/start?state=review', '02 Review draft'],
  ['/start', '02 Manual entry'],
  ['/start?state=scan-failed', '02 Scan failed'],
  ['/start?state=call', '03 Call form'],
  ['/start?state=connected', '03 Connected'],
  ['/start?state=call-failed', '03 Call failed'],
  ['/start?state=preview', '03 Browser preview'],
  ['/save', '04 Email + code'],
  ['/app', '05 Command Centre'],
  ['/app/enquiries', '07 Calls & Enquiries'],
  ['/app/needs-you', '08 Needs You']
];

function Seg({ value, options, onChange, label }) {
  return (
    <div className="rv-seg" role="group" aria-label={label}>
      {options.map((o) => <button key={o[0]} className={value === o[0] ? 'on' : ''} aria-pressed={value === o[0]} onClick={() => onChange(o[0])}>{o[1]}</button>)}
    </div>
  );
}

/** Reviewer tools. Not product UI. */
export function ReviewPanel({ show, go, ann, setAnn, motion, setMotion, role, setRole, sim, setSim, onReset }) {
  const [open, setOpen] = useState(false);
  if (!show) return null;
  return (
    <div className="rv">
      {open && (
        <div className="rv-panel" role="dialog" aria-label="Review tools">
          <div className="rv-head"><b>Review tools</b><span>Not part of the product</span></div>
          <h4>Jump to a screen</h4>
          <div className="rv-grid">{SCREENS.map((s) => <button key={s[0]} onClick={() => { setOpen(false); go(s[0]); }}>{s[1]}</button>)}</div>
          <h4>View</h4>
          <label className="rv-row"><span>Annotations</span><input type="checkbox" checked={ann} onChange={(e) => setAnn(e.target.checked)} /></label>
          <label className="rv-row"><span>Reduced motion</span><input type="checkbox" checked={motion === 'reduce'} onChange={(e) => setMotion(e.target.checked ? 'reduce' : 'full')} /></label>
          <div className="rv-row"><span>View as</span><Seg label="Role" value={role} onChange={setRole} options={[['owner', 'Owner/admin'], ['member', 'Member']]} /></div>
          <h4>Simulated outcomes</h4>
          <div className="rv-row"><span>Website scan</span><Seg label="Website scan" value={sim.scan} onChange={(v) => setSim({ ...sim, scan: v })} options={[['success', 'Works'], ['fails', 'Fails']]} /></div>
          <div className="rv-row"><span>Test call</span><Seg label="Test call" value={sim.call} onChange={(v) => setSim({ ...sim, call: v })} options={[['answered', 'Answered'], ['unanswered', 'No answer'], ['fails', 'Fails']]} /></div>
          <div className="rv-row"><span>Confirmation email</span><Seg label="Confirmation email" value={sim.email} onChange={(v) => setSim({ ...sim, email: v })} options={[['fail-once', 'Fails once'], ['fail', 'Always fails'], ['ok', 'Delivers']]} /></div>
          <div className="rv-row"><span>Next save</span><Seg label="Next save" value={sim.save} onChange={(v) => setSim({ ...sim, save: v })} options={[['ok', 'Succeeds'], ['fail', 'Fails']]} /></div>
          <button className="rv-reset" onClick={() => { onReset(); setOpen(false); }}>Reset demo data</button>
          <p className="rv-note">Simulated outcomes only affect sample data. Sign-in codes and website reading are real. Add ?review=0 to the address to hide these tools.</p>
        </div>
      )}
      <button className="rv-btn" onClick={() => setOpen(!open)} aria-expanded={open}><span className="dot" />Review<span className="x">{ann ? ' · notes on' : ''}</span></button>
    </div>
  );
}
