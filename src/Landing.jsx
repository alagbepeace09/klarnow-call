import { useEffect, useRef, useState } from 'react';
import Klaro from './components/Klaro.jsx';
import Icon from './components/Icons.jsx';
import { SummaryCard } from './Flow.jsx';
import HeroKlaro, { KlaroRender } from './components/HeroKlaro.jsx';
import Ally, { CALLERS } from './components/Ally.jsx';
import { Brand, BrandMark, ThemeToggle } from './components/Brand.jsx';
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

const Arr = () => <span className="arr"><Icon name="arrow" /></span>;

function focusHero() {
  const el = document.getElementById('hero-url');
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.focus({ preventScroll: true }), 450); }
}

/** Nooks-style section header: "/ LABEL" on the left, big headline on the right. */
function SecHead({ label, accent, title, sub }) {
  return (
    <Reveal className="sh">
      <div className="sh-label"><span className="sh-slash">/</span><span>{label}{accent && <em> {accent}</em>}</span></div>
      <div className="sh-main">
        <h2 className="lp-h2">{title}</h2>
        {sub && <p className="lp-lede">{sub}</p>}
      </div>
    </Reveal>
  );
}

function UrlForm({ onStart, id }) {
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!validUrl(url)) { setErr(url.trim() ? 'That doesn’t look like a web address. Try yourbusiness.co.uk' : 'Enter your website to start, for example yourbusiness.co.uk'); return; }
    onStart(url, false);
  };
  return (
    <div className="lp-urlwrap">
      <form className={'kc-urlbar' + (err ? ' has-error' : '')} onSubmit={submit} noValidate>
        <div className="urlrow">
          <Icon name="globe" />
          <label className="sr" htmlFor={id}>Your business website</label>
          <input id={id} type="text" inputMode="url" autoComplete="url" placeholder="yourbusiness.co.uk" value={url} onChange={(e) => { setUrl(e.target.value); setErr(''); }} aria-invalid={!!err} aria-describedby={id + '-err'} />
        </div>
        <button className="btn btn-primary" type="submit">Get my receptionist<Arr /></button>
      </form>
      {err && <div className="kc-field-err" id={id + '-err'} role="alert" style={{ marginTop: 10 }}><Icon name="alert" size="sm" />{err}</div>}
    </div>
  );
}

