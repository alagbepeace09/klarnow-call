import { useEffect, useRef, useState } from 'react';
import Icon from './components/Icons.jsx';
import Klaro from './components/Klaro.jsx';
import { Brand, ThemeToggle } from './components/Brand.jsx';
import { Tag } from './components/Review.jsx';
import { PEOPLE } from './workspace/model.js';

const DEMO_CODE = '482913';
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());

/** 04 Email + code. Keeps the draft from 02/03 through verification. */
export default function Verify({ draft, onHome, onBack, onDone, theme, onToggleTheme, motion, ann }) {
  const [step, setStep] = useState('email'); // email | sending | code | checking | expired | done
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [codeErr, setCodeErr] = useState('');
  const [wait, setWait] = useState(0);
  const [sentAt, setSentAt] = useState(0);
  const [resent, setResent] = useState(0);
  const boxes = useRef([]);
  const live = useRef(null);
  const d = draft || { bizName: 'Canal Street Kitchen', klaroName: 'Klaro', services: ['Table bookings', 'Group bookings', 'Private dining', 'Allergy questions'], voice: 'warm', testCall: 'none' };
  const kname = d.klaroName || 'Klaro';

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  useEffect(() => { if (step === 'code' && boxes.current[0]) boxes.current[0].focus(); }, [step, resent]);

  const role = email.trim().toLowerCase() === PEOPLE.tolu.email ? 'member' : 'owner';
  const person = role === 'member' ? PEOPLE.tolu : PEOPLE.dami;

  const send = (e) => {
    if (e) e.preventDefault();
    if (!validEmail(email)) { setEmailErr('Enter an email address like name@business.co.uk.'); return; }
    setEmailErr('');
    setStep('sending');
    setTimeout(() => { setStep('code'); setWait(30); setSentAt(Date.now()); setDigits(['', '', '', '', '', '']); setCodeErr(''); }, 900);
  };
  const resend = () => {
    setDigits(['', '', '', '', '', '']); setCodeErr(''); setWait(30); setSentAt(Date.now()); setResent(resent + 1); setStep('code');
  };
  const setDigit = (i, v) => {
    const clean = v.replace(/\D/g, '');
    const n = digits.slice();
    if (clean.length > 1) { // paste
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
  const check = (e) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) { setCodeErr('Enter all 6 digits.'); return; }
    setStep('checking');
    setTimeout(() => {
      if (code !== DEMO_CODE) { setStep('code'); setCodeErr('That code doesn’t match. Check the latest email, or send a new code.'); return; }
      setStep('done');
    }, 800);
  };
  const expire = () => { setStep('expired'); setDigits(['', '', '', '', '', '']); setCodeErr(''); };

  const mood = step === 'done' ? 'success' : step === 'expired' || codeErr ? 'attention' : step === 'sending' || step === 'checking' ? 'working' : step === 'code' ? 'listening' : 'welcome';

  return (
    <div className={'kc' + (motion === 'reduce' ? ' rm' : '')}>
      <header className="kc-top">
        <Brand onClick={(e) => { e.preventDefault(); onHome(); }} />
        <div className="kc-top-mid"><span className="kc-chip"><Icon name="shield" size="sm" /><span>Save your draft</span></span></div>
        <div className="kc-top-right">
          <span className="kc-pill pill-demo"><span className="dot" />Preview · not live</span>
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
              <p className="vf-lead">We’ll email you a 6-digit code. Enter it here to save {kname} to your workspace. No password needed.</p>
              <div className="kc-field">
                <label className="kc-label" htmlFor="vf-email">Work email</label>
                <input id="vf-email" className={'kc-input' + (emailErr ? ' bad' : '')} type="email" autoComplete="email" inputMode="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailErr(''); }} aria-invalid={!!emailErr} aria-describedby={emailErr ? 'vf-email-err' : 'vf-email-hint'} placeholder="you@yourbusiness.co.uk" />
                {emailErr ? <div id="vf-email-err" className="kc-field-err vf-err" role="alert"><Icon name="alert" size="sm" />{emailErr}</div>
                  : <div id="vf-email-hint" className="vf-hint">Use the email your team knows you by. Owners and team members sign in the same way.</div>}
              </div>
              <div className="vf-quick">
                <span>Try as</span>
                <button type="button" onClick={() => { setEmail(PEOPLE.dami.email); setEmailErr(''); }}>Dami · owner</button>
                <button type="button" onClick={() => { setEmail(PEOPLE.tolu.email); setEmailErr(''); }}>Tolu · member</button>
                <Tag kind="demo" show={ann} label="Sample accounts" />
              </div>
              <button className="btn btn-primary vf-cta" type="submit" disabled={step === 'sending'}>
                {step === 'sending' ? 'Sending code…' : 'Email me a code'}<span className="arr"><Icon name="arrow" size="sm" /></span>
              </button>
              <p className="kc-fine">By continuing you agree to the terms and privacy notice. We only use your email to sign you in and send account updates.</p>
            </form>
          )}

          {(step === 'code' || step === 'checking') && (
            <form onSubmit={check} noValidate>
              <span className="kc-kicker">Step 4 of 6 · Check your email</span>
              <h1>Enter the 6-digit code</h1>
              <p className="vf-lead">We sent it to <b>{email.trim()}</b>. <button type="button" className="vf-link" onClick={() => setStep('email')}>Change email</button></p>
              <div className="vf-sim" role="note">
                <Icon name="info" size="sm" />
                <span><b>Simulated email.</b> Nothing was sent. Your demo code is <b className="mono">{DEMO_CODE}</b>.</span>
                <Tag kind="demo" show={ann} />
              </div>
              <fieldset className="vf-code" aria-describedby={codeErr ? 'vf-code-err' : 'vf-code-hint'}>
                <legend className="sr-only">6-digit code</legend>
                {digits.map((v, i) => (
                  <input key={i + '-' + resent} ref={(el) => { boxes.current[i] = el; }} value={v} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={i === 0 ? 6 : 1} aria-label={'Digit ' + (i + 1)} aria-invalid={!!codeErr} className={codeErr ? 'bad' : ''}
                    onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} />
                ))}
              </fieldset>
              <div ref={live} aria-live="polite">
                {codeErr ? <div id="vf-code-err" className="kc-field-err vf-err" role="alert"><Icon name="alert" size="sm" />{codeErr}<Tag kind="failure" show={ann} label="Wrong code" /></div>
                  : <div id="vf-code-hint" className="vf-hint">The code works for 10 minutes. Check spam if it hasn’t arrived.</div>}
              </div>
              <button className="btn btn-primary vf-cta" type="submit" disabled={step === 'checking'}>
                {step === 'checking' ? 'Checking…' : 'Verify and save ' + kname}<span className="arr"><Icon name="arrow" size="sm" /></span>
              </button>
              <div className="vf-resend">
                {wait > 0 ? <span>You can send a new code in <b className="mono">0:{String(wait).padStart(2, '0')}</b></span>
                  : <button type="button" className="vf-link" onClick={resend}>Send a new code</button>}
                {resent > 0 && <span className="vf-ok"><Icon name="check" size="sm" />New code sent{sentAt ? '' : ''}. Earlier codes no longer work.</span>}
              </div>
              {ann && <button type="button" className="vf-sim-btn" onClick={expire}>Review: let the code expire</button>}
            </form>
          )}

          {step === 'expired' && (
            <div>
              <span className="kc-kicker">Step 4 of 6 · Code expired</span>
              <h1>That code has expired</h1>
              <p className="vf-lead">Codes last 10 minutes. Send a new one to <b>{email.trim()}</b> and your draft stays exactly as it is.</p>
              <div className="kc-banner banner-warn" role="alert"><span className="ico"><Icon name="clock" size="sm" /></span><div><b>Nothing was lost.</b> {kname}’s name, services, greeting and test call summary are still saved in this browser.<Tag kind="recovery" show={ann} /></div></div>
              <div className="vf-row">
                <button className="btn btn-primary" onClick={resend}>Send a new code<span className="arr"><Icon name="arrow" size="sm" /></span></button>
                <button className="btn btn-ghost" onClick={() => setStep('email')}><span>Use a different email</span></button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div>
              <span className="kc-kicker">Step 4 of 6 · Saved</span>
              <h1>{kname} is saved</h1>
              <p className="vf-lead">Your email is verified and {kname} is in the {d.bizName} workspace. Nothing is live yet. Callers won’t reach {kname} until a number is active.</p>
              <div className="vf-role">
                <span className="vf-av">{person.name.split(' ').map((w) => w[0]).join('')}</span>
                <div>
                  <b>Signed in as {person.name}</b>
                  <span>{person.email}</span>
                  <span className={'kc-pill ' + (role === 'owner' ? 'pill-live' : 'pill-neutral')}><span className="dot" />{role === 'owner' ? 'Owner/admin · can assign and record outcomes' : 'Member · ' + person.team + ' · can view, can’t change'}</span>
                </div>
              </div>
              {role === 'member' && <div className="kc-banner banner-info"><span className="ico"><Icon name="info" size="sm" /></span><div><b>{PEOPLE.dami.name} owns this workspace.</b> You’ve joined as a team member. Your own draft wasn’t added; ask an owner if anything needs changing.</div></div>}
              <button className="btn btn-primary vf-cta" onClick={() => onDone(role)}>Open the Command Centre<span className="arr"><Icon name="arrow" size="sm" /></span></button>
            </div>
          )}
        </section>

        <aside className="vf-side" aria-label="Your draft">
          <div className="vf-klaro"><Klaro mood={mood} size={150} decorative /></div>
          <div className="vf-draft">
            <div className="vf-draft-head"><b>Your draft</b><span className={'kc-pill ' + (step === 'done' ? 'pill-live' : 'pill-neutral')}><span className="dot" />{step === 'done' ? 'Saved to workspace' : 'Kept in this browser'}</span></div>
            <dl>
              <div><dt>Receptionist</dt><dd>{kname} for {d.bizName}</dd></div>
              <div><dt>Services</dt><dd>{(d.services || []).join(', ')}</dd></div>
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
