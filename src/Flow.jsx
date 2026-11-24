import { Component } from 'react';
import Klaro from './components/Klaro.jsx';
import Icon, { LogoMark } from './components/Icons.jsx';
import Ally from './components/Ally.jsx';
import { PRESETS, kindFrom, cleanUrl, validUrl, nameFrom, greetingFor, sampleScript, speak, stopSpeech } from './data.js';

const VOICES = { warm: ['Warm', 'Friendly, British'], bright: ['Bright', 'Upbeat, quick'], calm: ['Calm', 'Low, unhurried'] };
const KINDS = ['plumbing', 'dental', 'salon', 'restaurant'];
const ORDER = ['requesting', 'dialling', 'ringing', 'connected', 'completed'];

function fill(kind, url, manual) {
  const p = PRESETS[kind];
  const name = manual ? '' : nameFrom(url);
  return {
    kind: manual ? '' : kind,
    bizName: name,
    bizDesc: manual ? '' : p.desc,
    services: manual ? [] : p.services.slice(),
    facts: p.facts.map((f) => ({ k: f[0], v: manual ? '' : f[1], check: manual ? false : f[2], ph: f[1] })),
    greeting: greetingFor(name || 'your business', 'Klaro'),
    greetingTouched: false
  };
}

const JUMPS = [
  ['scanning', '02 Scanning'], ['review', '02 Review'], ['scan-failed', '02 Scan failed'], ['manual', '02 Manual'],
  ['call', '03 Call form'], ['ringing', '03 Ringing'], ['connected', '03 Connected'], ['summary', '03 Summary'],
  ['unanswered', '03 No answer'], ['call-failed', '03 Failed'], ['preview', '03 Browser preview']
];

export default class Flow extends Component {
  constructor(props) {
    super(props);
    this.timers = [];
    const init = props.init || {};
    const manual = !!init.manual || !validUrl(init.url || '');
    const url = manual ? '' : cleanUrl(init.url);
    this.state = Object.assign(
      {
        step: 'gen', gen: manual ? 'manual' : 'scanning', scanIdx: 0, url,
        klaroName: 'Klaro', voice: 'warm', voiceOpen: false, newSvc: '',
        cc: '+44', phone: '', consent: false,
        call: 'idle', seconds: 0, talk: 'speaking', summaryReady: false, scriptIdx: 0, previewDone: false,
        saveOpen: false, toast: '', protoOpen: false, simScan: 'success', simCall: 'answered', rm: false, playing: false
      },
      fill(manual ? 'plumbing' : kindFrom(url), url, manual)
    );
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    if (this.state.gen === 'scanning') this.runScan(0);
  }
  componentWillUnmount() { this.clearTimers(); stopSpeech(); clearTimeout(this.toastT); }

