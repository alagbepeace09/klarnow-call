import { useEffect, useRef, useState } from 'react';
import Klaro from './components/Klaro.jsx';
import Icon, { LogoMark } from './components/Icons.jsx';
import { SummaryCard } from './Flow.jsx';
import HeroKlaro, { KlaroRender } from './components/HeroKlaro.jsx';
import Ally, { CALLERS } from './components/Ally.jsx';
import { PRESETS, validUrl, sampleScript, speak, stopSpeech } from './data.js';

/* ---------- helpers ---------- */
function useInView(opts) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (!('IntersectionObserver' in window)) { setSeen(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { threshold: 0.18, ...opts });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

function Reveal({ as: Tag = 'div', className = '', children, delay = 0, ...rest }) {
  const [ref, seen] = useInView();
  return <Tag ref={ref} className={'lp-reveal ' + (seen ? 'in ' : '') + className} style={{ transitionDelay: delay + 'ms' }} {...rest}>{children}</Tag>;
}

function UrlForm({ onStart, id, dark }) {
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!validUrl(url)) { setErr(url.trim() ? 'That doesn’t look like a web address. Try yourbusiness.co.uk' : 'Enter your website to start, for example yourbusiness.co.uk'); return; }
    onStart(url, false);
  };
  return (
    <div className={'lp-urlwrap' + (dark ? ' dark' : '')}>
      <form className={'kc-urlbar' + (err ? ' has-error' : '')} onSubmit={submit} noValidate>
        <div className="urlrow">
          <Icon name="globe" />
          <label className="sr" htmlFor={id}>Your business website</label>
          <input id={id} type="text" inputMode="url" autoComplete="url" placeholder="yourbusiness.co.uk" value={url} onChange={(e) => { setUrl(e.target.value); setErr(''); }} aria-invalid={!!err} aria-describedby={id + '-err'} />
        </div>
        <button className="btn btn-primary" type="submit">Get my receptionist<Icon name="arrow" /></button>
      </form>
      {err && <div className="kc-field-err" id={id + '-err'} role="alert" style={{ marginTop: 10 }}><Icon name="alert" size="sm" />{err}</div>}
    </div>
  );
}

/* ---------- sections ---------- */
function Nav({ onStart }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const links = [['#how', 'How it works'], ['#features', 'What Klaro does'], ['#industries', 'Who it’s for'], ['#control', 'Control'], ['#faq', 'FAQ']];
  const toHero = () => { setOpen(false); const el = document.getElementById('hero-url'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.focus(), 400); } };
  return (
    <header className={'lp-nav' + (scrolled ? ' scrolled' : '') + (open ? ' open' : '')}>
      <div className="lp-nav-in">
        <a className="kc-logo" href="/" aria-label="Klarnow Call home">KLARNOW<LogoMark /></a>
        <span className="kc-product">Call</span>
        <nav className="lp-links" aria-label="Main">
          {links.map((l) => <a key={l[0]} href={l[0]} onClick={() => setOpen(false)}>{l[1]}</a>)}
        </nav>
        <div className="lp-nav-right">
          <a className="lp-signin" href="https://www.klarnow.co.uk/start">Start diagnosis</a>
          <button className="btn btn-primary btn-sm" onClick={toHero}>Get my receptionist</button>
          <button className="lp-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
        </div>
      </div>
      {open && (
        <div className="lp-mobile-menu">
          {links.map((l) => <a key={l[0]} href={l[0]} onClick={() => setOpen(false)}>{l[1]}</a>)}
          <button className="btn btn-primary btn-block" onClick={toHero}>Get my receptionist</button>
          <button className="btn btn-ghost btn-block" onClick={() => { setOpen(false); onStart('', true); }}>No website? Start here</button>
        </div>
      )}
    </header>
  );
}

