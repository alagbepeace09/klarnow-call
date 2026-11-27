import { Component } from 'react';
import Klaro from './components/Klaro.jsx';
import Icon, { LogoMark } from './components/Icons.jsx';
import Ally from './components/Ally.jsx';
import { Brand, ThemeToggle } from './components/Brand.jsx';
import { PRESETS, TRIES, sampleSummary, kindFrom, cleanUrl, validUrl, nameFrom, greetingFor, sampleScript, speak, stopSpeech } from './data.js';
import { Tag } from './components/Review.jsx';

const VOICES = { warm: ['Warm', 'Friendly, British'], bright: ['Bright', 'Upbeat, quick'], calm: ['Calm', 'Low, unhurried'] };
const KINDS = ['restaurant', 'plumbing', 'dental', 'salon', 'general'];
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

function blank(url) {
  const name = nameFrom(url);
  return { kind: '', bizName: name, bizDesc: '', services: [], facts: [], greeting: greetingFor(name || 'your business', 'Klaro'), greetingTouched: false, site: null, scanError: '' };
}

function fromSite(site) {
  const kind = PRESETS[site.kind] ? site.kind : 'general';
  const P = PRESETS[kind];
  const svc = site.services && site.services.length >= 2 ? site.services.slice(0, 5) : P.services.slice(0, 3);
  const miss = 'Not on your site. Add it, or leave blank';
  const facts = [['Phone', site.phone], ['Address', site.address], ['Opening hours', site.hours], ['Email', site.email]]
    .map(([k, v]) => ({ k, v: v || '', check: !v, ph: v ? '' : miss }));
  const name = site.name || nameFrom(site.host || '');
  return {
    kind, bizName: name, bizDesc: site.description || '', services: svc, svcGuessed: !(site.services && site.services.length >= 2), facts,
    greeting: greetingFor(name || 'your business', 'Klaro'), greetingTouched: false, site,
    found: [site.found.name, site.found.description, site.found.phone, site.found.address, site.found.hours, site.found.email].filter(Boolean).length + (site.services ? site.services.length : 0)
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
      manual ? fill('restaurant', url, true) : init.state ? fill(kindFrom(url), url, false) : blank(url)
    );
    const d = props.draft;
    if (init.state === 'restore' && d) {
      const have = (d.facts || []).map((f) => f.k);
      const facts = (d.facts || []).map((f) => ({ k: f.k, v: f.v, check: false, ph: '' }))
        .concat(['Phone', 'Address', 'Opening hours', 'Email'].filter((k) => have.indexOf(k) < 0).map((k) => ({ k, v: '', check: true, ph: 'Not on your site. Add it, or leave blank' })));
      Object.assign(this.state, {
        step: 'gen', gen: d.url ? 'review' : 'manual', scanIdx: 5, url: d.url || '', kind: d.kind || 'general', bizName: d.bizName || '', bizDesc: d.bizDesc || '',
        services: (d.services || []).slice(), facts, klaroName: d.klaroName || 'Klaro', voice: d.voice || 'warm', greeting: d.greeting || greetingFor(d.bizName, d.klaroName),
        greetingTouched: !!d.greeting, site: d.url ? { host: d.url, name: d.bizName, services: d.services || [], found: {} } : null, svcGuessed: false
      });
    }
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    const st = this.props.init && this.props.init.state;
    if (st && st !== 'restore') this.jump(st);
    else if (this.state.gen === 'scanning') this.runScan(0);
    this.report();
  }
  componentDidUpdate(pp, ps) {
    if (ps.step !== this.state.step || ps.gen !== this.state.gen || ps.call !== this.state.call) this.report();
  }
  report() {
    if (!this.props.onScreen) return;
    const s = this.state;
    this.props.onScreen(s.step === 'gen' ? '02' : '03', s.step === 'gen' ? s.gen : s.call);
  }
  draft() {
    const s = this.state;
    return { bizName: s.bizName || 'Your business', klaroName: s.klaroName || 'Klaro', voice: s.voice, services: s.services, kind: s.kind || 'general', url: s.url, greeting: s.greeting, bizDesc: s.bizDesc, facts: (s.facts || []).filter((f) => (f.v || '').trim()).map((f) => ({ k: f.k, v: f.v })), testCall: s.call === 'completed' ? 'completed' : s.call === 'preview' ? 'preview' : 'none' };
  }
  sim(k, d) { return (this.props.sim && this.props.sim[k]) || d; }
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
    const fails = this.sim('scan', 'success') === 'fails';
    const url = this.state.url;
    const job = { done: false, site: null, error: '' };
    const started = Date.now();
    if (!fails) {
      fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })).catch(() => ({ ok: false, j: {} })))
        .then(({ ok, j }) => { if (ok && j.site) job.site = j.site; else job.error = j.message || 'The site couldn’t be opened.'; })
        .catch(() => { job.error = 'We couldn’t reach the website reader. Check your connection and try again.'; })
        .finally(() => { job.done = true; });
    }
    let i = from || 0;
    const step = () => {
      if (fails && i >= 1) { this.later(() => this.setState({ gen: 'failed', scanError: 'The page didn’t respond in time.' }), 1400); return; }
      if (!fails && i >= 2 && !job.done) {
        if (Date.now() - started > 25000) { this.setState({ gen: 'failed', scanError: 'The site took too long to respond.' }); return; }
        this.later(step, 350); return;
      }
      if (job.done && job.error) { this.setState({ gen: 'failed', scanError: job.error }); return; }
      i += 1;
      this.setState({ scanIdx: i, site: job.site || this.state.site });
      if (i >= 5) { this.later(() => this.setState({ ...fromSite(job.site), gen: 'review', scanIdx: 5 }), 600); return; }
      this.later(step, 550 + (i % 2) * 200);
    };
    this.later(step, 500);
  }

  runCall(from) {
    const outcome = this.sim('call', 'answered');
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

  script() { const s = this.state; return sampleScript(s.bizName, s.klaroName, s.greeting, s.kind, s.services, s.facts); }

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
    const url = s.url || 'canalstreetkitchen.co.uk';
    const base = { url, call: 'idle', seconds: 0, summaryReady: false, scriptIdx: 0, previewDone: false };
    const callReady = { step: 'call', phone: s.phone || '7700 900123', consent: true };
    const filled = s.bizName ? {} : fill(kindFrom(url), url, false);
    const map = {
      scanning: () => this.reset({ ...base, ...fill(kindFrom(url), url, false), step: 'gen', gen: 'scanning', scanIdx: 0 }, () => this.runScan(0)),
      review: () => this.reset({ ...base, ...filled, step: 'gen', gen: 'review', scanIdx: 5 }),
      'scan-failed': () => this.reset({ ...base, step: 'gen', gen: 'failed', scanIdx: 1 }),
      manual: () => this.reset({ ...base, ...fill('restaurant', '', true), url: '', step: 'gen', gen: 'manual' }),
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
    this.reset({ ...blank(url), gen: 'scanning', scanIdx: 0, url }, () => this.runScan(0));
  }
  startManual() { this.reset({ ...fill('restaurant', '', true), step: 'gen', gen: 'manual', url: '' }); }
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
    const P = PRESETS[s.kind || 'restaurant'];
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

    /* generator preview */
    let genMood = 'welcome', bubbleLabel = 'Greeting', bubbleText = s.greeting, idSub = 'Your virtual receptionist · ' + voiceLabel;
    if (s.gen === 'scanning') { genMood = 'working'; bubbleLabel = 'Learning'; bubbleText = 'I’m reading ' + siteLabel + ' so I can answer like your team. Hang on a moment.'; idSub = 'Getting to know your business'; }
    if (s.gen === 'failed') { genMood = 'attention'; bubbleLabel = 'Needs you'; bubbleText = 'I couldn’t open that page. Check the address, or tell me about your business yourself.'; idSub = 'Waiting for your details'; }
    if (s.gen === 'manual' && !s.bizName) { genMood = 'thinking'; bubbleLabel = 'Tell me more'; bubbleText = 'What’s your business called, and what do people usually call about?'; }
    if (s.playing) genMood = 'speaking';

    const st = s.site;
    const scanDefs = [['Reading your homepage', st ? st.host : 'Opened'], ['Finding your services', st ? (st.services.length ? st.services.length + ' found' : 'Suggesting some') : 'Reading…'],
      ['Opening hours and address', st ? ([st.hours && 'Hours', st.address && 'Address'].filter(Boolean).join(' · ') || 'Not listed') : 'Reading…'],
      ['Contact details', st ? ([st.phone && 'Phone', st.email && 'Email'].filter(Boolean).join(' · ') || 'Not listed') : 'Reading…'], ['Writing ' + kname + '’s greeting', 'Ready']];
    const floats = [
      [st && st.name ? st.name : 'Business name found', { top: '16%', left: '6%' }], [st && st.services.length ? st.services.length + ' services found' : 'Services suggested', { top: '42%', right: '6%' }],
      [st && st.hours ? 'Opening hours found' : 'Opening hours checked', { top: '64%', left: '10%' }], [st && st.phone ? 'Phone number found' : 'Contact details checked', { top: '82%', right: '10%' }]
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

    let callMood = 'welcome', stagePill = 'Demo · not live', stagePillCls = '', stageBig = 'Ready when you are', stageSmall = this.props.review ? kname + ' will ring your phone and answer as ' + bizNameOr + '.' : 'Press play to hear ' + kname + ' answer as ' + bizNameOr + '.';
    let showRings = false, showTimer = false, showWave = false, waveCls = '', liveTitle = '', liveSub = '';
    if (c === 'requesting') { callMood = 'thinking'; stageBig = 'Requesting your call…'; stageSmall = 'Nothing has rung yet.'; liveTitle = 'Requesting your call'; liveSub = 'This takes a few seconds. Your phone hasn’t rung yet.'; }
    if (c === 'dialling') { callMood = 'working'; stageBig = 'Dialling…'; stageSmall = 'Calling ' + ccPhone + '. It hasn’t connected yet.'; liveTitle = 'Dialling your number'; liveSub = 'Your phone should ring in a moment.'; }
    if (c === 'ringing') { callMood = 'listening'; showRings = true; stageBig = 'Your phone is ringing'; stageSmall = 'Answer it to talk to ' + kname + '. Not connected yet.'; liveTitle = 'Answer your phone'; liveSub = 'It’s ringing now from a Klaro Call number. Answer it to talk to ' + kname + '.'; }
    if (c === 'connected') { callMood = s.talk; stagePill = 'Demo call · simulated'; stagePillCls = 'live'; showTimer = true; showWave = true; waveCls = s.talk === 'listening' ? 'listen' : ''; stageBig = kname + (s.talk === 'speaking' ? ' is speaking' : ' is listening'); stageSmall = 'The transcript and summary appear when the call ends.'; liveTitle = 'You’re talking to ' + kname; liveSub = 'Play a customer. ' + kname + ' only uses what you approved.'; }
    if (c === 'completed') { callMood = 'success'; stagePill = 'Call ended'; showTimer = true; showWave = true; waveCls = 'still'; stageBig = 'Call completed'; stageSmall = s.summaryReady ? 'Summary ready.' : 'Writing your summary…'; }
    if (c === 'failed') { callMood = 'attention'; stagePill = 'Call not placed'; stagePillCls = 'bad'; stageBig = 'The call didn’t go through'; stageSmall = 'No call was made and nothing was recorded.'; }
    if (c === 'unanswered') { callMood = 'attention'; stagePill = 'No answer'; stagePillCls = 'warn'; stageBig = 'No answer'; stageSmall = kname + ' didn’t speak to anyone.'; }
    const shown = this.script().slice(0, s.scriptIdx);
    if (c === 'preview') {
      const last = shown[shown.length - 1];
      const callerTalking = last && last.who === 'c';
      callMood = s.previewDone ? 'success' : callerTalking ? 'listening' : 'speaking';
      stagePill = 'Example call · in your browser'; showWave = !s.previewDone; waveCls = callerTalking ? 'listen' : '';
      stageBig = s.previewDone ? 'Example finished' : callerTalking ? 'Example caller speaking' : kname + ' is speaking';
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
      <div className={'kc' + (this.props.motion === 'reduce' ? ' rm' : '')}>
        <header className="kc-top">
          <Brand onClick={(e) => { e.preventDefault(); this.props.onHome(); }} />
          <div className="kc-top-mid"><span className="kc-chip"><Icon name="globe" size="sm" /><span>{siteLabel}</span></span></div>
          <div className="kc-top-right">
            <span className={'kc-pill ' + (onCall && c === 'connected' ? 'pill-live' : 'pill-demo')}><span className="dot" />{onGen ? 'Preview · not live' : c === 'connected' ? 'Demo call · simulated' : 'Demo · not live'}</span>
            {this.props.onToggleTheme && <ThemeToggle theme={this.props.theme} onToggle={this.props.onToggleTheme} />}
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
                  <span className="kc-kicker" style={{ color: 'var(--red-ink)' }}>Couldn't read the site</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>We couldn't read {siteLabel}</h1>
                  <p className="kc-sub">Nothing is wrong with your business. Some sites block automatic reading, are still loading, or the address has a typo.</p>
                </div>
                <div className="kc-banner banner-err" role="alert"><span className="ico"><Icon name="alert" size="sm" /></span><div><b>{s.scanError || 'The page didn’t respond in time.'}</b> No details were saved.</div></div>
                <div className="kc-field">
                  <label className="kc-label" htmlFor="kc-url-retry">Check the address</label>
                  <input className="kc-input" id="kc-url-retry" type="text" inputMode="url" value={s.url} onChange={(e) => this.setState({ url: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') this.retryScan(); }} />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => this.retryScan()}>Try again</button>
                  <button className="btn btn-ghost" onClick={() => this.startManual()}>Enter details myself</button>
                </div>
                <p className="kc-fine">Entering details yourself takes about a minute: a name, what you do and your main services.</p>
                <Tag kind="failure" show={this.props.ann} label="Failure → recovery: edits and the address are kept; retry or enter details manually" />
              </>)}

              {(s.gen === 'review' || s.gen === 'manual') && (<>
                <div>
                  <span className="kc-kicker">{s.gen === 'manual' ? 'No website needed' : 'Ready for review'}</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>{s.gen === 'manual' ? 'Tell ' + kname + ' about your business' : 'Here’s what ' + kname + ' learned'}</h1>
                  <p className="kc-sub">{s.gen === 'manual' ? 'Just the basics: a name, what you do and what people call about. You can add more later.' : 'Check the details callers will hear. Change only what matters. Everything else can wait.'}</p>
                </div>
                {s.gen === 'review' && (
                  <div className="kc-banner banner-ok" role="status"><span className="ico"><Icon name="check" size="sm" /></span><div>{!s.site && <Tag kind="demo" show={this.props.ann} label="Sample details" />}<b>{s.site ? 'We read ' + s.site.host + '.' : 'Sample details filled in.'}</b> {s.site ? (s.facts.filter((f) => f.check).length ? 'Fill in anything marked Check' : 'Everything below came from your site') + (s.svcGuessed ? ', and swap the suggested services for your own' : '') + '. Klaro only says what’s listed here.' : 'Items marked Check are guesses.'}</div></div>
                )}
                <div className="kc-form">
                  <div className="kc-field">
                    <label className="kc-label" htmlFor="kc-biz">Business name{s.gen === 'review' && <span className="kc-src">From your site</span>}</label>
                    <input className="kc-input" id="kc-biz" type="text" placeholder="e.g. Canal Street Kitchen" value={s.bizName} onChange={(e) => this.onBizName(e.target.value)} />
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
                          <input id={'fact-' + i} type="text" value={f.v} placeholder={/^Not on/.test(f.ph || '') ? f.ph : 'e.g. ' + f.ph} onChange={(e) => this.setFact(i, e.target.value)} />
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
                  <button className="btn btn-primary btn-lg" disabled={cannotHear} onClick={() => this.reset({ step: 'call', call: 'idle' })}>Let me hear {kname}<span className="arr"><Icon name="arrow" /></span></button>
                  <span className="note"><Icon name={this.props.review ? 'phone' : 'speaker'} size="sm" /><span>{cannotHear ? 'Add a business name and at least one service' : this.props.review ? 'Next: ' + kname + ' rings your phone' : 'Next: hear an example call'}</span></span>
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
              {this.props.review && <div className="sim-note" role="note"><Icon name="info" size="sm" /><span><b>Simulated in this preview.</b> No number is dialled, nothing is recorded and no one is charged. A live build shows these states only when the phone network reports them.</span><Tag kind="demo" show={this.props.ann} /></div>}

              {c === 'idle' && !this.props.review && (<>
                <div>
                  <span className="kc-kicker">Step 3 of 6 · Hear {kname}</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>Hear {kname} answer as {bizNameOr}.</h1>
                  <p className="kc-sub">{kname} plays a short example call in your browser, using the details you just checked. Turn your sound on.</p>
                </div>
                <div className="kc-example">
                  <div className="kc-example-row"><Icon name="check" size="sm" /><span>Greets callers as <b>{bizNameOr}</b></span></div>
                  <div className="kc-example-row"><Icon name="check" size="sm" /><span>Answers from your facts{s.services.length ? <>, like <b>{s.services[0]}</b></> : ''}</span></div>
                  <div className="kc-example-row"><Icon name="check" size="sm" /><span>Takes the caller’s details and writes you a summary</span></div>
                </div>
                <div className="kc-cta-bar">
                  <button className="btn btn-primary btn-lg" onClick={() => this.startPreview()}><Icon name="play" size="sm" />Play the example call</button>
                  <button className="btn btn-ghost btn-lg" onClick={() => { stopSpeech(); this.clearTimers(); this.props.onSave && this.props.onSave(this.draft()); }}>Skip and save</button>
                </div>
                <div className="kc-banner banner-info"><span className="ico"><Icon name="phone" size="sm" /></span><div><b>Want {kname} to ring your phone?</b> Phone test calls switch on once a number is connected to your workspace. Nothing here dials anyone.</div></div>
              </>)}

              {c === 'idle' && this.props.review && (<>
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
                    <span>Yes, ring me now with one demo call from Klaro Call. The call is recorded so I get a summary. <button className="link" onClick={(e) => { e.preventDefault(); this.toast('The privacy notice opens in a drawer in the build.'); }}>Privacy notice</button></span>
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
                    <div className="kc-tries">{(TRIES[s.kind || 'restaurant'] || TRIES.restaurant).map((t) => <span key={t} className="kc-try">{t}</span>)}</div>
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
                  <span className="kc-kicker" style={{ color: 'var(--lime-ink)' }}><span>Call completed · {mm} min {ss} sec</span></span>
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
                  <button className="btn btn-primary btn-lg" onClick={() => { stopSpeech(); this.clearTimers(); this.props.onSave && this.props.onSave(this.draft()); }}>Save my Klaro<span className="arr"><Icon name="arrow" /></span></button>
                  <button className="btn btn-ghost btn-lg" onClick={() => this.callAgain()}>Call me again</button>
                </div>
              </>)}

              {problem && (<>
                <div>
                  <span className="kc-kicker" style={{ color: c === 'failed' ? 'var(--red-ink)' : 'var(--amber-ink)' }}>{c === 'failed' ? 'Call not placed' : 'No answer'}</span>
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
                  <span className="kc-kicker">Example call · played in your browser, nothing is dialled</span>
                  <h1 className="kc-h2" style={{ marginTop: 10 }}>{s.previewDone ? 'That’s ' + kname + ' on a typical call.' : 'Listen to ' + kname + ' handle a call'}</h1>
                  <p className="kc-sub">{s.previewDone ? 'Here’s the summary ' + kname + ' would send you. Every real call ends with one of these.' : 'An example caller, answered in ' + kname + '’s voice using your details.'}</p>
                </div>
                <div className="kc-script" aria-live="polite">
                  {shown.map((l, i) => (<div key={i} className={'kc-line ' + l.who}><small>{l.who === 'k' ? kname : 'Example caller'}</small>{l.text}</div>))}
                </div>
                {s.previewDone && <SummaryCard sum={sampleSummary(s.bizName, s.kind, s.services)} phone="07700 900345" kname={kname} />}
                <div className="kc-cta-bar">
                  {s.previewDone && <button className="btn btn-primary btn-lg" onClick={() => { stopSpeech(); this.clearTimers(); this.props.onSave && this.props.onSave(this.draft()); }}>Save my Klaro<span className="arr"><Icon name="arrow" /></span></button>}
                  {!s.previewDone && <button className="btn btn-ghost btn-lg" onClick={() => { this.clearTimers(); stopSpeech(); this.setState({ previewDone: true, scriptIdx: this.script().length }); }}>Stop preview</button>}
                  {s.previewDone && <button className="btn btn-ghost btn-lg" onClick={() => this.startPreview()}>Play again</button>}
                  {this.props.review && <button className="btn btn-ghost btn-lg" onClick={() => this.editNumber()}>Call my phone instead</button>}
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

        {s.toast && <div className="kc-toast" role="status"><Icon name="info" size="sm" style={{ color: '#dfff75' }} />{s.toast}</div>}

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
