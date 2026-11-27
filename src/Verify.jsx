import { useEffect, useRef, useState } from 'react';
import Icon from './components/Icons.jsx';
import Klaro from './components/Klaro.jsx';
import { Brand, ThemeToggle } from './components/Brand.jsx';
import { Tag } from './components/Review.jsx';
import { SAMPLE_PEOPLE } from './workspace/model.js';

const PREVIEW_CODE = '482913';
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());
const localIso = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':00'; };

async function post(url, body) {
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, ...j };
  } catch (e) {
    return { ok: false, status: 0, error: 'network', message: 'We couldn’t reach the server. Check your connection and try again.' };
  }
}

/** 04 Email + code. Sends a real code by email; keeps the draft from 02/03 through verification. */
export default function Verify({ draft, onHome, onBack, onDone, onPreviewDone, theme, onToggleTheme, motion, ann }) {
  const [step, setStep] = useState('email'); // email | sending | code | checking | expired | done
  const [mode, setMode] = useState('live'); // live | preview (only when email sign-in isn't switched on)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [notReady, setNotReady] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [codeErr, setCodeErr] = useState('');
  const [wait, setWait] = useState(0);
  const [resent, setResent] = useState(0);
  const [joining, setJoining] = useState(null);
  const [devCode, setDevCode] = useState('');
  const [result, setResult] = useState(null);
  const boxes = useRef([]);
  const d = draft || { bizName: '', klaroName: 'Klaro', services: [], voice: 'warm', testCall: 'none' };
  const kname = d.klaroName || 'Klaro';
  const biz = d.bizName || 'your business';

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  useEffect(() => { if (step === 'code' && boxes.current[0]) boxes.current[0].focus(); }, [step, resent]);

  const toCode = (r) => { setStep('code'); setWait(r && r.retryIn ? r.retryIn : 30); setDigits(['', '', '', '', '', '']); setCodeErr(''); };

  const send = async (e, again) => {
    if (e) e.preventDefault();
    if (!validEmail(email)) { setEmailErr('Enter an email address like name@business.co.uk.'); return; }
    setEmailErr(''); setCodeErr('');
    if (mode === 'preview') { setStep('sending'); setTimeout(() => toCode(), 700); if (again) setResent(resent + 1); return; }
    setStep(again ? 'code' : 'sending');
    const r = await post('/api/auth/start', { email: email.trim(), name: name.trim(), draft: d, now: localIso() });
    if (r.ok) {
      setJoining(r.joining || null); setDevCode(r.devCode || '');
      toCode(r);
      if (again) setResent(resent + 1);
      return;
    }
    if (r.error === 'email_not_configured' || r.error === 'storage_not_configured') { setNotReady(r.message); setStep('email'); return; }
    if (again) { setStep('code'); setCodeErr(r.message || 'We couldn’t send a new code. Try again in a moment.'); if (r.retryIn) setWait(r.retryIn); return; }
    setStep('email'); setEmailErr(r.message || 'We couldn’t send the code. Try again.');
  };

  const setDigit = (i, v) => {
    const clean = v.replace(/\D/g, '');
    const n = digits.slice();
    if (clean.length > 1) {
      clean.slice(0, 6).split('').forEach((c, j) => { if (i + j < 6) n[i + j] = c; });
      setDigits(n); setCodeErr('');
      const last = Math.min(5, i + clean.length);
      if (boxes.current[last]) boxes.current[last].focus();
      return;
    }
    n[i] = clean; setDigits(n); setCodeErr('');
    if (clean && i < 5 && boxes.current[i + 1]) boxes.current[i + 1].focus();
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1].focus();
    if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1].focus();
    if (e.key === 'ArrowRight' && i < 5) boxes.current[i + 1].focus();
  };

  const check = async (e) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) { setCodeErr('Enter all 6 digits.'); return; }
    setStep('checking');
    if (mode === 'preview') {
      setTimeout(() => {
        if (code !== PREVIEW_CODE) { setStep('code'); setCodeErr('That code doesn’t match. Check the code on screen.'); return; }
        setResult({ preview: true, me: SAMPLE_PEOPLE.dami, role: 'owner' }); setStep('done');
      }, 600);
      return;
    }
    const r = await post('/api/auth/verify', { email: email.trim(), code });
    if (r.ok) { setResult(r); setStep('done'); return; }
    if (r.error === 'expired' || r.error === 'locked') { setStep('expired'); setCodeErr(r.message); setDigits(['', '', '', '', '', '']); return; }
    setStep('code'); setCodeErr(r.message || 'That code doesn’t match.');
  };

  const mood = step === 'done' ? 'success' : step === 'expired' || codeErr || emailErr ? 'attention' : step === 'sending' || step === 'checking' ? 'working' : step === 'code' ? 'listening' : 'welcome';
  const role = result ? (result.me && result.me.role) || result.role : null;
  const wsBiz = result && result.workspace ? result.workspace.biz : biz;

  return (
    <div className={'kc' + (motion === 'reduce' ? ' rm' : '')}>
      <header className="kc-top">
        <Brand onClick={(e) => { e.preventDefault(); onHome(); }} />
        <div className="kc-top-mid"><span className="kc-chip"><Icon name="shield" size="sm" /><span>Save your receptionist</span></span></div>
        <div className="kc-top-right">
          <span className="kc-pill pill-neutral"><span className="dot" />Not live yet</span>
          {onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
        </div>
      </header>

      <main className="vf">
        <section className="vf-main">
          <button className="back" onClick={onBack}><Icon name="back" size="sm" /><span>Back to {kname}</span></button>

          {(step === 'email' || step === 'sending') && (
            <form onSubmit={send} noValidate>
              <span className="kc-kicker">Step 4 of 6 · Save {kname}</span>
              <h1>Where should we send your code?</h1>
              <p className="vf-lead">We’ll email you a 6-digit code. Enter it here to save {kname} for {biz}. No password needed.</p>
              {notReady && mode === 'live' && (
                <div className="kc-banner banner-warn" role="alert">
                  <span className="ico"><Icon name="alert" size="sm" /></span>
                  <div>
                    <b>Email sign-in isn’t switched on for this site yet.</b> {notReady} You can still look around with a preview code; nothing will be saved to an account.
                    <div className="vf-row"><button type="button" className="btn btn-dark btn-sm" onClick={() => { setMode('preview'); setNotReady(''); }}>Continue with a preview code</button></div>
                  </div>
                </div>
              )}
              <div className="kc-field">
                <label className="kc-label" htmlFor="vf-name">Your name <span className="vf-opt">Optional</span></label>
                <input id="vf-name" className="kc-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="So your team knows who did what" />
              </div>
              <div className="kc-field">
                <label className="kc-label" htmlFor="vf-email">Work email</label>
                <input id="vf-email" className={'kc-input' + (emailErr ? ' bad' : '')} type="email" autoComplete="email" inputMode="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailErr(''); }} aria-invalid={!!emailErr} aria-describedby={emailErr ? 'vf-email-err' : 'vf-email-hint'} placeholder="you@yourbusiness.co.uk" />
                {emailErr ? <div id="vf-email-err" className="kc-field-err vf-err" role="alert"><Icon name="alert" size="sm" />{emailErr}</div>
                  : <div id="vf-email-hint" className="vf-hint">Use your work email. Colleagues who sign in with the same company email join the same workspace.</div>}
              </div>
              {mode === 'preview' && (
                <div className="vf-quick">
                  <span>Preview as</span>
                  <button type="button" onClick={() => { setEmail(SAMPLE_PEOPLE.dami.email); setEmailErr(''); }}>Owner</button>
                  <Tag kind="demo" show={ann} label="Preview mode" />
                </div>
              )}
              <button className="btn btn-primary vf-cta" type="submit" disabled={step === 'sending'}>
                {step === 'sending' ? 'Sending code…' : 'Email me a code'}<span className="arr"><Icon name="arrow" size="sm" /></span>
              </button>
              <p className="kc-fine">We only use your email to sign you in and send account updates.</p>
            </form>
          )}

          {(step === 'code' || step === 'checking') && (
            <form onSubmit={check} noValidate>
              <span className="kc-kicker">Step 4 of 6 · Check your email</span>
              <h1>Enter the 6-digit code</h1>
              <p className="vf-lead">{mode === 'preview' ? 'In preview mode no email is sent.' : <>We sent it to <b>{email.trim()}</b>.</>} <button type="button" className="vf-link" onClick={() => setStep('email')}>Change email</button></p>
              {joining && <div className="kc-banner banner-info"><span className="ico"><Icon name="info" size="sm" /></span><div><b>Your company already has a workspace: {joining}.</b> You’ll join it as a team member. Your draft won’t replace theirs.</div></div>}
              {mode === 'preview' && <div className="vf-sim" role="note"><Icon name="info" size="sm" /><span><b>Preview only.</b> Your code is <b className="mono">{PREVIEW_CODE}</b>. Nothing is saved to an account.</span><Tag kind="demo" show={ann} /></div>}
              {devCode && <div className="vf-sim" role="note"><Icon name="info" size="sm" /><span><b>Local development.</b> Code: <b className="mono">{devCode}</b></span></div>}
              <fieldset className="vf-code" aria-describedby={codeErr ? 'vf-code-err' : 'vf-code-hint'}>
                <legend className="sr-only">6-digit code</legend>
                {digits.map((v, i) => (
                  <input key={i + '-' + resent} ref={(el) => { boxes.current[i] = el; }} value={v} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={i === 0 ? 6 : 1} aria-label={'Digit ' + (i + 1)} aria-invalid={!!codeErr} className={codeErr ? 'bad' : ''}
                    onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} />
                ))}
              </fieldset>
              <div aria-live="polite">
                {codeErr ? <div id="vf-code-err" className="kc-field-err vf-err" role="alert"><Icon name="alert" size="sm" />{codeErr}<Tag kind="failure" show={ann} label="Wrong code" /></div>
                  : <div id="vf-code-hint" className="vf-hint">The code works for 10 minutes. Check spam or promotions if it hasn’t arrived.</div>}
              </div>
              <button className="btn btn-primary vf-cta" type="submit" disabled={step === 'checking'}>
                {step === 'checking' ? 'Checking…' : 'Verify and save ' + kname}<span className="arr"><Icon name="arrow" size="sm" /></span>
              </button>
              <div className="vf-resend">
                {wait > 0 ? <span>You can send a new code in <b className="mono">0:{String(wait).padStart(2, '0')}</b></span>
                  : <button type="button" className="vf-link" onClick={() => send(null, true)}>Send a new code</button>}
                {resent > 0 && <span className="vf-ok"><Icon name="check" size="sm" />New code sent. Earlier codes no longer work.</span>}
              </div>
            </form>
          )}

          {step === 'expired' && (
            <div>
              <span className="kc-kicker">Step 4 of 6 · New code needed</span>
              <h1>That code no longer works</h1>
              <p className="vf-lead">{codeErr || 'Codes last 10 minutes.'} Send a new one to <b>{email.trim()}</b>. Your draft stays exactly as it is.</p>
              <div className="kc-banner banner-warn" role="status"><span className="ico"><Icon name="clock" size="sm" /></span><div><b>Nothing was lost.</b> {kname}’s name, services, greeting and test call are still here.<Tag kind="recovery" show={ann} /></div></div>
              <div className="vf-row">
                <button className="btn btn-primary" onClick={() => send(null, true)}>Send a new code<span className="arr"><Icon name="arrow" size="sm" /></span></button>
                <button className="btn btn-ghost" onClick={() => setStep('email')}><span>Use a different email</span></button>
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div>
              <span className="kc-kicker">Step 4 of 6 · Saved</span>
              <h1>{result.joined ? 'You’ve joined ' + wsBiz : kname + ' is saved'}</h1>
              <p className="vf-lead">
                {result.preview ? 'Preview only: this opens a sample workspace.'
                  : result.joined ? 'Your email is verified and you’re now part of the ' + wsBiz + ' workspace.'
                    : 'Your email is verified and ' + kname + ' is saved to the ' + wsBiz + ' workspace.'}
                {' '}Nothing is live yet. Callers won’t reach {kname} until a number is active.
              </p>
              <div className="vf-role">
                <span className="vf-av">{(result.me && result.me.name ? result.me.name : 'You').split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
                <div>
                  <b>Signed in as {result.me ? result.me.name : 'you'}</b>
                  <span>{result.me ? result.me.email : email}</span>
                  <span className={'kc-pill ' + (role === 'owner' ? 'pill-live' : 'pill-neutral')}><span className="dot" />{role === 'owner' ? 'Owner/admin · can assign and record outcomes' : 'Member · can view, can’t change'}</span>
                </div>
              </div>
              {role === 'member' && <div className="kc-banner banner-info"><span className="ico"><Icon name="info" size="sm" /></span><div><b>An owner manages this workspace.</b> You can see everything, and an owner or admin records outcomes.<Tag kind="flag" show={ann} label="Member permissions" /></div></div>}
              <button className="btn btn-primary vf-cta" onClick={() => (result.preview ? onPreviewDone() : onDone(result))}>Open the Command Centre<span className="arr"><Icon name="arrow" size="sm" /></span></button>
            </div>
          )}
        </section>

        <aside className="vf-side" aria-label="Your draft">
          <div className="vf-klaro"><Klaro mood={mood} size={150} decorative /></div>
          <div className="vf-draft">
            <div className="vf-draft-head"><b>Your draft</b><span className={'kc-pill ' + (step === 'done' ? 'pill-live' : 'pill-neutral')}><span className="dot" />{step === 'done' ? (result && result.joined ? 'Team workspace' : 'Saved') : 'Kept in this browser'}</span></div>
            <dl>
              <div><dt>Receptionist</dt><dd>{kname} for {biz}</dd></div>
              {d.url && <div><dt>Website</dt><dd>{d.url}</dd></div>}
              <div><dt>Services</dt><dd>{(d.services || []).join(', ') || 'None added yet'}</dd></div>
              <div><dt>Voice</dt><dd>{d.voice === 'bright' ? 'Bright' : d.voice === 'calm' ? 'Calm' : 'Warm'}</dd></div>
              <div><dt>Test call</dt><dd>{d.testCall === 'completed' ? 'Demo summary attached · not counted as a real call' : d.testCall === 'preview' ? 'Browser preview only' : 'Not tried yet'}</dd></div>
              <div><dt>Status</dt><dd>Not live · no number yet</dd></div>
            </dl>
            <Tag kind="pending" show={ann} label="Draft preserved through verification" />
          </div>
        </aside>
      </main>
    </div>
  );
}