function Hero({ onStart }) {
  return (
    <section className="kc-hero lp-hero" id="top">
      <div className="kc-hero-wash" />
      <div className="kc-hero-copy">
        <span className="kc-eyebrow"><span className="spark"><Icon name="phone" size="sm" /></span>Klarnow Call · the receptionist for calls you can't pick up</span>
        <h1 className="kc-h1">Your next customer could be <em>calling.</em></h1>
        <p className="kc-lede">Klaro answers in your business's name, captures the enquiry, takes the next step and tells you what happened. Paste your website to hear yours.</p>
        <UrlForm onStart={onStart} id="hero-url" />
        <div className="kc-alt">No website yet? <button className="link" onClick={() => onStart('', true)}>Describe your business instead</button></div>
        <ul className="kc-assure">
          <li><Icon name="check" />Free preview, no card</li>
          <li><Icon name="check" />No signup to hear Klaro</li>
          <li><Icon name="check" />Nothing goes live until you say so</li>
        </ul>
      </div>
      <div className="lp-hero-visual" aria-label="Example: Klaro handles a call from start to finish">
        <HeroKlaro size={500} id="hero">
          <div className="kc-story s1"><span className="step">Call</span><span className="ico" style={{ background: 'none', padding: 0 }}><Ally shape="circle" tile="violet" size={38} radius={22} /></span><div><b>Incoming call · 07:42</b><span>You're on a job. Klaro picks up.</span></div></div>
          <div className="kc-story s2"><span className="step">Enquiry</span><span className="ico"><Icon name="doc" /></span><div><b>Enquiry captured</b><span>Boiler losing pressure · M20 · wants Thursday</span></div></div>
          <div className="kc-story s3"><span className="step">Action</span><span className="ico"><Icon name="calcheck" /></span><div><b>Visit requested</b><span>Thu 9:30 offered, waiting on you</span></div></div>
          <div className="kc-story s4"><span className="step">You</span><span className="ico"><Icon name="bell" /></span><div><b>You're told straight away</b><span>Text + email to you · 07:44</span></div></div>
        </HeroKlaro>
        <div className="kc-stage-caption"><span>Example call · how Klaro handles one enquiry</span></div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [['wrench', 'Plumbers & heating'], ['zap', 'Electricians'], ['tooth', 'Dental clinics'], ['scissors', 'Salons & barbers'], ['fork', 'Restaurants'], ['home', 'Estate & letting agents'], ['scale', 'Law firms'], ['car', 'Garages'], ['sparkle', 'Cleaning companies'], ['user', 'Physios & clinics']];
  const row = items.concat(items);
  return (
    <section className="lp-marquee" aria-label="Built for businesses like these">
      <p>Built for businesses that can't always pick up</p>
      <div className="lp-marquee-track">
        <div className="lp-marquee-row">{row.map((it, i) => <span key={i} className="lp-mq" aria-hidden={i >= items.length}><Ally {...CALLERS[i % CALLERS.length]} size={30} radius={30} />{it[1]}</span>)}</div>
      </div>
    </section>
  );
}

function Moments() {
  const moments = [
    { t: 'You’re on a job', d: 'Hands full, phone in the van. The caller rings the next name on the list.', klaro: 'Klaro answers, takes the details and books the visit request.', time: '10:14', icon: 'wrench' },
    { t: 'You’re with a client', d: 'You can’t step away mid-appointment. Voicemail rarely gets a message.', klaro: 'Klaro answers your questions, notes what they need and flags anything urgent.', time: '14:32', icon: 'user' },
    { t: 'You’re closed', d: 'Evenings and weekends are when people finally have time to call.', klaro: 'Klaro takes the enquiry, and you start tomorrow with a list, not a guess.', time: '21:07', icon: 'moon' }
  ];
  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <Reveal className="lp-head">
          <span className="lp-kicker">The problem</span>
          <h2 className="lp-h2">Every unanswered call is a customer making a decision.</h2>
          <p className="lp-lede">Most people won't leave a voicemail. They call someone else. Klaro makes sure the first answer they get is yours.</p>
        </Reveal>
        <div className="lp-moments">
          {moments.map((m, i) => (
            <Reveal key={m.t} className="lp-moment" delay={i * 90}>
              <div className="lp-moment-top"><span className="lp-ico"><Icon name={m.icon} /></span><h3>{m.t}</h3></div>
              <p>{m.d}</p>
              <div className="lp-phone-pair">
                <div className="lp-notif missed"><span className="lp-av" style={{ width: 30, height: 30, opacity: .5 }}><Ally {...CALLERS[i * 2]} size={30} radius={9} /></span><div><b>Missed call · {m.time}</b><span>Unknown number</span></div></div>
                <div className="lp-notif handled"><span className="kl"><Klaro mood="success" size={30} decorative /></span><div><b>Klaro handled it · {m.time}</b><span>{m.klaro}</span></div></div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ onStart }) {
  return (
    <section className="lp-section lp-tint" id="how">
      <div className="lp-wrap">
        <Reveal className="lp-head">
          <span className="lp-kicker">How it works</span>
          <h2 className="lp-h2">From your website to a working receptionist, before you even sign up.</h2>
        </Reveal>
        <div className="lp-steps">
          <Reveal className="lp-step" delay={0}>
            <span className="lp-num">01</span>
            <h3>Paste your website</h3>
            <p>Klaro reads your site and drafts what it knows: services, hours, area and contact details. You check anything it guessed.</p>
            <div className="lp-mock lp-mock-scan">
              <div className="lp-mock-url"><Icon name="globe" size="sm" />brightsideplumbing.co.uk</div>
              <div className="lp-mock-row done"><span className="c"><Icon name="check" size="sm" /></span>Finding your services<em>4 services</em></div>
              <div className="lp-mock-row done"><span className="c"><Icon name="check" size="sm" /></span>Opening hours and area<em>Found</em></div>
              <div className="lp-mock-row act"><span className="c spin" />Writing Klaro's greeting<em>Reading…</em></div>
            </div>
          </Reveal>
          <Reveal className="lp-step" delay={100}>
            <span className="lp-num">02</span>
            <h3>Hear it call you</h3>
            <p>Klaro rings your phone and answers as your business. Play a customer, ask awkward questions and see the summary it writes.</p>
            <div className="lp-mock lp-mock-call">
              <div className="lp-mock-klaro"><Klaro mood="speaking" size={110} decorative /></div>
              <div className="lp-mock-callinfo"><span className="kc-dark-pill live"><span className="dot" />Live demo call</span><span className="mono lp-mock-timer">00:42</span><span className="lp-mock-sub">Klaro is speaking</span></div>
            </div>
          </Reveal>
          <Reveal className="lp-step" delay={200}>
            <span className="lp-num">03</span>
            <h3>Go live on your number</h3>
            <p>Forward your existing number when you're busy or closed, or get a new one. Run a test call first. You decide when it goes live.</p>
            <div className="lp-mock lp-mock-live">
              <div className="lp-mock-opt on"><span className="r" /><div><b>Forward my number</b><span>Keep the number customers know</span></div></div>
              <div className="lp-mock-opt"><span className="r" /><div><b>Get a new number</b><span>UK local or mobile number</span></div></div>
              <div className="lp-mock-status"><span className="kc-pill pill-warn"><span className="dot" />Test call needed</span><span className="kc-pill pill-neutral">Not live yet</span></div>
            </div>
          </Reveal>
        </div>
        <Reveal className="lp-center-cta">
          <button className="btn btn-primary btn-lg" onClick={() => { const el = document.getElementById('hero-url'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.focus(), 400); } }}>Start with my website<Icon name="arrow" /></button>
          <button className="btn btn-ghost btn-lg" onClick={() => onStart('', true)}>I don't have a website</button>
        </Reveal>
      </div>
    </section>
  );
}

function SampleCall() {
  const kind = 'plumbing';
  const lines = sampleScript('Brightside Plumbing', 'Klaro', '', kind);
  const [ref, seen] = useInView({ threshold: 0.35 });
  const [idx, setIdx] = useState(0);
  const [sound, setSound] = useState(false);
  const [run, setRun] = useState(0);
  const timers = useRef([]);
  useEffect(() => {
    if (!seen) return;
    timers.current.forEach(clearTimeout); timers.current = [];
    setIdx(0);
    let t = 600;
    lines.forEach((ln, i) => {
      timers.current.push(setTimeout(() => { setIdx(i + 1); if (sound && ln.who === 'k') speak(ln.text, 'warm'); }, t));
      t += ln.who === 'k' ? (sound ? 5200 : 2600) : 1900;
    });
    timers.current.push(setTimeout(() => setIdx(lines.length + 1), t));
    return () => { timers.current.forEach(clearTimeout); stopSpeech(); };
  }, [seen, run]);
  const shown = lines.slice(0, Math.min(idx, lines.length));
  const last = shown[shown.length - 1];
  const done = idx > lines.length;
  const mood = done ? 'success' : !last ? 'welcome' : last.who === 'c' ? 'listening' : 'speaking';
  return (
    <section className="lp-dark" id="listen" ref={ref}>
      <div className="lp-wrap">
        <div className="lp-head light">
          <span className="lp-kicker lime">Listen in</span>
          <h2 className="lp-h2">A real enquiry, handled from hello to next step.</h2>
          <p className="lp-lede">A sample call to a plumbing business. Klaro uses only what the business approved, says it's virtual, and never promises what it can't do.</p>
        </div>
        <div className="lp-listen">
          <div className="lp-listen-stage">
            <div className="kc-beam" /><div className="kc-pool" />
            <div className="lp-listen-klaro"><Klaro mood={mood} size={240} /></div>
            <div className="lp-listen-status">
              <span className={'kc-dark-pill' + (done ? '' : ' live')}><span className="dot" />{done ? 'Call ended · summary sent' : 'Sample call'}</span>
              <span className="lp-listen-big">{done ? 'Done in 1 min 12 sec' : last ? (last.who === 'k' ? 'Klaro is speaking' : 'Caller is speaking') : 'Incoming call…'}</span>
            </div>
          </div>
          <div className="lp-listen-script" aria-live="polite">
            {shown.map((l, i) => (
              <div key={i} className={'lp-line-row ' + l.who}>
                <span className="lp-av">{l.who === 'k' ? <span style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', background: '#1b1530' }}><KlaroRender fallbackSize={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></span> : <Ally shape="circle" tile="violet" size={34} radius={10} />}</span>
                <div className={'kc-line ' + l.who}><small>{l.who === 'k' ? 'Klaro' : 'Caller · Sam'}</small>{l.text}</div>
              </div>
            ))}
            {done && (
              <div className="lp-listen-sum">
                <span className="lp-kicker lime" style={{ marginBottom: 10 }}>Sent to the owner, 5 seconds later</span>
                <div className="lp-mini-sum">
                  <div><b>Sam Okafor</b><span>Boiler losing pressure · M20 2AB</span></div>
                  <div className="kc-pill pill-live"><span className="dot" />Thu 9:30 requested</div>
                </div>
              </div>
            )}
            <div className="lp-listen-ctrls">
              <button className="btn btn-ghost-dark btn-sm" onClick={() => { stopSpeech(); setRun(run + 1); }}><Icon name="play" size="sm" />Replay</button>
              <button className={'btn btn-sm ' + (sound ? 'btn-lime' : 'btn-ghost-dark')} onClick={() => { const n = !sound; setSound(n); if (!n) stopSpeech(); else setRun(run + 1); }} aria-pressed={sound}><Icon name="speaker" size="sm" />{sound ? 'Sound on' : 'Play with sound'}</button>
              <span className="lp-note-dark">Voice played by your browser for this sample</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chain() {
  const steps = [
    ['user', 'Customer', 'Who called, with their number, even if they hung up early.'],
    ['doc', 'Enquiry', 'What they need, in their words, with the details your team asks for.'],
    ['cal', 'Attempted action', 'What Klaro tried: a visit request, a link, or a transfer.'],
    ['clock', 'Outcome', 'What actually happened. Pending stays pending until you confirm.'],
    ['bell', 'Follow-up', 'The one thing you need to do next, if anything.']
  ];
  return (
    <section className="lp-section">
      <div className="lp-wrap lp-split">
        <Reveal className="lp-split-copy">
          <span className="lp-kicker">After every call</span>
          <h2 className="lp-h2">Every call ends with a clear next step.</h2>
          <p className="lp-lede">No transcripts to wade through. Klaro connects the customer, the enquiry, what it tried and what's left for you, and it's honest about what's done and what's pending.</p>
          <ol className="lp-chain">
            {steps.map((s, i) => (
              <li key={s[1]}><span className="lp-chain-i"><Icon name={s[0]} /></span><div><b>{s[1]}</b><span>{s[2]}</span></div>{i < steps.length - 1 && <i className="lp-chain-line" />}</li>
            ))}
          </ol>
        </Reveal>
        <Reveal className="lp-split-visual" delay={120}>
          <div className="lp-float-card"><SummaryCard sum={PRESETS.plumbing.sum} phone="+44 7700 ••• 123" kname="Klaro" demo={false} /></div>
          <div className="lp-float-badge"><Klaro mood="success" size={64} decorative /><div><b>Sent to you</b><span>By text and in your Command Centre</span></div></div>
        </Reveal>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="lp-section lp-tint" id="features">
      <div className="lp-wrap">
        <Reveal className="lp-head">
          <span className="lp-kicker">What Klaro does</span>
          <h2 className="lp-h2">A receptionist that answers, acts and knows when to hand over.</h2>
        </Reveal>
        <div className="lp-bento">
          <Reveal className="lp-tile big dark">
            <div className="lp-tile-copy"><span className="lp-ico lime"><Icon name="book" /></span><h3>Answers from what you approved</h3><p>Services, prices, hours, areas, policies. Klaro sticks to your approved facts. If it doesn't know, it says so and takes a message.</p></div>
            <div className="lp-qa">
              <div className="kc-line c"><small>Caller</small>Do you cover Stockport?</div>
              <div className="kc-line k"><small>Klaro</small>Yes, we cover Manchester, Stockport and Trafford. Would you like to book a visit?</div>
              <div className="kc-line c"><small>Caller</small>Can you fix a Worcester boiler today?</div>
              <div className="kc-line k"><small>Klaro</small>I can't promise same-day, but I'll flag it as urgent for the team right now.</div>
            </div>
          </Reveal>
          <Reveal className="lp-tile" delay={60}><span className="lp-ico"><Icon name="inbox" /></span><h3>Captures every enquiry</h3><p>Name, number, what they need and when, asked the way your team would ask.</p></Reveal>
          <Reveal className="lp-tile" delay={120}><span className="lp-ico"><Icon name="calcheck" /></span><h3>Takes the next step</h3><p>Requests a booking, sends a link by text or routes the call. Each action is marked as done, pending or failed.</p></Reveal>
          <Reveal className="lp-tile" delay={60}><span className="lp-ico amber"><Icon name="hand" /></span><h3>Needs You, when it matters</h3><p>Urgent or unusual calls go to a short queue with a priority and an owner, so nothing urgent waits.</p></Reveal>
          <Reveal className="lp-tile" delay={120}><span className="lp-ico"><Icon name="sim" /></span><h3>Your number or a new one</h3><p>Forward your existing line when you're busy or closed, or get a new UK number. Test it before it goes live.</p></Reveal>
          <Reveal className="lp-tile" delay={180}><span className="lp-ico"><Icon name="moon" /></span><h3>Out of hours and overflow</h3><p>Answer every call, only after hours, or only when you don't pick up. You choose.</p></Reveal>
          <Reveal className="lp-tile wide" delay={60}>
            <div className="lp-tile-copy"><span className="lp-ico"><Icon name="shield" /></span><h3>Honest by design</h3><p>Klaro says it's a virtual receptionist. It never pretends a booking is confirmed when it isn't, and your dashboard never shows a call as live unless it really is.</p></div>
            <div className="lp-status-row"><span className="kc-pill pill-live"><span className="dot" />Done</span><span className="kc-pill pill-warn"><span className="dot" />Pending you</span><span className="kc-pill pill-err"><span className="dot" />Failed, retry</span><span className="kc-pill pill-demo"><span className="dot" />Demo · not live</span></div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CommandCentre() {
  const calls = [
    ['07:42', 'Sam Okafor', 'Boiler losing pressure', 'Visit requested', 'pill-warn'],
    ['08:15', 'Unknown caller', 'Asked about call-out fee', 'Answered', 'pill-live'],
    ['09:03', 'Priya Shah', 'Leak under sink, urgent', 'Needs you', 'pill-err'],
    ['11:26', 'Ade Bakare', 'Quote for bathroom', 'Link sent', 'pill-live']
  ];
  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <Reveal className="lp-head">
          <span className="lp-kicker">Command Centre</span>
          <h2 className="lp-h2">See your day at a glance: calls, enquiries and anything that needs you.</h2>
          <p className="lp-lede">Every call is linked to a customer, an enquiry, an action and an outcome. Search it, assign it, resolve it.</p>
        </Reveal>
        <Reveal className="lp-dash" delay={100}>
          <div className="lp-dash-top">
            <div className="lp-dash-brand"><span className="kc-avatar" style={{ width: 32, height: 32, borderRadius: 10 }}><Klaro mood="welcome" size={32} decorative /></span><b>Brightside Plumbing</b></div>
            <div className="lp-dash-tabs" role="presentation"><span className="on">Today</span><span>Calls & enquiries</span><span>Needs you</span><span className="hide-sm">Klaro Studio</span></div>
            <span className="kc-pill pill-live"><span className="dot" />Klaro live · 0161 •••• 412</span>
          </div>
          <div className="lp-dash-body">
            <div className="lp-dash-stats">
              <div><span>Calls answered</span><b>14</b><em>today</em></div>
              <div><span>Enquiries captured</span><b>9</b><em>6 with an action</em></div>
              <div><span>Waiting on you</span><b>2</b><em>1 urgent</em></div>
              <div><span>Avg. answer</span><b>1 ring</b><em>every call</em></div>
            </div>
            <div className="lp-dash-grid">
              <div className="lp-dash-list">
                <div className="lp-dash-h">Recent calls</div>
                {calls.map((c, i) => (
                  <div key={c[0]} className="lp-dash-row"><span className="mono t">{c[0]}</span><span className="lp-av"><Ally {...CALLERS[i]} size={34} radius={10} /></span><div><b>{c[1]}</b><span>{c[2]}</span></div><span className={'kc-pill ' + c[4]}><span className="dot" />{c[3]}</span></div>
                ))}
              </div>
              <div className="lp-dash-needs">
                <div className="lp-dash-h">Needs you <span className="kc-pill pill-err" style={{ height: 22, fontSize: 11 }}>1 urgent</span></div>
                <div className="lp-need urgent"><b>Priya Shah · leak under sink</b><span>Water spreading. Wants someone within 2 hours.</span><div className="lp-need-actions"><span className="btn btn-primary btn-sm">Call back</span><span className="btn btn-ghost btn-sm">Assign</span></div></div>
                <div className="lp-need"><b>Sam Okafor · Thu 9:30</b><span>Confirm or move the requested visit.</span><div className="lp-need-actions"><span className="btn btn-ghost btn-sm">Confirm</span><span className="btn btn-ghost btn-sm">Move</span></div></div>
              </div>
            </div>
          </div>
          <span className="lp-sample-tag">Sample data</span>
        </Reveal>
      </div>
    </section>
  );
}

function Industries() {
  const tabs = [
    { k: 'plumbing', label: 'Trades', icon: 'wrench', handles: ['Call-out and emergency questions', 'Visit requests with postcode and access notes', 'Quotes: photos requested by text', 'Urgent leaks flagged straight to you'] },
    { k: 'dental', label: 'Clinics', icon: 'tooth', handles: ['New patient questions', 'Appointment requests and changes', 'Emergency triage to the right slot', 'Forms and directions sent by text'] },
    { k: 'salon', label: 'Salons', icon: 'scissors', handles: ['Service and price questions', 'Booking requests with stylist preference', 'Deposit and patch-test policy', 'Late and cancellation messages'] },
    { k: 'restaurant', label: 'Restaurants', icon: 'fork', handles: ['Table and group bookings', 'Allergy and dietary questions', 'Opening hours and directions', 'Private dining enquiries'] }
  ];
  const [on, setOn] = useState(0);
  const t = tabs[on];
  const p = PRESETS[t.k];
  return (
    <section className="lp-section lp-tint" id="industries">
      <div className="lp-wrap">
        <Reveal className="lp-head center">
          <span className="lp-kicker">Who it's for</span>
          <h2 className="lp-h2">Made for the businesses where the phone still matters.</h2>
        </Reveal>
        <div className="lp-tabs" role="tablist" aria-label="Industries">
          {tabs.map((x, i) => (
            <button key={x.k} role="tab" id={'tab-' + x.k} aria-selected={on === i} aria-controls="ind-panel" className={on === i ? 'on' : ''} onClick={() => setOn(i)}><Icon name={x.icon} size="sm" />{x.label}</button>
          ))}
        </div>
        <div className="lp-ind" role="tabpanel" id="ind-panel" aria-labelledby={'tab-' + t.k} key={t.k}>
          <div className="lp-ind-copy">
            <h3>Klaro for {p.label.toLowerCase()}</h3>
            <p>{p.desc}</p>
            <ul>{t.handles.map((h) => <li key={h}><Icon name="check" />{h}</li>)}</ul>
          </div>
          <div className="lp-ind-card">
            <div className="lp-ind-persona"><Ally {...CALLERS[on]} size={56} radius={16} /><div><b>{p.sum.customer}</b><span>Calling about: {p.sum.enquiry.toLowerCase()}</span></div></div>
            <div className="lp-ind-call">
              <div className="kc-line c"><small>Caller</small>Hi, {p.sum.enquiry.charAt(0).toLowerCase() + p.sum.enquiry.slice(1)}.</div>
              <div className="kc-line k"><small>Klaro</small>{p.sum.action}. I'll pass this to the team to confirm.</div>
            </div>
            <div className="lp-ind-out">
              <div><span className="lab">Outcome</span><b>{p.sum.outcome}</b></div>
              <div className="kc-kv">{p.sum.details.map((d) => <span key={d} className="kv">{d}</span>)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MeetKlaro() {
  const moods = [['welcome', 'Welcome'], ['thinking', 'Thinking'], ['listening', 'Listening'], ['speaking', 'Speaking'], ['working', 'Working'], ['success', 'Done'], ['attention', 'Needs you']];
  const [on, setOn] = useState(3);
  const copy = {
    welcome: 'Ready and waiting. This is the Klaro you meet first.',
    thinking: 'Setting up your call or working out what you need.',
    listening: 'Your caller is talking. Klaro leans in and listens.',
    speaking: 'Klaro is answering, in your business’s voice.',
    working: 'Reading your website or taking an action for a caller.',
    success: 'Job done. The enquiry and next step are with you.',
    attention: 'Something needs a person. Klaro turns amber and tells you why.'
  };
  return (
    <section className="lp-dark lp-meet">
      <div className="lp-wrap lp-split">
        <div className="lp-split-copy">
          <span className="lp-kicker lime">Meet Klaro</span>
          <h2 className="lp-h2">A receptionist you can read at a glance.</h2>
          <p className="lp-lede">Klaro shows what it's doing, so you never have to guess. When it needs you, it turns amber and says why.</p>
          <div className="lp-moods" role="tablist" aria-label="Klaro states">
            {moods.map((m, i) => <button key={m[0]} role="tab" aria-selected={on === i} className={on === i ? 'on' : ''} onClick={() => setOn(i)}>{m[1]}</button>)}
          </div>
          <p className="lp-mood-copy" aria-live="polite">{copy[moods[on][0]]}</p>
        </div>
        <div className="lp-meet-stage">
          <div className="kc-beam" /><div className="kc-pool" />
          <div style={{ position: 'relative', zIndex: 2 }}><Klaro mood={moods[on][0]} size={300} /></div>
        </div>
      </div>
      <div className="lp-wrap">
        <div className="lp-mood-strip" aria-hidden="true">
          {moods.map((m, i) => <button key={m[0]} tabIndex={-1} className={'lp-mood-cell' + (on === i ? ' on' : '')} onClick={() => setOn(i)}><Klaro mood={m[0]} size={90} decorative /><span>{m[1]}</span></button>)}
        </div>
      </div>
    </section>
  );
}

function Control() {
  const items = [
    ['eye', 'You approve every fact', 'Klaro only shares what\u2019s on your list. Guesses from your website are marked Check until you confirm them.'],
    ['shield', 'It says it’s virtual', 'Callers always know they’re speaking to a virtual receptionist. That line can’t be removed.'],
    ['hand', 'Hand over any time', 'Set what gets transferred to you, what waits in Needs You and what Klaro handles alone.'],
    ['zap', 'Live only when you say', 'Preview and demo calls never touch your real number. Going live is a separate step with a test call.']
  ];
  return (
    <section className="lp-section" id="control">
      <div className="lp-wrap">
        <Reveal className="lp-head">
          <span className="lp-kicker">You're in control</span>
          <h2 className="lp-h2">Your business, your words, your rules.</h2>
        </Reveal>
        <div className="kc-proof lp-control">
          {items.map((it, i) => (
            <Reveal key={it[1]} className="kc-proof-item" delay={i * 80}>
              <span className="lp-ico"><Icon name={it[0]} /></span>
              <h3>{it[1]}</h3>
              <p>{it[2]}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Plans({ onStart }) {
  return (
    <section className="lp-section lp-tint" id="pricing">
      <div className="lp-wrap">
        <Reveal className="lp-head center">
          <span className="lp-kicker">Getting started</span>
          <h2 className="lp-h2">Start free. Go live when you're ready.</h2>
          <p className="lp-lede">Build and hear your Klaro for free. Pricing for live calls is announced at launch, and early users hear first.</p>
        </Reveal>
        <div className="lp-plans">
          <Reveal className="lp-plan">
            <span className="kc-pill pill-live" style={{ alignSelf: 'flex-start' }}><span className="dot" />Available now</span>
            <h3>Preview</h3>
            <div className="lp-price">Free</div>
            <ul><li><Icon name="check" />Build Klaro from your website</li><li><Icon name="check" />Edit facts, voice and greeting</li><li><Icon name="check" />Demo call to your phone</li><li><Icon name="check" />Sample call summary</li></ul>
            <button className="btn btn-ghost btn-block" onClick={() => { const el = document.getElementById('hero-url'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.focus(), 400); } }}>Try it now</button>
          </Reveal>
          <Reveal className="lp-plan featured" delay={80}>
            <span className="kc-pill pill-demo" style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,.12)', color: '#fff' }}><span className="dot" />At launch</span>
            <h3>Klaro Live</h3>
            <div className="lp-price">Pricing at launch</div>
            <ul><li><Icon name="check" />Answers on your number or a new one</li><li><Icon name="check" />Enquiries, actions and outcomes</li><li><Icon name="check" />Needs You queue and alerts</li><li><Icon name="check" />Command Centre and Klaro Studio</li></ul>
            <button className="btn btn-lime btn-block" onClick={() => onStart('', true)}>Build my Klaro</button>
          </Reveal>
          <Reveal className="lp-plan" delay={160}>
            <span className="kc-pill pill-neutral" style={{ alignSelf: 'flex-start' }}><span className="dot" />With the Klarnow team</span>
            <h3>Done with you</h3>
            <div className="lp-price">Clarity Call</div>
            <ul><li><Icon name="check" />Business diagnosis first</li><li><Icon name="check" />£250 Clarity Call with Klarnow</li><li><Icon name="check" />We set up call handling with you</li><li><Icon name="check" />Part of a wider Klarnow system</li></ul>
            <a className="btn btn-ghost btn-block" href="https://www.klarnow.co.uk/start">Start diagnosis</a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const qs = [
    ['Will callers know they’re talking to an AI?', 'Yes. Klaro introduces itself as a virtual receptionist on every call. We think callers deserve to know, and it builds trust when Klaro then gets things right.'],
    ['What if Klaro doesn’t know the answer?', 'It says so, takes the caller’s details and passes the question to you. It only shares facts you’ve approved, so it won’t make things up about prices or availability.'],
    ['Can I keep my existing phone number?', 'Yes. You can forward your current number to Klaro all the time, only when you don’t answer, or only outside your hours. You can also get a new number instead.'],
    ['Does Klaro book appointments directly?', 'Klaro takes the next step you allow: requesting a booking, sending a link or flagging it to you. Every action is marked as done, pending or failed, so you always know what actually happened.'],
    ['Is the demo call a real call?', 'Yes. Klaro rings the number you give and you can talk to it. The screen shows the real call status (dialling, ringing, connected) and never pretends a call happened if it didn’t.'],
    ['What happens to my data and recordings?', 'Your preview details are only used to build your Klaro. Demo calls are recorded to create your summary, and you’re asked before the call. Our privacy notice explains how long we keep data and how to delete it.'],
    ['How long does setup take?', 'Our aim is to get you from your website to a personalised preview in a couple of minutes. Going live depends on whether you forward an existing number or take a new one.'],
    ['I don’t have a website. Can I still use it?', 'Yes. Choose “Describe your business instead” and tell Klaro the basics: your name, what you do and the services people call about.']
  ];
  const [open, setOpen] = useState(0);
  return (
    <section className="lp-section" id="faq">
      <div className="lp-wrap lp-faq-wrap">
        <Reveal className="lp-head">
          <span className="lp-kicker">FAQ</span>
          <h2 className="lp-h2">Questions, answered.</h2>
          <p className="lp-lede">Something else? Email the team at Klarnow and a person will reply.</p>
        </Reveal>
        <div className="lp-faq">
          {qs.map((q, i) => (
            <div key={q[0]} className={'lp-q' + (open === i ? ' open' : '')}>
              <button aria-expanded={open === i} aria-controls={'faq-' + i} id={'faq-b-' + i} onClick={() => setOpen(open === i ? -1 : i)}>{q[0]}<Icon name="plus" className="pm" /></button>
              {open === i && <div className="lp-a" id={'faq-' + i} role="region" aria-labelledby={'faq-b-' + i}>{q[1]}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ onStart }) {
  return (
    <section className="lp-final-light">
      <div className="lp-wrap lp-final-grid">
        <div className="lp-final-copy">
          <span className="lp-kicker">Try it now</span>
          <h2 className="lp-h2">Hear your receptionist before you sign up.</h2>
          <p className="lp-lede">Paste your website. Klaro learns your business, then answers as you.</p>
          <UrlForm onStart={onStart} id="final-url" />
          <div className="kc-alt">No website? <button className="link" onClick={() => onStart('', true)}>Describe your business instead</button></div>
        </div>
        <HeroKlaro size={420} id="final" beamFrom={-260} />
      </div>
    </section>
  );
}

function Callers() {
  const said = {
    1: 'Can you come Thursday?', 8: 'Is it urgent if…', 10: 'Do you take card?', 13: 'Table for 10?', 19: 'Are you open now?', 22: 'How much is it?'
  };
  const tiles = ['violet', 'lime', 'lilac', 'amber', 'blush', 'mist'];
  const shapes = ['circle', 'drip', 'square', 'drop'];
  const cells = [];
  for (let i = 0; i < 24; i++) cells.push({ i, shape: shapes[(i * 3 + Math.floor(i / 6)) % 4], tile: tiles[(i + Math.floor(i / 6) * 2) % 6], look: (i % 3) - 1 });
  // the 2×2 middle block (cols 3–4, rows 2–3) is Klaro
  const skip = new Set([8, 9, 14, 15]);
  return (
    <section className="lp-section">
      <div className="lp-wrap lp-callers">
        <Reveal className="lp-split-copy">
          <span className="lp-kicker">Your callers</span>
          <h2 className="lp-h2">Every caller is different. Klaro is ready for all of them.</h2>
          <p className="lp-lede">The rushed one, the unsure one, the one with an emergency, the one who just wants your hours. Klaro adapts to each, and you get the same clear summary every time.</p>
          <ul className="lp-callers-list">
            <li><Ally shape="drip" tile="amber" size={44} radius={12} /><div><b>The urgent one</b><span>Flagged in Needs You straight away, with what's happening.</span></div></li>
            <li><Ally shape="square" tile="lilac" size={44} radius={12} /><div><b>The first-timer</b><span>Gets clear answers from your approved facts, then booked in.</span></div></li>
            <li><Ally shape="circle" tile="lime" size={44} radius={12} /><div><b>The quick question</b><span>Answered in one go. No callback needed.</span></div></li>
          </ul>
        </Reveal>
        <Reveal className="lp-wall" delay={100} aria-label="A wall of different callers around Klaro">
          {cells.filter((c) => !skip.has(c.i)).map((c) => (
            <div key={c.i} className={'lp-wall-cell' + (said[c.i] ? ' talk' : '')}>
              {said[c.i] && <span className="lp-bubble" style={{ animationDelay: (Object.keys(said).indexOf(String(c.i)) * 1) + 's' }}>{said[c.i]}</span>}
              <Ally shape={c.shape} tile={c.tile} size={100} radius={16} look={c.look * 3} />
            </div>
          ))}
          <div className="lp-wall-klaro" style={{ gridRow: '2 / span 2', gridColumn: '3 / span 2' }}><span className="tag"><i />Klaro answering</span><KlaroRender alt="Klaro answering calls" fallbackSize={150} /></div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ['Services', ['Websites & online stores', 'Brand & creative', 'Campaigns & launches', 'Klarnow Studio']],
    ['Systems', ['Klarnow Call', 'Smart Management', 'All solutions']],
    ['Start & grow', ['Start diagnosis', 'Start Clear', 'Scale your business', 'How we work', 'Our work']],
    ['Company', ['About Klarnow', 'Partners', 'Capabilities', 'Join Klarnow', 'Contact']],
    ['Support', ['Client login', 'Email the team', '0161 696 0976', 'Help & FAQs', 'Security']]
  ];
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <a className="kc-logo" href="/" aria-label="Klarnow home">KLARNOW<LogoMark /></a>
            <p>It all starts with clarity.</p>
            <span className="lp-tagline">Clear Now. Build Now. Launch Now.</span>
          </div>
          <div className="lp-footer-cols">
            {cols.map((c) => (
              <div key={c[0]}><b>{c[0]}</b>{c[1].map((l) => <a key={l} href={l === '0161 696 0976' ? 'tel:01616960976' : 'https://www.klarnow.co.uk'}>{l}</a>)}</div>
            ))}
          </div>
        </div>
        <div className="lp-footer-bottom"><span>Klarnow © 2026 · Ltd 16544261 Manchester. Working globally.</span><span className="lp-legal"><a href="https://www.klarnow.co.uk">Terms</a><a href="https://www.klarnow.co.uk">Privacy</a><a href="https://www.klarnow.co.uk">Cookies</a></span></div>
      </div>
    </footer>
  );
}

export default function Landing({ onStart }) {
  return (
    <div className="kc lp">
      <a className="lp-skip" href="#main">Skip to content</a>
      <Nav onStart={onStart} />
      <main id="main">
        <Hero onStart={onStart} />
        <Marquee />
        <Moments />
        <Callers />
        <HowItWorks onStart={onStart} />
        <SampleCall />
        <Chain />
        <Features />
        <CommandCentre />
        <Industries />
        <MeetKlaro />
        <Control />
        <Plans onStart={onStart} />
        <Faq />
        <FinalCta onStart={onStart} />
      </main>
      <Footer />
    </div>
  );
}