  later(fn, ms) { const t = setTimeout(fn, ms); this.timers.push(t); return t; }
  clearTimers() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    if (this.tick) { clearInterval(this.tick); this.tick = null; }
  }
  toTop() { try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); } }
  toast(msg) { this.setState({ toast: msg }); clearTimeout(this.toastT); this.toastT = setTimeout(() => this.setState({ toast: '' }), 3600); }
  reset(over, cb) { this.clearTimers(); stopSpeech(); this.toTop(); this.setState(Object.assign({ saveOpen: false, protoOpen: false, playing: false }, over), cb); }

  runScan(from) {
    const fails = this.state.simScan === 'fails';
    let i = from || 0;
    const step = () => {
      if (fails && i >= 1) { this.later(() => this.setState({ gen: 'failed' }), 1400); return; }
      i += 1;
      this.setState({ scanIdx: i });
      if (i >= 5) { this.later(() => this.setState({ gen: 'review' }), 700); return; }
      this.later(step, 850 + (i % 2) * 250);
    };
    this.later(step, 700);
  }

  runCall(from) {
    const outcome = this.state.simCall;
    const go = (c, ms, next) => this.later(() => { this.setState({ call: c }); if (next) next(); }, ms);
    if (from === 'requesting') {
      if (outcome === 'fails') { go('failed', 1800); return; }
      go('dialling', 1400, () => this.runCall('dialling'));
    } else if (from === 'dialling') {
      go('ringing', 1800, () => this.runCall('ringing'));
    } else if (from === 'ringing') {
      if (outcome === 'unanswered') { go('unanswered', 5200); return; }
      this.later(() => { this.setState({ call: 'connected', seconds: 0, talk: 'speaking' }); this.runConnected(); }, 3400);
    }
  }

  runConnected() {
    if (this.tick) clearInterval(this.tick);
    this.tick = setInterval(() => {
      const s = this.state.seconds + 1;
      this.setState({ seconds: s, talk: Math.floor(s / 4) % 2 === 0 ? 'speaking' : 'listening' });
      if (s >= 75) this.finishCall();
    }, 1000);
  }

  finishCall() {
    if (this.tick) { clearInterval(this.tick); this.tick = null; }
    this.setState({ call: 'completed', summaryReady: false });
    this.later(() => this.setState({ summaryReady: true }), 2400);
  }

  script() { const s = this.state; return sampleScript(s.bizName, s.klaroName, s.greeting, s.kind); }

  runPreview(from) {
    const lines = this.script();
    let i = from || 0;
    const next = () => {
      i += 1;
      if (i > lines.length) { this.setState({ previewDone: true }); return; }
      this.setState({ scriptIdx: i });
      const ln = lines[i - 1];
      if (ln.who === 'k') speak(ln.text, this.state.voice);
      this.later(next, ln.who === 'k' ? 4200 : 2400);
    };
    next();
  }

  jump(key) {
    const s = this.state;
    const url = s.url || 'brightsideplumbing.co.uk';
    const base = { url, call: 'idle', seconds: 0, summaryReady: false, scriptIdx: 0, previewDone: false };
    const callReady = { step: 'call', phone: s.phone || '7700 900123', consent: true };
    const filled = s.bizName ? {} : fill(kindFrom(url), url, false);
    const map = {
      scanning: () => this.reset({ ...base, ...fill(kindFrom(url), url, false), step: 'gen', gen: 'scanning', scanIdx: 0 }, () => this.runScan(0)),
      review: () => this.reset({ ...base, ...filled, step: 'gen', gen: 'review', scanIdx: 5 }),
      'scan-failed': () => this.reset({ ...base, step: 'gen', gen: 'failed', scanIdx: 1 }),
      manual: () => this.reset({ ...base, ...fill('plumbing', '', true), url: '', step: 'gen', gen: 'manual' }),
      call: () => this.reset({ ...base, ...filled, step: 'call' }),
      ringing: () => this.reset({ ...base, ...filled, ...callReady, call: 'ringing' }, () => this.runCall('ringing')),
      connected: () => this.reset({ ...base, ...filled, ...callReady, call: 'connected' }, () => this.runConnected()),
      summary: () => this.reset({ ...base, ...filled, ...callReady, call: 'completed', seconds: 72, summaryReady: true }),
      unanswered: () => this.reset({ ...base, ...filled, ...callReady, call: 'unanswered' }),
      'call-failed': () => this.reset({ ...base, ...filled, ...callReady, call: 'failed' }),
      preview: () => this.reset({ ...base, ...filled, step: 'call', call: 'preview' }, () => this.runPreview(0))
    };
    map[key]();
  }

  /* ---------- handlers ---------- */
  setFact(i, v) { const n = this.state.facts.slice(); n[i] = { ...n[i], v, check: false }; this.setState({ facts: n }); }
  addSvc() { const v = (this.state.newSvc || '').trim(); if (!v) return; this.setState({ services: this.state.services.concat([v]), newSvc: '' }); }
  removeSvc(i) { const n = this.state.services.slice(); n.splice(i, 1); this.setState({ services: n }); }
  pickKind(k) {
    const pr = PRESETS[k]; const s = this.state;
    this.setState({ kind: k, services: s.services.length ? s.services : pr.services.slice(0, 2), facts: pr.facts.map((f, i) => ({ k: f[0], v: (s.facts[i] && s.facts[i].v) || '', check: false, ph: f[1] })) });
  }
  onBizName(v) { const up = { bizName: v }; if (!this.state.greetingTouched) up.greeting = greetingFor(v || 'your business', this.state.klaroName); this.setState(up); }
  onKlaroName(v) { const up = { klaroName: v }; if (!this.state.greetingTouched) up.greeting = greetingFor(this.state.bizName || 'your business', v || 'Klaro'); this.setState(up); }
  retryScan() {
    const s = this.state;
    if (!validUrl(s.url)) { this.toast('Check the address first, for example yourbusiness.co.uk'); return; }
    const url = cleanUrl(s.url);
    this.reset({ ...fill(kindFrom(url), url, false), gen: 'scanning', scanIdx: 0, url }, () => this.runScan(0));
  }
  startManual() { this.reset({ ...fill('plumbing', '', true), step: 'gen', gen: 'manual', url: '' }); }
  callMe() { this.clearTimers(); this.setState({ call: 'requesting', seconds: 0, summaryReady: false }, () => this.runCall('requesting')); }
  callAgain() { this.clearTimers(); stopSpeech(); this.setState({ call: 'idle', seconds: 0, summaryReady: false, scriptIdx: 0, previewDone: false }); }
  editNumber() { this.callAgain(); setTimeout(() => { const el = document.getElementById('kc-tel'); if (el) el.focus(); }, 60); }
  startPreview() { this.clearTimers(); this.setState({ call: 'preview', scriptIdx: 0, previewDone: false }, () => this.runPreview(0)); }
  playGreeting() {
    const ok = speak(this.state.greeting, this.state.voice, () => this.setState({ playing: false }));
    if (ok) this.setState({ playing: true }); else this.toast('Your browser can’t play audio here. Try the demo call.');
  }

  /* ---------- render ---------- */
  render() {
    const s = this.state;
    const P = PRESETS[s.kind || 'plumbing'];
    const siteLabel = cleanUrl(s.url) || 'your business';
    const kname = s.klaroName || 'Klaro';
    const bizNameOr = s.bizName || 'your business';
    const voiceLabel = VOICES[s.voice][0] + ' voice';
    const onGen = s.step === 'gen', onCall = s.step === 'call';
    const c = s.call;
    const digits = (s.phone || '').replace(/\D/g, '');
    const phoneValid = digits.length >= 7 && digits.length <= 13;
    const ccPhone = s.cc + ' ' + (s.phone || '').replace(/^0/, '');
    const masked = s.cc + ' ' + (digits.length > 4 ? digits.replace(/^0/, '').slice(0, 4) + ' ••• ' + digits.slice(-3) : '•••');
    const factCount = s.facts.filter((f) => (f.v || '').trim()).length;
    const cannotHear = !(s.bizName || '').trim() || s.services.length === 0;
    const reviewTools = !(typeof window !== 'undefined' && /[?&]clean=1/.test(window.location.search));

    /* generator preview */
    let genMood = 'welcome', bubbleLabel = 'Greeting', bubbleText = s.greeting, idSub = 'Your virtual receptionist · ' + voiceLabel;
    if (s.gen === 'scanning') { genMood = 'working'; bubbleLabel = 'Learning'; bubbleText = 'I’m reading ' + siteLabel + ' so I can answer like your team. Hang on a moment.'; idSub = 'Getting to know your business'; }
    if (s.gen === 'failed') { genMood = 'attention'; bubbleLabel = 'Needs you'; bubbleText = 'I couldn’t open that page. Check the address, or tell me about your business yourself.'; idSub = 'Waiting for your details'; }
    if (s.gen === 'manual' && !s.bizName) { genMood = 'thinking'; bubbleLabel = 'Tell me more'; bubbleText = 'What’s your business called, and what do people usually call about?'; }
    if (s.playing) genMood = 'speaking';

    const scanDefs = [['Reading your homepage', '3 pages'], ['Finding your services', P.services.length + ' services'], ['Opening hours and area', 'Found'], ['Contact details', '1 email · 1 phone'], ['Writing ' + kname + '’s greeting', 'Ready']];
    const floats = [
      ['Business name found', { top: '16%', left: '6%' }], [P.services.length + ' services detected', { top: '42%', right: '6%' }],
      ['Opening hours checked', { top: '64%', left: '10%' }], ['Contact details found', { top: '82%', right: '10%' }]
    ].slice(0, Math.min(s.scanIdx, 4));

    /* call */
    let curIdx = ORDER.indexOf(c);
    if (c === 'failed') curIdx = 0;
    if (c === 'unanswered') curIdx = 2;
    const labels = { requesting: 'Requesting your call', dialling: 'Dialling your number', ringing: 'Your phone is ringing', connected: 'Connected to ' + kname, completed: 'Call completed' };
    const timeline = ORDER.map((k, i) => {
      let cls = 'todo', d = '';
      if (i < curIdx) cls = 'done';
      if (i === curIdx) cls = c === 'completed' ? 'done' : 'now';
      if (c === 'failed' && i === 0) { cls = 'bad'; d = 'The call couldn’t be placed. No call was made.'; }
      if (c === 'unanswered' && i === 2) { cls = 'warn'; d = 'Rang for 30 seconds with no answer.'; }
      if (c === 'requesting' && i === 0) d = 'Setting up a secure demo line.';
      if (c === 'dialling' && i === 1) d = 'Calling ' + ccPhone + '.';
      if (c === 'ringing' && i === 2) d = 'Answer to talk to ' + kname + '. We’ll stop after 30 seconds.';
      if (c === 'connected' && i === 3) d = 'Live now. Speak naturally.';
      const label = c === 'unanswered' && i === 2 ? 'No answer' : c === 'failed' && i === 0 ? 'Call couldn’t be placed' : labels[k];
      return { k, label, d, cls, n: cls === 'bad' || cls === 'warn' ? '!' : String(i + 1) };
    });
    const mm = Math.floor(s.seconds / 60), ss = s.seconds % 60;
    const timer = String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');

    let callMood = 'welcome', stagePill = 'Demo · not live', stagePillCls = '', stageBig = 'Ready when you are', stageSmall = kname + ' will ring your phone and answer as ' + bizNameOr + '.';
    let showRings = false, showTimer = false, showWave = false, waveCls = '', liveTitle = '', liveSub = '';
    if (c === 'requesting') { callMood = 'thinking'; stageBig = 'Requesting your call…'; stageSmall = 'Nothing has rung yet.'; liveTitle = 'Requesting your call'; liveSub = 'This takes a few seconds. Your phone hasn’t rung yet.'; }
    if (c === 'dialling') { callMood = 'working'; stageBig = 'Dialling…'; stageSmall = 'Calling ' + ccPhone + '. It hasn’t connected yet.'; liveTitle = 'Dialling your number'; liveSub = 'Your phone should ring in a moment.'; }
    if (c === 'ringing') { callMood = 'listening'; showRings = true; stageBig = 'Your phone is ringing'; stageSmall = 'Answer it to talk to ' + kname + '. Not connected yet.'; liveTitle = 'Answer your phone'; liveSub = 'It’s ringing now from a Klarnow number. Answer it to talk to ' + kname + '.'; }
    if (c === 'connected') { callMood = s.talk; stagePill = 'Live demo call'; stagePillCls = 'live'; showTimer = true; showWave = true; waveCls = s.talk === 'listening' ? 'listen' : ''; stageBig = kname + (s.talk === 'speaking' ? ' is speaking' : ' is listening'); stageSmall = 'The transcript and summary appear when the call ends.'; liveTitle = 'You’re talking to ' + kname; liveSub = 'Play a customer. ' + kname + ' only uses what you approved.'; }
    if (c === 'completed') { callMood = 'success'; stagePill = 'Call ended'; showTimer = true; showWave = true; waveCls = 'still'; stageBig = 'Call completed'; stageSmall = s.summaryReady ? 'Summary ready.' : 'Writing your summary…'; }
    if (c === 'failed') { callMood = 'attention'; stagePill = 'Call not placed'; stagePillCls = 'bad'; stageBig = 'The call didn’t go through'; stageSmall = 'No call was made and nothing was recorded.'; }
    if (c === 'unanswered') { callMood = 'attention'; stagePill = 'No answer'; stagePillCls = 'warn'; stageBig = 'No answer'; stageSmall = kname + ' didn’t speak to anyone.'; }
    const shown = this.script().slice(0, s.scriptIdx);
    if (c === 'preview') {
      const last = shown[shown.length - 1];
      const callerTalking = last && last.who === 'c';
      callMood = s.previewDone ? 'success' : callerTalking ? 'listening' : 'speaking';
      stagePill = 'Browser preview · not a call'; showWave = !s.previewDone; waveCls = callerTalking ? 'listen' : '';
      stageBig = s.previewDone ? 'Preview finished' : callerTalking ? 'Sample caller speaking' : kname + ' is speaking';
      stageSmall = 'Played in your browser. No phone call was made.';
    }
    const problem = c === 'failed' || c === 'unanswered';

    const Timeline = () => (
      <ol className="kc-timeline" aria-label="Call progress">
        {timeline.map((t) => (
          <li key={t.k} className={'kc-tl ' + t.cls}>
            <span className="b">{t.cls === 'done' ? <Icon name="check" size="sm" style={{ width: 13, height: 13 }} strokeWidth={2.6} /> : t.n}</span>
            <div><div className="t">{t.label}</div>{t.d && <div className="d">{t.d}</div>}</div>
          </li>
        ))}
      </ol>
    );

    return (
      <div className={'kc' + (s.rm ? ' rm' : '')}>
        <header className="kc-top">
          <a className="kc-logo" href="/" onClick={(e) => { e.preventDefault(); this.props.onHome(); }} aria-label="Klarnow Call home">KLARNOW<LogoMark /></a>
          <span className="kc-product">Call</span>
          <div className="kc-top-mid"><span className="kc-chip"><Icon name="globe" size="sm" /><span>{siteLabel}</span></span></div>
          <div className="kc-top-right">
            <span className={'kc-pill ' + (onCall && c === 'connected' ? 'pill-live' : 'pill-demo')}><span className="dot" />{onGen ? 'Preview · not live' : c === 'connected' ? 'Live demo call' : 'Demo · not live'}</span>
          </div>
        </header>

        {onGen && (
          <main className="kc-app">
            <div className="kc-panel">
              <div><button className="back" onClick={() => this.props.onHome()}><Icon name="back" size="sm" /><span>Change website</span></button></div>

              {s.gen === 'scanning' && (<>
                <div>
                  <span className="kc-kicker"><Icon name="spark" size="sm" />Building your Klaro</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>Reading {siteLabel}</h1>
                  <p className="kc-sub">Klaro is learning what you do, so it can answer like someone on your team.</p>
                </div>
                <div className="kc-scan" role="status" aria-live="polite">
                  {scanDefs.map((d, i) => {
                    const done = i < s.scanIdx, active = i === s.scanIdx;
                    return (
                      <div key={i} className={'kc-scan-row ' + (done ? 'is-done' : active ? 'is-active' : '')}>
                        <span className="st">{done && <Icon name="check" size="sm" />}</span>{d[0]}
                        <span className="found">{done ? d[1] : active ? 'Reading…' : ''}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="kc-progress" aria-hidden="true"><i style={{ width: Math.round((s.scanIdx / 5) * 100) + '%' }} /></div>
                <div className="kc-meta"><span>Usually under a minute. You can edit everything next.</span><button className="link" onClick={() => this.startManual()}>Enter details myself</button></div>
              </>)}

              {s.gen === 'failed' && (<>
                <div>
                  <span className="kc-kicker" style={{ color: '#b42318' }}>Couldn't read the site</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>We couldn't read {siteLabel}</h1>
                  <p className="kc-sub">Nothing is wrong with your business. Some sites block automatic reading, are still loading, or the address has a typo.</p>
                </div>
                <div className="kc-banner banner-err" role="alert"><span className="ico"><Icon name="alert" size="sm" /></span><div><b>The page didn't respond in time.</b> We tried for 20 seconds. No details were saved.</div></div>
                <div className="kc-field">
                  <label className="kc-label" htmlFor="kc-url-retry">Check the address</label>
                  <input className="kc-input" id="kc-url-retry" type="text" inputMode="url" value={s.url} onChange={(e) => this.setState({ url: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') this.retryScan(); }} />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => this.retryScan()}>Try again</button>
                  <button className="btn btn-ghost" onClick={() => this.startManual()}>Enter details myself</button>
                </div>
                <p className="kc-fine">Entering details yourself takes about a minute: a name, what you do and your main services.</p>
              </>)}

              {(s.gen === 'review' || s.gen === 'manual') && (<>
                <div>
                  <span className="kc-kicker">{s.gen === 'manual' ? 'No website needed' : 'Ready for review'}</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>{s.gen === 'manual' ? 'Tell ' + kname + ' about your business' : 'Here’s what ' + kname + ' learned'}</h1>
                  <p className="kc-sub">{s.gen === 'manual' ? 'Just the basics: a name, what you do and what people call about. You can add more later.' : 'Check the details callers will hear. Change only what matters. Everything else can wait.'}</p>
                </div>
                {s.gen === 'review' && (
                  <div className="kc-banner banner-ok" role="status"><span className="ico"><Icon name="check" size="sm" /></span><div><b>Found {2 + s.services.length + s.facts.length} details on your site.</b> Items marked <b>Check</b> are guesses. Confirm them before callers hear them.</div></div>
                )}
                <div className="kc-form">
                  <div className="kc-field">
                    <label className="kc-label" htmlFor="kc-biz">Business name{s.gen === 'review' && <span className="kc-src">From your site</span>}</label>
                    <input className="kc-input" id="kc-biz" type="text" placeholder="e.g. Brightside Plumbing" value={s.bizName} onChange={(e) => this.onBizName(e.target.value)} />
                  </div>
                  {s.gen === 'manual' && (
                    <div className="kc-field">
                      <span className="kc-label">Type of business</span>
                      <div className="kc-chips">
                        {KINDS.map((k) => (
                          <button key={k} className="kc-svc" aria-pressed={s.kind === k} onClick={() => this.pickKind(k)} style={s.kind === k ? { background: '#111', color: '#fff', borderColor: '#111', paddingRight: 14 } : { paddingRight: 14 }}>{PRESETS[k].label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="kc-field">
                    <label className="kc-label" htmlFor="kc-desc">What you do{s.gen === 'review' && <span className="kc-src">From your site</span>}</label>
                    <textarea className="kc-textarea" id="kc-desc" placeholder="One or two sentences, the way you'd say it on the phone." value={s.bizDesc} onChange={(e) => this.setState({ bizDesc: e.target.value })} />
                  </div>
                  <div className="kc-field">
                    <span className="kc-label">Services callers ask about<span className="kc-src">{s.services.length} added</span></span>
                    <div className="kc-chips">
                      {s.services.map((label, i) => (
                        <span key={label + i} className="kc-svc">{label}<button onClick={() => this.removeSvc(i)} aria-label={'Remove ' + label}><Icon name="close" size="sm" /></button></span>
                      ))}
                    </div>
                    <div className="kc-add">
                      <label className="sr" htmlFor="kc-newsvc">Add a service</label>
                      <input className="kc-input" id="kc-newsvc" type="text" placeholder="Add a service" value={s.newSvc} onChange={(e) => this.setState({ newSvc: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); this.addSvc(); } }} />
                      <button className="btn btn-ghost btn-sm" style={{ height: 44 }} onClick={() => this.addSvc()}>Add</button>
                    </div>
                  </div>
                  <div className="kc-field">
                    <span className="kc-label">Key facts {kname} can share</span>
                    <div className="kc-facts">
                      {s.facts.map((f, i) => (
                        <div className="kc-fact" key={f.k}>
                          <label className="k" htmlFor={'fact-' + i}>{f.k}</label>
                          <input id={'fact-' + i} type="text" value={f.v} placeholder={'e.g. ' + f.ph} onChange={(e) => this.setFact(i, e.target.value)} />
                          {f.check ? <span className="kc-src check">Check</span> : <span />}
                        </div>
                      ))}
                    </div>
                    <span className="kc-hint">{kname} only shares facts listed here. Anything else, it takes a message for you.</span>
                  </div>

                  <div className={'kc-collapse' + (s.voiceOpen ? ' open' : '')}>
                    <button className="kc-collapse-head" onClick={() => this.setState({ voiceOpen: !s.voiceOpen })} aria-expanded={s.voiceOpen} aria-controls="kc-voice-body">
                      <span className="kc-avatar"><Klaro mood="welcome" size={40} decorative /></span>
                      <span><span className="t" style={{ display: 'block' }}>{kname} · {voiceLabel}</span><span className="d" style={{ display: 'block' }}>Name, voice and greeting. The defaults work, so change only what matters.</span></span>
                      <Icon name="chev" className="chev" />
                    </button>
                    {s.voiceOpen && (
                      <div className="kc-collapse-body" id="kc-voice-body">
                        <div className="kc-field">
                          <label className="kc-label" htmlFor="kc-kname">Receptionist name<span className="kc-src">Default</span></label>
                          <input className="kc-input" id="kc-kname" type="text" value={s.klaroName} onChange={(e) => this.onKlaroName(e.target.value)} />
                        </div>
                        <div className="kc-field">
                          <span className="kc-label">Voice</span>
                          <div className="kc-voices" role="radiogroup" aria-label="Voice">
                            {Object.keys(VOICES).map((v) => (
                              <button key={v} className={'kc-voice' + (s.voice === v ? ' on' : '')} role="radio" aria-checked={s.voice === v} onClick={() => this.setState({ voice: v }, () => speak('Hi, this is ' + kname + '. Thanks for calling ' + bizNameOr + '.', v))}>
                                <b>{VOICES[v][0]}</b><span className="vd">{VOICES[v][1]}</span>
                                {s.voice === v && <span className="tick"><Icon name="check" size="sm" style={{ width: 11, height: 11 }} strokeWidth={3} /></span>}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="kc-field">
                          <label className="kc-label" htmlFor="kc-greet">Greeting<button className="link" style={{ fontSize: 13, fontWeight: 400 }} onClick={() => this.setState({ greeting: greetingFor(s.bizName || 'your business', kname), greetingTouched: false })}>Reset</button></label>
                          <textarea className="kc-textarea" id="kc-greet" value={s.greeting} onChange={(e) => this.setState({ greeting: e.target.value, greetingTouched: true })} />
                          <span className="kc-hint">{kname} always says it's a virtual receptionist. That stays in.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="kc-cta-bar">
                  <button className="btn btn-primary btn-lg" disabled={cannotHear} onClick={() => this.reset({ step: 'call', call: 'idle' })}>Let me hear {kname}<Icon name="arrow" /></button>
                  <span className="note"><Icon name="phone" size="sm" /><span>{cannotHear ? 'Add a business name and at least one service' : 'Next: ' + kname + ' rings your phone'}</span></span>
                </div>
              </>)}
            </div>

            <aside className="kc-side" aria-label={kname + ' preview'}>
              <div className="kc-side-inner">
                {s.gen === 'scanning' && (
                  <div className="kc-browser kc-hide-sm">
                    <div className="kc-browser-bar"><i /><i /><i /><span className="addr">https://{siteLabel}</span></div>
                    <div className="kc-browser-body">
                      <div className="sk sk-h" /><div className="sk sk-l" style={{ width: '88%' }} /><div className="sk sk-l" style={{ width: '72%' }} />
                      <div className="sk sk-img" />
                      <div className="sk-row"><div className="sk sk-card" /><div className="sk sk-card" /><div className="sk sk-card" /></div>
                      <div className="sk sk-l" style={{ width: '54%' }} />
                      <div className="kc-scanline" />
                      <div className="kc-floats">
                        {floats.map((f) => (<span key={f[0]} className="kc-float" style={f[1]}><span className="ok"><Icon name="check" size="sm" style={{ width: 11, height: 11 }} strokeWidth={3} /></span>{f[0]}</span>))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="kc-id kc-id-compact">
                  <div className="kc-id-top"><span className="kc-tag-dark"><span className="dot" />Preview · not live</span><span className="kc-tag-dark">{voiceLabel}</span></div>
                  <div className="kc-id-stage"><div className="kc-beam" /><div className="kc-pool" /><div style={{ position: 'relative', zIndex: 2 }}><Klaro mood={genMood} size={210} /></div></div>
                  <div className="kc-id-name"><b>{kname} for {bizNameOr}</b><span className="sub">{idSub}</span></div>
                  <div className="kc-bubble" aria-live="polite"><small>{bubbleLabel}</small>{bubbleText}</div>
                  {(s.gen === 'review' || s.gen === 'manual') && (<>
                    <ul className="kc-can">
                      <li><Icon name="check" /><span>Answers questions about {s.services.length} services and {factCount} key facts</span></li>
                      <li><Icon name="check" /><span>Takes the caller's name, number and what they need</span></li>
                      <li><Icon name="check" /><span>Tells you straight away, and flags anything urgent</span></li>
                    </ul>
                    <div className="kc-id-actions">
                      <button className="btn btn-ghost-dark btn-sm" onClick={() => this.playGreeting()}><Icon name="play" size="sm" />{s.playing ? 'Playing…' : 'Play greeting'}</button>
                      <span className="kc-tag-dark secondary">Plays in your browser</span>
                    </div>
                  </>)}
                </div>
              </div>
            </aside>
          </main>
        )}

        {onCall && (
          <main className="kc-app">
            <div className="kc-panel">
              <div><button className="back" onClick={() => this.reset({ step: 'gen', gen: s.gen === 'manual' ? 'manual' : 'review', call: 'idle' })}><Icon name="back" size="sm" /><span>Edit {kname}</span></button></div>

              {c === 'idle' && (<>
                <div>
                  <span className="kc-kicker">Demo call</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>Hear {kname} answer as {bizNameOr}.</h1>
                  <p className="kc-sub">We'll ring your phone now. Play a customer: ask about a service or try to book a visit.</p>
                </div>
                <div className="kc-form">
                  <div className="kc-field">
                    <label className="kc-label" htmlFor="kc-tel">Your mobile number</label>
                    <div className="kc-phone">
                      <label className="sr" htmlFor="kc-cc">Country code</label>
                      <select className="kc-select kc-input" id="kc-cc" value={s.cc} onChange={(e) => this.setState({ cc: e.target.value })}>
                        <option value="+44">GB +44</option><option value="+234">NG +234</option><option value="+353">IE +353</option><option value="+233">GH +233</option><option value="+1">US +1</option>
                      </select>
                      <input className="kc-input" id="kc-tel" type="tel" autoComplete="tel-national" inputMode="tel" placeholder={s.cc === '+234' ? '803 123 4567' : s.cc === '+1' ? '201 555 0123' : '7700 900123'} value={s.phone} onChange={(e) => this.setState({ phone: e.target.value.replace(/[^\d\s]/g, '') })} aria-describedby="kc-tel-hint" />
                    </div>
                    <span className="kc-hint" id="kc-tel-hint">Used for this demo call only. We don't keep it unless you save {kname}.</span>
                  </div>
                  <label className="kc-consent" htmlFor="kc-consent">
                    <input type="checkbox" id="kc-consent" checked={s.consent} onChange={() => this.setState({ consent: !s.consent })} />
                    <span>Yes, ring me now with one demo call from Klarnow. The call is recorded so I get a summary. <button className="link" onClick={(e) => { e.preventDefault(); this.toast('The privacy notice opens in a drawer in the build.'); }}>Privacy notice</button></span>
                  </label>
                  <button className="btn btn-primary btn-lg btn-block" disabled={!(phoneValid && s.consent)} onClick={() => this.callMe()}><Icon name="phone" />Call me now</button>
                  <span className="kc-fine" style={{ textAlign: 'center' }}>{!phoneValid ? 'Enter your mobile number to continue' : !s.consent ? 'Tick the box to agree to the demo call' : 'One call, about two minutes. Standard rates may apply.'}</span>
                  <div className="kc-or">or</div>
                  <button className="btn btn-ghost btn-block" onClick={() => this.startPreview()}><Icon name="speaker" size="sm" />Can't take a call? Play a browser preview</button>
                </div>
              </>)}

              {['requesting', 'dialling', 'ringing', 'connected'].includes(c) && (<>
                <div>
                  <span className="kc-kicker"><span>Demo call · {ccPhone}</span></span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>{liveTitle}</h1>
                  <p className="kc-sub">{liveSub}</p>
                </div>
                <Timeline />
                {c === 'connected' && (
                  <div className="kc-field"><span className="kc-label">Things to try</span>
                    <div className="kc-tries"><span className="kc-try">"Can someone come Thursday morning?"</span><span className="kc-try">"How much is a call-out?"</span><span className="kc-try">"It's urgent, there's water everywhere."</span></div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {c === 'connected'
                    ? <button className="btn btn-primary" style={{ background: '#b42318' }} onClick={() => this.finishCall()}>End call</button>
                    : <button className="btn btn-ghost" onClick={() => { this.clearTimers(); this.setState({ call: 'idle' }); this.toast('Call cancelled. No call was connected.'); }}>Cancel call</button>}
                </div>
              </>)}

              {c === 'completed' && (<>
                <div>
                  <span className="kc-kicker" style={{ color: '#2f4000' }}><span>Call completed · {mm} min {ss} sec</span></span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>That's how {kname} handles your calls.</h1>
                  <p className="kc-sub">Here's what {kname} would send you after this call. Every call ends with one of these.</p>
                </div>
                {!s.summaryReady ? (
                  <div className="kc-summary" role="status" aria-live="polite">
                    <div className="kc-summary-head"><b>Preparing your summary…</b><span className="kc-pill pill-neutral">Usually a few seconds</span></div>
                    <div className="kc-skel"><div className="sk sk-l" style={{ width: '40%' }} /><div className="sk sk-l" style={{ width: '86%' }} /><div className="sk sk-l" style={{ width: '64%' }} /><div className="sk sk-l" style={{ width: '78%' }} /></div>
                  </div>
                ) : (
                  <SummaryCard sum={P.sum} phone={masked} kname={kname} />
                )}
                <div className="kc-cta-bar">
                  <button className="btn btn-primary btn-lg" onClick={() => { stopSpeech(); this.setState({ saveOpen: true }); }}>Save my Klaro<Icon name="arrow" /></button>
                  <button className="btn btn-ghost btn-lg" onClick={() => this.callAgain()}>Call me again</button>
                </div>
              </>)}

              {problem && (<>
                <div>
                  <span className="kc-kicker" style={{ color: c === 'failed' ? '#b42318' : '#7a4300' }}>{c === 'failed' ? 'Call not placed' : 'No answer'}</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>{c === 'failed' ? 'We couldn’t place the call' : 'Your phone wasn’t answered'}</h1>
                  <p className="kc-sub">{c === 'failed' ? 'No call was made and nothing was recorded. This can happen if the number is wrong or the network is busy.' : 'It rang for 30 seconds. ' + kname + ' didn’t speak to anyone and nothing was recorded.'}</p>
                </div>
                <Timeline />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => this.callAgain()}>{c === 'failed' ? 'Try again' : 'Call me again'}</button>
                  <button className="btn btn-ghost" onClick={() => this.editNumber()}>Change number</button>
                  <button className="btn btn-ghost" onClick={() => this.startPreview()}>Browser preview</button>
                </div>
              </>)}

              {c === 'preview' && (<>
                <div>
                  <span className="kc-kicker">Browser preview · this is not a phone call</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>{s.previewDone ? 'That’s ' + kname + ' on a typical call.' : 'Listen to ' + kname + ' handle a call'}</h1>
                  <p className="kc-sub">A sample conversation in {kname}'s voice, using your details. For the real thing, ask {kname} to ring you.</p>
                </div>
                <div className="kc-script" aria-live="polite">
                  {shown.map((l, i) => (<div key={i} className={'kc-line ' + l.who}><small>{l.who === 'k' ? kname : 'Caller (sample)'}</small>{l.text}</div>))}
                </div>
                <div className="kc-cta-bar">
                  {s.previewDone && <button className="btn btn-primary btn-lg" onClick={() => this.setState({ saveOpen: true })}>Save my Klaro<Icon name="arrow" /></button>}
                  {!s.previewDone && <button className="btn btn-ghost btn-lg" onClick={() => { this.clearTimers(); stopSpeech(); this.setState({ previewDone: true, scriptIdx: this.script().length }); }}>Stop preview</button>}
                  <button className="btn btn-ghost btn-lg" onClick={() => this.editNumber()}>Call my phone instead</button>
                </div>
              </>)}
            </div>

            <aside className="kc-side" aria-label="Call status">
              <div className="kc-side-inner" style={{ height: '100%' }}>
                <div className="kc-callstage tall">
                  <div className="kc-callstage-top"><span className={'kc-dark-pill ' + stagePillCls}><span className="dot" />{stagePill}</span><span className="kc-dark-pill"><span>{kname} · {voiceLabel}</span></span></div>
                  <div className="kc-beam" />
                  <div className="kc-pool" style={{ bottom: 150 }} />
                  {showRings && <div className="kc-rings" aria-hidden="true"><i /><i /><i /></div>}
                  <div className="kc-callstage-klaro"><Klaro mood={callMood} size={260} /></div>
                  <div className="kc-status" role="status" aria-live="polite">
                    {showTimer && <span className="kc-timer">{timer}</span>}
                    {showWave && <div className={'kc-wave ' + waveCls} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>}
                    <span className="big">{stageBig}</span>
                    <span className="small">{stageSmall}</span>
                  </div>
                </div>
              </div>
            </aside>
          </main>
        )}

        {s.saveOpen && (
          <div className="kc-scrim" onClick={() => this.setState({ saveOpen: false })}>
            <div className="kc-sheet" role="dialog" aria-modal="true" aria-labelledby="kc-save-t" onClick={(e) => e.stopPropagation()}>
              <span className="kc-pill pill-live" style={{ alignSelf: 'flex-start' }}><span className="dot" />Draft kept</span>
              <h3 id="kc-save-t">Save {kname} with your email</h3>
              <p>Next we'll send a 6-digit code to your email. Your draft (name, services, greeting and this call's summary) stays exactly as it is.</p>
              <div className="kc-draft"><span className="kc-avatar" style={{ width: 48, height: 48 }}><Klaro mood="success" size={44} decorative /></span><div><b>{kname} for {bizNameOr}</b><span className="sub">{s.services.length} services · {voiceLabel} · not live yet</span></div></div>
              <div className="kc-banner banner-info"><span className="ico"><Icon name="info" size="sm" /></span><div><b>This preview ends here.</b> Screen 04 (account and email code) is the next review.</div></div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => this.props.onHome()}>Back to the homepage</button>
                <button className="btn btn-ghost" onClick={() => this.setState({ saveOpen: false })}><span>Back to {kname}</span></button>
              </div>
            </div>
          </div>
        )}

        {s.toast && <div className="kc-toast" role="status"><Icon name="info" size="sm" style={{ color: '#dfff75' }} />{s.toast}</div>}

        {reviewTools && (
          <div className="kc-proto">
            {s.protoOpen && (
              <div className="kc-proto-panel" role="dialog" aria-label="Review tools">
                <h4>Jump to a state</h4>
                <div className="kc-proto-grid">{JUMPS.map((j) => <button key={j[0]} onClick={() => this.jump(j[0])}>{j[1]}</button>)}</div>
                <h4>Website scan result</h4>
                <div className="kc-proto-grid">{[['success', 'Succeeds'], ['fails', 'Fails']].map((j) => <button key={j[0]} className={s.simScan === j[0] ? 'on' : ''} onClick={() => this.setState({ simScan: j[0] })}>{j[1]}</button>)}</div>
                <h4>Demo call outcome</h4>
                <div className="kc-proto-grid">{[['answered', 'Answered'], ['unanswered', 'No answer'], ['fails', 'Fails']].map((j) => <button key={j[0]} className={s.simCall === j[0] ? 'on' : ''} onClick={() => this.setState({ simCall: j[0] })}>{j[1]}</button>)}</div>
                <h4>Motion</h4>
                <div className="kc-proto-grid"><button className={s.rm ? 'on' : ''} onClick={() => this.setState({ rm: !s.rm })}>Reduced motion</button></div>
                <p className="kc-proto-note">Review tools for this build, not product UI. Scan results, call progress and summaries are sample data and nothing is dialled. Add ?clean=1 to the URL to hide this.</p>
              </div>
            )}
            <button className="kc-proto-btn" onClick={() => this.setState({ protoOpen: !s.protoOpen })} aria-expanded={s.protoOpen}><span className="dot" />Review tools</button>
          </div>
        )}
      </div>
    );
  }
}

export function SummaryCard({ sum, phone, kname, demo = true }) {
  return (
    <div className="kc-summary">
      <div className="kc-summary-head"><b>Call summary</b>{demo && <span className="kc-pill pill-demo"><span className="dot" />Demo · nothing was booked or sent</span>}</div>
      <div className="kc-chain">
        <div className="kc-link"><span className="i" style={{ background: 'none', overflow: 'hidden' }}><Ally shape="circle" tile="violet" size={34} radius={10} /></span><div><div className="lab">Customer</div><div className="val">{sum.customer}</div><div className="sub">{phone} · called just now</div></div></div>
        <div className="kc-link"><span className="i" style={{ background: '#eef4ff', color: '#1d4ed8' }}><Icon name="doc" /></span><div><div className="lab">Enquiry</div><div className="val">{sum.enquiry}</div><div className="kc-kv">{sum.details.map((d) => <span key={d} className="kv">{d}</span>)}</div></div></div>
        <div className="kc-link"><span className="i" style={{ background: '#dfff75', color: '#111' }}><Icon name="cal" /></span><div><div className="lab">Attempted action</div><div className="val">{sum.action}</div></div></div>
        <div className="kc-link"><span className="i" style={{ background: '#fff5e3', color: '#7a4300' }}><Icon name="clock" /></span><div><div className="lab">Outcome</div><div className="val">{sum.outcome}</div></div></div>
        <div className="kc-link"><span className="i" style={{ background: '#f8f8f5', color: '#111' }}><Icon name="bell" /></span><div><div className="lab">Follow-up for you</div><div className="val">{sum.follow}</div></div></div>
      </div>
      <div className="kc-summary-foot"><Icon name="info" size="sm" /><span>Once {kname} is live, this lands in your Command Centre and by text. Nothing goes live until you activate a number.</span></div>
    </div>
  );
}