/* ---------- nav ---------- */
function Nav({ onStart, theme, onToggleTheme, signedIn, onOpenApp }) {
  const [open, setOpen] = useState(false);
  const links = [['#platform', 'Platform'], ['#how', 'How it works'], ['#callers', 'Callers'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']];
  return (
    <header className={'nv' + (open ? ' open' : '')}>
      <div className="nv-cap">
        <Brand />
        <nav className="nv-links" aria-label="Main">
          {links.map((l) => <a key={l[0]} href={l[0]} onClick={() => setOpen(false)}>{l[1]}</a>)}
        </nav>
        <div className="nv-right">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <a className="btn btn-sm nv-ghost" href="#listen">Hear a call</a>
          {signedIn
            ? <button className="btn btn-primary btn-sm nv-cta" onClick={onOpenApp}>Open my workspace</button>
            : <button className="btn btn-primary btn-sm nv-cta" onClick={focusHero}>Get my receptionist</button>}
          <button className="nv-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
        </div>
      </div>
      {open && (
        <div className="nv-menu">
          {links.map((l) => <a key={l[0]} href={l[0]} onClick={() => setOpen(false)}>{l[1]}</a>)}
          {signedIn
            ? <button className="btn btn-primary btn-block" onClick={() => { setOpen(false); onOpenApp(); }}>Open my workspace<Arr /></button>
            : <button className="btn btn-primary btn-block" onClick={() => { setOpen(false); focusHero(); }}>Get my receptionist<Arr /></button>}
          <button className="btn btn-ghost-dark btn-block" onClick={() => { setOpen(false); onStart('', true); }}>No website? Start here</button>
        </div>
      )}
    </header>
  );
}

/* ---------- hero ---------- */
function Hero({ onStart }) {
  return (
    <section className="hx" id="top">
      <div className="hx-glow" aria-hidden="true" />
      <div className="hx-dots" aria-hidden="true" />
      <div className="hx-in">
        <div className="hx-copy">
          <span className="hx-status"><span className="live" />Preview open <b>/</b> free to try <b>/</b> no signup</span>
          <h1 className="hx-h1">Answer every call. <em>Keep every customer.</em></h1>
          <p className="hx-lede">Klaro is the AI receptionist for the calls you can't pick up. It answers in your business's name, captures the enquiry, takes the next step and tells you what happened.</p>
          <UrlForm onStart={onStart} id="hero-url" />
          <div className="hx-alt"><span>No website?</span> <button className="link" onClick={() => onStart('', true)}>Describe your business instead</button></div>
          <ul className="hx-assure">
            <li><span>+</span>Built from your website</li>
            <li><span>+</span>Hear it call your phone</li>
            <li><span>+</span>Live only when you say</li>
          </ul>
        </div>
        <div className="hx-visual" aria-label="Example: Klaro handles a call from start to finish">
          <HeroKlaro size={520} id="hero">
            <div className="kc-story s1"><span className="step">Call</span><span className="ico" style={{ background: 'none', padding: 0 }}><Ally shape="circle" tile="violet" size={38} radius={22} /></span><div><b>Incoming call · 18:10</b><span>Dinner service is on. Klaro picks up.</span></div></div>
            <div className="kc-story s2"><span className="step">Enquiry</span><span className="ico"><Icon name="doc" /></span><div><b>Enquiry captured</b><span>Alex Morgan · table for 8 · Fri 19:00</span></div></div>
            <div className="kc-story s3"><span className="step">Action</span><span className="ico"><Icon name="calcheck" /></span><div><b>Passed to reservations</b><span>Nothing booked yet · awaiting confirmation</span></div></div>
            <div className="kc-story s4"><span className="step">You</span><span className="ico"><Icon name="bell" /></span><div><b>Your team is told</b><span>Added to Needs You · 18:11</span></div></div>
          </HeroKlaro>
          <span className="lp-example-tag">Example call · simulated</span>
        </div>
      </div>
      <a className="hx-ticker" href="#how" aria-label="How it works">
        <span className="tag"><BrandMark className="tk-mark" />How it works</span>
        <span className="tk-track"><span className="tk-row">Paste your website · Klaro learns your business · It rings your phone to show you · You go live on your number · Paste your website · Klaro learns your business · It rings your phone to show you · You go live on your number ·</span></span>
        <span className="go"><Icon name="arrow" size="sm" /></span>
      </a>
    </section>
  );
}

/* ---------- built for (grid wall) ---------- */
function BuiltFor() {
  const items = ['Plumbers & heating', 'Electricians', 'Dental clinics', 'Salons & barbers', 'Restaurants', 'Estate agents', 'Law firms', 'Garages', 'Cleaning companies', 'Physios', 'Vets', 'Tutors & schools', 'Removals', 'Beauty clinics', 'Builders', 'Locksmiths'];
  return (
    <section className="lp-section bf">
      <div className="lp-wrap">
        <SecHead label="Built for businesses that" accent="can't always pick up" title={<>Made for businesses where <em>the phone still matters.</em></>} />
        <Reveal className="bf-grid">
          {items.map((t, i) => (
            <div key={t} className="bf-cell"><Ally {...CALLERS[i % CALLERS.length]} size={34} radius={10} look={(i % 3) - 1} /><span>{t}</span></div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- problem ---------- */
function Moments() {
  const moments = [
    { t: 'You’re on a job', d: 'Hands full, phone in the van. The caller rings the next name on the list.', klaro: 'Klaro answers, takes the details and requests the visit.', time: '10:14' },
    { t: 'You’re with a client', d: 'You can’t step away mid-appointment. Voicemail rarely gets a message.', klaro: 'Klaro answers questions, notes what they need and flags anything urgent.', time: '14:32' },
    { t: 'You’re closed', d: 'Evenings and weekends are when people finally have time to call.', klaro: 'Klaro takes the enquiry, so you start tomorrow with a list, not a guess.', time: '21:07' }
  ];
  return (
    <section className="lp-section lp-tint">
      <div className="lp-wrap">
        <SecHead label="The problem with" accent="missed calls" title={<>Every unanswered call is a customer <em>making a decision.</em></>} sub="Most people won't leave a voicemail. They call someone else. Klaro makes sure the first answer they get is yours." />
        <div className="lp-moments">
          {moments.map((m, i) => (
            <Reveal key={m.t} className="lp-moment" delay={i * 90}>
              <span className="mono-n">0{i + 1}</span>
              <h3>{m.t}</h3>
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

/* ---------- platform tabs + carousel ---------- */
const KlaroAv = () => <span className="lp-av kd"><KlaroRender fallbackSize={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></span>;
const CallerAv = ({ c = { shape: 'circle', tile: 'violet' } }) => <span className="lp-av"><Ally {...c} size={34} radius={10} /></span>;

function PlatformVisual({ k }) {
  const sum = PRESETS.restaurant.sum;
  if (k === 0) return (
    <div className="pv-chat">
      <div className="lp-line-row c"><CallerAv /><div className="kc-line c"><small>Caller</small>Do you have vegan options?</div></div>
      <div className="lp-line-row k"><KlaroAv /><div className="kc-line k"><small>Klaro</small>Yes, several vegan and gluten-free dishes. Would you like to book a table?</div></div>
      <div className="lp-line-row c"><CallerAv /><div className="kc-line c"><small>Caller</small>Table for eight on Friday at 7?</div></div>
      <div className="lp-line-row k"><KlaroAv /><div className="kc-line k"><small>Klaro</small>Groups of eight are confirmed by our reservations team. I’ll pass it on and they’ll call you back.</div></div>
    </div>
  );
  if (k === 1) return (
    <div className="pv-card">
      <div className="pv-head"><Ally shape="drip" tile="lime" size={44} radius={12} /><div><b>{sum.customer}</b><span>+44 7700 ••• 318 · 18:10</span></div><span className="kc-pill pill-live"><span className="dot" />Captured</span></div>
      <div className="pv-row"><span className="lab">Enquiry</span><b>{sum.enquiry}</b></div>
      <div className="kc-kv">{sum.details.map((d) => <span key={d} className="kv">{d}</span>)}</div>
    </div>
  );
  if (k === 2) return (
    <div className="pv-card">
      <div className="pv-step"><span className="c"><Icon name="check" size="sm" /></span><div><b>Table for 8 · Fri 19:00</b><span>Passed to reservations, nothing booked yet</span></div><span className="kc-pill pill-warn"><span className="dot" />Awaiting confirmation</span></div>
      <div className="pv-step"><span className="c"><Icon name="check" size="sm" /></span><div><b>Caller told what happens next</b><span>"The team will confirm availability with you"</span></div><span className="kc-pill pill-live"><span className="dot" />Done</span></div>
      <div className="pv-step"><span className="c bad"><Icon name="close" size="sm" /></span><div><b>Booking system</b><span>Not connected, so Klaro didn’t book</span></div><span className="kc-pill pill-err"><span className="dot" />Unavailable</span></div>
    </div>
  );
  if (k === 3) return (
    <div className="pv-card">
      <div className="pv-needs-h"><b>Needs you</b><span className="kc-pill pill-warn"><span className="dot" />2 open</span></div>
      <div className="lp-need urgent"><b>Alex Morgan · table for 8</b><span>Availability needs checking for Fri 19:00.</span><div className="lp-need-actions"><span className="btn btn-primary btn-sm">Call back</span><span className="btn btn-ghost btn-sm">Assign</span></div></div>
      <div className="lp-need"><b>Grace Obi · private dining for 20</b><span>Deposit question needs a person.</span></div>
    </div>
  );
  return <div className="pv-sum"><SummaryCard sum={sum} phone="+44 7700 ••• 318" kname="Klaro" demo /></div>;
}

function Platform() {
  const tabs = [
    { n: 'Answer', t: 'Answer like your best person.', d: 'Klaro picks up in your business’s name and answers from facts you approved: services, prices, hours, areas, policies.', tags: ['Approved facts', 'Your greeting', 'Says it’s virtual'] },
    { n: 'Capture', t: 'Keep every enquiry.', d: 'Name, number, what they need and when, asked the way your team would ask. Even if they hang up early.', tags: ['Caller details', 'Structured enquiry', 'Missed-call recovery'] },
    { n: 'Act', t: 'Take the next step.', d: 'Requests a booking, sends a link by text or routes the call. Every action is marked done, pending or failed.', tags: ['Visit requests', 'Text links', 'Honest status'] },
    { n: 'Escalate', t: 'Hand over when it matters.', d: 'Urgent or unusual calls go to Needs You with a priority and an owner, so nothing important waits.', tags: ['Priority', 'Owner', 'Resolve and reopen'] },
    { n: 'Report', t: 'Know what happened.', d: 'Every call ends with one clear summary: customer, enquiry, attempted action, outcome and what’s left for you.', tags: ['Call summary', 'Transcript', 'Command Centre'] }
  ];
  const [on, setOn] = useState(0);
  const [paused, setPaused] = useState(false);
  const [x, setX] = useState(0);
  const trackRef = useRef(null);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setOn((v) => (v + 1) % tabs.length), 7000);
    return () => clearTimeout(t);
  }, [on, paused]);
  useEffect(() => {
    const place = () => {
      const track = trackRef.current; if (!track) return;
      const card = track.children[on]; if (!card) return;
      const vp = track.parentElement.clientWidth;
      setX(-(card.offsetLeft - (vp - card.offsetWidth) / 2));
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [on]);
  return (
    <section className="lp-section lp-tint pf" id="platform" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)}>
      <div className="lp-wrap">
        <SecHead label="The Klaro" accent="platform" title={<>One receptionist for the whole call, <em>hello to follow-up.</em></>} />
        <div className="pf-tabs" role="tablist" aria-label="Platform">
          {tabs.map((t, i) => (
            <button key={t.n} role="tab" id={'pf-tab-' + i} aria-selected={on === i} aria-controls={'pf-card-' + i} className={on === i ? 'on' : ''} onClick={() => setOn(i)}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>{t.n}
              {on === i && !paused && <i className="pf-timer" />}
            </button>
          ))}
        </div>
      </div>
      <div className="pf-viewport">
        <div className="pf-track" ref={trackRef} style={{ transform: 'translateX(' + x + 'px)' }}>
          {tabs.map((t, i) => (
            <article key={t.n} id={'pf-card-' + i} role="tabpanel" aria-labelledby={'pf-tab-' + i} className={'pf-card' + (on === i ? ' on' : '')} onClick={() => setOn(i)}>
              <div className="pf-copy">
                <h3><span className="dot" />{t.t}</h3>
                <p>{t.d}</p>
                <ul>{t.tags.map((g) => <li key={g}><span>+</span>{g}</li>)}</ul>
              </div>
              <div className="pf-vis"><div className="pf-vis-bg" /><PlatformVisual k={i} /></div>
            </article>
          ))}
        </div>
        <button className="pf-arrow prev" aria-label="Previous" onClick={() => setOn((on + tabs.length - 1) % tabs.length)}><Icon name="back" size="sm" /></button>
        <button className="pf-arrow next" aria-label="Next" onClick={() => setOn((on + 1) % tabs.length)}><Icon name="arrow" size="sm" /></button>
      </div>
    </section>
  );
}

/* ---------- how it works ---------- */
function HowItWorks({ onStart }) {
  return (
    <section className="lp-section" id="how">
      <div className="lp-wrap">
        <SecHead label="How it" accent="works" title={<>From your website to a working receptionist, <em>before you sign up.</em></>} />
        <div className="lp-steps">
          <Reveal className="lp-step" delay={0}>
            <span className="mono-n">01</span>
            <h3>Paste your website</h3>
            <p>Klaro reads your site and drafts what it knows: services, hours, area and contact details. You check anything it guessed.</p>
            <div className="lp-mock lp-mock-scan">
              <div className="lp-mock-url"><Icon name="globe" size="sm" />canalstreetkitchen.co.uk</div>
              <div className="lp-mock-row done"><span className="c"><Icon name="check" size="sm" /></span>Finding your services<em>4 services</em></div>
              <div className="lp-mock-row done"><span className="c"><Icon name="check" size="sm" /></span>Opening hours and area<em>Found</em></div>
              <div className="lp-mock-row act"><span className="c spin" />Writing Klaro's greeting<em>Reading…</em></div>
            </div>
          </Reveal>
          <Reveal className="lp-step" delay={100}>
            <span className="mono-n">02</span>
            <h3>Hear it call you</h3>
            <p>Klaro rings your phone and answers as your business. Play a customer, ask awkward questions and see the summary it writes.</p>
            <div className="lp-mock lp-mock-call">
              <div className="lp-mock-klaro"><Klaro mood="speaking" size={110} decorative /></div>
              <div className="lp-mock-callinfo"><span className="kc-dark-pill live"><span className="dot" />Live demo call</span><span className="mono lp-mock-timer">00:42</span><span className="lp-mock-sub">Klaro is speaking</span></div>
            </div>
          </Reveal>
          <Reveal className="lp-step" delay={200}>
            <span className="mono-n">03</span>
            <h3>Go live on your number</h3>
            <p>Forward your existing number when you're busy or closed, or get a new one. Run a test call first. You decide when.</p>
            <div className="lp-mock lp-mock-live">
              <div className="lp-mock-opt on"><span className="r" /><div><b>Forward my number</b><span>Keep the number customers know</span></div></div>
              <div className="lp-mock-opt"><span className="r" /><div><b>Get a new number</b><span>UK local or mobile number</span></div></div>
              <div className="lp-mock-status"><span className="kc-pill pill-warn"><span className="dot" />Test call needed</span><span className="kc-pill pill-neutral">Not live yet</span></div>
            </div>
          </Reveal>
        </div>
        <Reveal className="lp-center-cta">
          <button className="btn btn-primary btn-lg" onClick={focusHero}>Start with my website<Arr /></button>
          <button className="btn btn-ghost btn-lg" onClick={() => onStart('', true)}>I don't have a website</button>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- listen in (dark dot-matrix section) ---------- */
function SampleCall() {
  const lines = sampleScript('Canal Street Kitchen', 'Klaro', '', 'restaurant');
  const [ref, seen] = useInView({ threshold: 0.3 });
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
    <section className="lp-pad" id="listen">
      <div className="dk" ref={ref}>
        <div className="dk-dots" aria-hidden="true" />
        <div className="dk-in">
          <div className="dk-head">
            <div>
              <h2 className="lp-h2">Listen in.</h2>
              <p className="lp-lede">A real enquiry, handled from hello to next step. Klaro uses only what the business approved, says it's virtual and never promises what it can't do.</p>
            </div>
            <div className="dk-aside">
              <p>A simulated call to a restaurant. Nobody is dialled. Turn on sound to hear it in your browser's voice.</p>
              <button className="dk-link" onClick={() => { const n = !sound; setSound(n); if (!n) stopSpeech(); else setRun(run + 1); }} aria-pressed={sound}>{sound ? 'Sound on' : 'Play with sound'}<span><Icon name="speaker" size="sm" /></span></button>
            </div>
          </div>
          <div className="lp-listen">
            <div className="lp-listen-stage">
              <div className="kc-beam" /><div className="kc-pool" />
              <div className="lp-listen-klaro"><Klaro mood={mood} size={230} /></div>
              <div className="lp-listen-status">
                <span className={'kc-dark-pill' + (done ? '' : ' live')}><span className="dot" />{done ? 'Call ended · summary sent' : 'Sample call'}</span>
                <span className="lp-listen-big">{done ? 'Done in 1 min 12 sec' : last ? (last.who === 'k' ? 'Klaro is speaking' : 'Caller is speaking') : 'Incoming call…'}</span>
              </div>
            </div>
            <div className="lp-listen-script" aria-live="polite">
              {shown.map((l, i) => (
                <div key={i} className={'lp-line-row ' + l.who}>
                  {l.who === 'k' ? <KlaroAv /> : <CallerAv />}
                  <div className={'kc-line ' + l.who}><small>{l.who === 'k' ? 'Klaro' : 'Caller · Alex'}</small>{l.text}</div>
                </div>
              ))}
              {done && (
                <div className="lp-listen-sum">
                  <span className="mono-label lime">In the Command Centre, seconds later · example</span>
                  <div className="lp-mini-sum">
                    <div><b>Alex Morgan</b><span>Table for 8 · Fri 28 Nov, 19:00</span></div>
                    <div className="kc-pill pill-warn"><span className="dot" />Awaiting confirmation</div>
                  </div>
                </div>
              )}
              <div className="lp-listen-ctrls">
                <button className="btn btn-ghost-dark btn-sm" onClick={() => { stopSpeech(); setRun(run + 1); }}><Icon name="play" size="sm" />Replay</button>
                <span className="lp-note-dark">Sample conversation · voice played by your browser</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- outcomes bento ---------- */
function Outcomes() {
  const pills = [['Enquiry', 'captured'], ['Visit', 'requested'], ['Owner', 'notified'], ['Urgent', 'flagged']];
  const [p, setP] = useState(0);
  useEffect(() => { const t = setInterval(() => setP((v) => (v + 1) % pills.length), 2400); return () => clearInterval(t); }, []);
  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <SecHead label="What every call" accent="leaves behind" title={<>Calls that get handled. <em>Summaries that prove it.</em></>} />
        <div className="ob">
          <Reveal className="ob-cell ob-intro">
            <p>Every call ends with a <em>clear next step</em>, honest about what's done and what's still pending.</p>
            <div className="ob-dots" aria-hidden="true" />
          </Reveal>
          <Reveal className="ob-cell ob-klaro" delay={60}><div className="ob-klaro-in"><KlaroRender alt="Klaro" fallbackSize={160} /></div><span className="ob-tag">Klaro · answering 24/7</span></Reveal>
          <Reveal className="ob-cell ob-ally" delay={120}><Ally shape="drip" tile="lime" size={96} radius={18} /><span>The urgent one</span></Reveal>
          <Reveal className="ob-cell ob-accent" delay={60}>
            <div className="ob-pills">
              {pills.map((v, i) => (
                <div key={v[0]} className={'ob-pill' + (i === p ? ' on' : i === (p + 1) % pills.length ? ' next' : '')}><b>{v[0]}</b><span>{v[1]}</span></div>
              ))}
            </div>
          </Reveal>
          <Reveal className="ob-cell ob-sum" delay={120}><SummaryCard sum={PRESETS.restaurant.sum} phone="+44 7700 ••• 318" kname="Klaro" demo /></Reveal>
          <Reveal className="ob-cell ob-ally" delay={180}><Ally shape="square" tile="lilac" size={96} radius={18} /><span>The first-timer</span></Reveal>
          <Reveal className="ob-cell ob-quote" delay={60}>
            <span className="mono-label">What lands on your phone</span>
            <p>"Alex Morgan called at 18:10. Table for 8, Friday 19:00. Not booked yet: check availability and call Alex back."</p>
            <div className="ob-chips"><span className="on">Text alert</span><span>Command Centre</span></div>
          </Reveal>
          <Reveal className="ob-cell ob-ally" delay={120}><Ally shape="circle" tile="amber" size={96} radius={18} /><span>The quick question</span></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- callers wall ---------- */
function Callers() {
  const said = { 1: 'Can I book Friday?', 10: 'Do you take card?', 13: 'Table for 8?', 19: 'Are you open now?', 22: 'How much is it?' };
  const tiles = ['violet', 'lime', 'lilac', 'amber', 'blush', 'mist'];
  const shapes = ['circle', 'drip', 'square', 'drop'];
  const cells = [];
  for (let i = 0; i < 24; i++) cells.push({ i, shape: shapes[(i * 3 + Math.floor(i / 6)) % 4], tile: tiles[(i + Math.floor(i / 6) * 2) % 6], look: (i % 3) - 1 });
  const skip = new Set([8, 9, 14, 15]);
  return (
    <section className="lp-section lp-tint" id="callers">
      <div className="lp-wrap">
        <SecHead label="Your" accent="callers" title={<>Every caller is different. <em>Klaro is ready for all of them.</em></>} />
        <div className="lp-callers">
          <Reveal className="lp-split-copy">
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
                {said[c.i] && <span className="lp-bubble" style={{ animationDelay: Object.keys(said).indexOf(String(c.i)) + 's' }}>{said[c.i]}</span>}
                <Ally shape={c.shape} tile={c.tile} size={100} radius={16} look={c.look * 3} />
              </div>
            ))}
            <div className="lp-wall-klaro" style={{ gridRow: '2 / span 2', gridColumn: '3 / span 2' }}><span className="tag"><i />Klaro answering</span><KlaroRender alt="Klaro answering calls" fallbackSize={150} /></div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- command centre ---------- */
function CommandCentre() {
  const calls = [
    ['18:10', 'Alex Morgan', 'Table for 8 on Friday at 7pm', 'Awaiting confirmation', 'pill-warn'],
    ['17:42', 'Unknown caller', 'Asked about vegan options', 'Answered', 'pill-live'],
    ['17:05', 'Grace Obi', 'Private dining for 20', 'Needs you', 'pill-err'],
    ['16:30', 'Ben Carter', 'Moved Thursday booking to 20:30', 'Done', 'pill-live']
  ];
  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <SecHead label="The command" accent="centre" title={<>Your day at a glance: <em>calls, enquiries and what needs you.</em></>} sub="Every call is linked to a customer, an enquiry, an action and an outcome. Search it, assign it, resolve it." />
        <Reveal className="lp-dash" delay={100}>
          <div className="lp-dash-top">
            <div className="lp-dash-brand"><BrandMark /><b>Canal Street Kitchen</b></div>
            <div className="lp-dash-tabs" role="presentation"><span className="on">Today</span><span>Calls & enquiries</span><span>Needs you</span><span className="hide-sm">Klaro Studio</span></div>
            <span className="kc-pill pill-demo"><span className="dot" />Example workspace</span>
          </div>
          <div className="lp-dash-body">
            <div className="lp-dash-stats">
              <div><span>Calls answered</span><b>14</b><em>today</em></div>
              <div><span>Enquiries captured</span><b>9</b><em>3 awaiting confirmation</em></div>
              <div><span>Waiting on you</span><b>2</b><em>1 high priority</em></div>
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
                <div className="lp-dash-h">Needs you <span className="kc-pill pill-warn" style={{ height: 22 }}>2 open</span></div>
                <div className="lp-need urgent"><b>Alex Morgan · table for 8</b><span>Availability needs checking for Fri 19:00.</span><div className="lp-need-actions"><span className="btn btn-primary btn-sm">Call back</span><span className="btn btn-ghost btn-sm">Assign</span></div></div>
                <div className="lp-need"><b>Grace Obi · private dining for 20</b><span>Deposit question needs a person.</span><div className="lp-need-actions"><span className="btn btn-ghost btn-sm">Assign</span><span className="btn btn-ghost btn-sm">Resolve</span></div></div>
              </div>
            </div>
          </div>
          <span className="lp-sample-tag">Example · sample data</span>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- industries ---------- */
function Industries() {
  const tabs = [
    { k: 'restaurant', label: 'Restaurants', handles: ['Table and group bookings', 'Allergy and dietary questions', 'Opening hours and directions', 'Private dining enquiries'] },
    { k: 'plumbing', label: 'Trades', handles: ['Call-out and emergency questions', 'Visit requests with postcode and access notes', 'Quotes: photos requested by text', 'Urgent leaks flagged straight to you'] },
    { k: 'dental', label: 'Clinics', handles: ['New patient questions', 'Appointment requests and changes', 'Emergency triage to the right slot', 'Forms and directions sent by text'] },
    { k: 'salon', label: 'Salons', handles: ['Service and price questions', 'Booking requests with stylist preference', 'Deposit and patch-test policy', 'Late and cancellation messages'] }
  ];
  const [on, setOn] = useState(0);
  const t = tabs[on];
  const p = PRESETS[t.k];
  return (
    <section className="lp-section lp-tint" id="industries">
      <div className="lp-wrap">
        <SecHead label="Who it's" accent="for" title={<>Ready for your trade <em>on day one.</em></>} />
        <div className="pf-tabs small" role="tablist" aria-label="Industries">
          {tabs.map((x, i) => (
            <button key={x.k} role="tab" id={'tab-' + x.k} aria-selected={on === i} aria-controls="ind-panel" className={on === i ? 'on' : ''} onClick={() => setOn(i)}><span className="num">{String(i + 1).padStart(2, '0')}</span>{x.label}</button>
          ))}
        </div>
        <div className="lp-ind" role="tabpanel" id="ind-panel" aria-labelledby={'tab-' + t.k} key={t.k}>
          <div className="lp-ind-copy">
            <h3>Klaro for {p.label.toLowerCase()}</h3>
            <p>{p.desc}</p>
            <ul>{t.handles.map((h) => <li key={h}><span>+</span>{h}</li>)}</ul>
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

/* ---------- meet klaro (dark) ---------- */
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
    <section className="lp-pad">
      <div className="dk meet">
        <div className="dk-dots" aria-hidden="true" />
        <div className="dk-in lp-split">
          <div className="lp-split-copy">
            <span className="mono-label lime">/ Meet Klaro</span>
            <h2 className="lp-h2">A receptionist you can read <em>at a glance.</em></h2>
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
        <div className="dk-in" style={{ paddingTop: 0 }}>
          <div className="lp-mood-strip" aria-hidden="true">
            {moods.map((m, i) => <button key={m[0]} tabIndex={-1} className={'lp-mood-cell' + (on === i ? ' on' : '')} onClick={() => setOn(i)}><Klaro mood={m[0]} size={90} decorative /><span>{m[1]}</span></button>)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- control (glass cards on gradient) ---------- */
function Control() {
  const items = [
    ['eye', 'You approve every fact', 'Klaro only shares what’s on your list. Guesses from your website are marked Check until you confirm them.', ['Approved facts', 'Check flags']],
    ['shield', 'It says it’s virtual', 'Callers always know they’re speaking to a virtual receptionist. That line can’t be removed.', ['Disclosure', 'Honest status']],
    ['hand', 'Live only when you say', 'Preview and demo calls never touch your real number. Going live is a separate step with a test call.', ['Test call', 'Hand over any time']]
  ];
  return (
    <section className="lp-pad" id="control">
      <div className="gl">
        <div className="gl-bg" aria-hidden="true"><div className="gl-klaro"><KlaroRender alt="" fallbackSize={260} /></div></div>
        <div className="gl-top">
          <span className="mono-label">/ You're in control</span>
          <div className="gl-aside"><p>Klaro works inside the limits you set. Nothing reaches a caller that you haven't approved.</p><button className="btn btn-sm gl-btn" onClick={focusHero}>Build my Klaro<Arr /></button></div>
        </div>
        <h2 className="lp-h2 gl-h">Your business. <em>Your rules.</em></h2>
        <div className="gl-cards">
          {items.map((it, i) => (
            <Reveal key={it[1]} className="gl-card" delay={i * 80}>
              <h3><Icon name={it[0]} />{it[1]}</h3>
              <p>{it[2]}</p>
              <div className="gl-tags">{it[3].map((t) => <span key={t}>{t}</span>)}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- plans ---------- */
function Plans({ onStart }) {
  return (
    <section className="lp-section" id="pricing">
      <div className="lp-wrap">
        <SecHead label="Getting" accent="started" title={<>Start free. <em>Go live when you're ready.</em></>} sub="Build and hear your Klaro for free. Pricing for live calls is announced at launch, and early users hear first." />
        <div className="lp-plans">
          <Reveal className="lp-plan">
            <span className="kc-pill pill-live" style={{ alignSelf: 'flex-start' }}><span className="dot" />Available now</span>
            <h3>Preview</h3>
            <div className="lp-price">Free</div>
            <ul><li><span>+</span>Build Klaro from your website</li><li><span>+</span>Edit facts, voice and greeting</li><li><span>+</span>Demo call to your phone</li><li><span>+</span>Sample call summary</li></ul>
            <button className="btn btn-ghost btn-block" onClick={focusHero}>Try it now</button>
          </Reveal>
          <Reveal className="lp-plan featured" delay={80}>
            <span className="kc-pill" style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,.12)', color: '#fff' }}><span className="dot" />At launch</span>
            <h3>Klaro Live</h3>
            <div className="lp-price">Pricing at launch</div>
            <ul><li><span>+</span>Answers on your number or a new one</li><li><span>+</span>Enquiries, actions and outcomes</li><li><span>+</span>Needs You queue and alerts</li><li><span>+</span>Command Centre and Klaro Studio</li></ul>
            <button className="btn btn-primary btn-block" onClick={() => onStart('', true)}>Build my Klaro<Arr /></button>
          </Reveal>
          <Reveal className="lp-plan" delay={160}>
            <span className="kc-pill pill-neutral" style={{ alignSelf: 'flex-start' }}><span className="dot" />Set up with us</span>
            <h3>Done with you</h3>
            <div className="lp-price">Guided setup</div>
            <ul><li><span>+</span>A call with our team first</li><li><span>+</span>We set up call handling with you</li><li><span>+</span>Facts, routing and alerts tuned</li><li><span>+</span>Go live with a tested number</li></ul>
            <button className="btn btn-ghost btn-block" onClick={() => onStart('', true)}>Start guided setup</button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- faq ---------- */
function Faq() {
  const qs = [
    ['Will callers know they’re talking to an AI?', 'Yes. Klaro introduces itself as a virtual receptionist on every call. Callers deserve to know, and it builds trust when Klaro then gets things right.'],
    ['What if Klaro doesn’t know the answer?', 'It says so, takes the caller’s details and passes the question to you. It only shares facts you’ve approved, so it won’t make things up about prices or availability.'],
    ['Can I keep my existing phone number?', 'Yes. Forward your current number to Klaro all the time, only when you don’t answer, or only outside your hours. Or get a new number instead.'],
    ['Does Klaro book appointments directly?', 'Klaro takes the next step you allow: requesting a booking, sending a link or flagging it to you. Every action is marked as done, pending or failed, so you always know what actually happened.'],
    ['Is the demo call a real call?', 'Yes. Klaro rings the number you give and you can talk to it. The screen shows the real call status (dialling, ringing, connected) and never pretends a call happened if it didn’t.'],
    ['What happens to my data and recordings?', 'Your preview details are only used to build your Klaro. Demo calls are recorded to create your summary, and you’re asked before the call. The privacy notice explains how long data is kept and how to delete it.'],
    ['How long does setup take?', 'The aim is to get you from your website to a personalised preview in a couple of minutes. Going live depends on whether you forward an existing number or take a new one.'],
    ['I don’t have a website. Can I still use it?', 'Yes. Choose “Describe your business instead” and tell Klaro the basics: your name, what you do and the services people call about.']
  ];
  const [open, setOpen] = useState(0);
  return (
    <section className="lp-section lp-tint" id="faq">
      <div className="lp-wrap">
        <SecHead label="Questions," accent="answered" title={<>Everything you'd <em>ask on the phone.</em></>} />
        <div className="lp-faq">
          {qs.map((q, i) => (
            <div key={q[0]} className={'lp-q' + (open === i ? ' open' : '')}>
              <button aria-expanded={open === i} aria-controls={'faq-' + i} id={'faq-b-' + i} onClick={() => setOpen(open === i ? -1 : i)}><span className="qn">{String(i + 1).padStart(2, '0')}</span><span className="qt">{q[0]}</span><Icon name="plus" className="pm" /></button>
              {open === i && <div className="lp-a" id={'faq-' + i} role="region" aria-labelledby={'faq-b-' + i}>{q[1]}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- final cta ---------- */
function FinalCta({ onStart }) {
  return (
    <section className="lp-section fc">
      <div className="lp-wrap fc-grid">
        <div className="fc-copy">
          <span className="mono-label">/ Try it now</span>
          <h2 className="lp-h2">Hear your receptionist <em>before you sign up.</em></h2>
          <p className="lp-lede">Paste your website. Klaro learns your business, then answers as you.</p>
          <UrlForm onStart={onStart} id="final-url" />
          <div className="hx-alt"><span>No website?</span> <button className="link" onClick={() => onStart('', true)}>Describe your business instead</button></div>
        </div>
        <HeroKlaro size={420} id="final" beamFrom={-260} />
      </div>
    </section>
  );
}

/* ---------- footer ---------- */
function Footer() {
  const cols = [
    ['Product', [['Platform', '#platform'], ['How it works', '#how'], ['Listen in', '#listen'], ['Pricing', '#pricing']]],
    ['Use cases', [['Trades', '#industries'], ['Clinics', '#industries'], ['Salons', '#industries'], ['Restaurants', '#industries']]],
    ['Help', [['FAQ', '#faq'], ['Control & privacy', '#control'], ['Callers', '#callers'], ['Back to top', '#top']]]
  ];
  return (
    <footer className="ft">
      <div className="ft-glow" aria-hidden="true" />
      <div className="lp-wrap ft-in">
        <div className="ft-brand">
          <div className="ft-word"><BrandMark className="ft-mark" /><span>klaro<em>call</em></span></div>
          <p>The receptionist for calls you can't pick up.</p>
        </div>
        <div className="ft-cols">
          {cols.map((c) => (
            <div key={c[0]}><b><span>/</span>{c[0]}</b>{c[1].map((l) => <a key={l[0]} href={l[1]}>{l[0]}</a>)}</div>
          ))}
        </div>
      </div>
      <div className="lp-wrap ft-bottom"><span>© 2026 Klaro Call</span><span>Preview build · sample data</span></div>
    </footer>
  );
}

export default function Landing({ onStart, theme, onToggleTheme, signedIn, onOpenApp }) {
  return (
    <div className="kc lp">
      <a className="lp-skip" href="#main">Skip to content</a>
      <Nav onStart={onStart} theme={theme} onToggleTheme={onToggleTheme} signedIn={signedIn} onOpenApp={onOpenApp} />
      <main id="main">
        <Hero onStart={onStart} />
        <BuiltFor />
        <Moments />
        <Platform />
        <HowItWorks onStart={onStart} />
        <SampleCall />
        <Outcomes />
        <Callers />
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
