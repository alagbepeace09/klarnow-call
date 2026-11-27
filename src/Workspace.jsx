import { useEffect, useRef, useState } from 'react';
import Icon from './components/Icons.jsx';
import Ally from './components/Ally.jsx';
import Klaro from './components/Klaro.jsx';
import { BrandMark, ThemeToggle } from './components/Brand.jsx';
import { Tag } from './components/Review.jsx';
import { counts } from './workspace/model.js';

// Set from the current workspace on every render of <Workspace>.
let PEOPLE = {};
const peopleList = () => Object.values(PEOPLE);

/* Status vocab: [label, tone]. Tones map to a dot colour. */
const STATUS = { awaiting: ['Awaiting confirmation', 'amber'], open: ['Open', 'amber'], confirmed: ['Confirmed · follow-up open', 'violet'], closed: ['Closed', 'grey'] };
const BOOKING = { awaiting: ['Not confirmed', 'amber'], confirmed: ['Confirmed', 'green'], 'n/a': ['No booking', 'grey'] };
const DELIVERY = { none: ['Not sent', 'grey'], sending: ['Sending', 'violet'], failed: ['Not delivered', 'red'], delivered: ['Delivered', 'green'], told: ['Told on the call', 'grey'] };
const PRIO = { High: 'red', Medium: 'amber', Low: 'grey' };

const Dot = ({ map, k, pre }) => {
  const v = map[k] || [k, 'grey'];
  return <span className={'ap t-' + v[1]}><i />{pre ? <em>{pre}</em> : null}{v[0]}</span>;
};
const initials = (n) => n.split(' ').map((w) => w[0]).join('');
const ownerName = (id) => (id && PEOPLE[id] ? PEOPLE[id].name : 'Unassigned');
const first = (n) => n.split(' ')[0];
const two = (n) => String(n).padStart(2, '0');

function ReadOnly({ ann, what = 'change this enquiry' }) {
  return (
    <div className="a-ro" role="note">
      <span className="a-ro-ic"><Icon name="eye" size="sm" /></span>
      <p><b>View only.</b> Only owners and admins can {what}. Being assigned lets you see it and follow up; an owner or admin records the outcome.</p>
      <Tag kind="flag" show={ann} label="Should assigned members record outcomes?" />
    </div>
  );
}

function SampleNote({ ws, live, onSetup, onExamples, role }) {
  if (live) {
    if (!ws.enquiries.length) return null;
    return (
      <div className="a-note" role="note">
        <span className="a-note-ic"><Icon name="info" size="sm" /></span>
        <p><b>These are example calls made for {ws.biz}.</b> They’re here so you can try the dashboard. Real calls appear once your number is live.</p>
        {role === 'owner' && onExamples ? <button className="ab ab-light" onClick={() => onExamples(false)}>Remove examples</button> : <span className="ap t-violet"><i />Examples</span>}
      </div>
    );
  }
  return (
    <div className="a-note" role="note">
      <span className="a-note-ic"><Icon name="info" size="sm" /></span>
      <p><b>You’re looking at a sample workspace.</b> Set up a receptionist for your own business to see it here with your details.</p>
      <button className="ab ab-dark" onClick={onSetup}>Set up mine<Icon name="arrow" size="sm" /></button>
    </div>
  );
}

function EmptyCalls({ ws, role, onExamples }) {
  return (
    <div className="a-card a-empty-big">
      <Klaro mood="welcome" size={96} decorative />
      <div>
        <h2>No calls yet</h2>
        <p className="a-p">Calls appear here the moment {ws.klaro} answers one for {ws.biz}. Nothing is live until your phone number is connected.</p>
        {role === 'owner' && onExamples && <div className="a-actions" style={{ marginTop: 14 }}><button className="ab ab-dark" onClick={() => onExamples(true)}>Load example calls to try it</button></div>}
      </div>
    </div>
  );
}

function FirstRun({ ws, role, me, go, onExamples, domain, personal }) {
  const [copied, setCopied] = useState(false);
  const hour = Math.floor(ws.clock / 60);
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const team = Object.values(PEOPLE);
  const link = (typeof window !== 'undefined' ? window.location.origin : '') + '/signin';
  const copy = () => { try { navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }); } catch (e) { /* clipboard unavailable */ } };
  return (
    <div className="a-page">
      <header className="a-head">
        <div>
          <p className="a-eyebrow">{ws.todayLong} · Command Centre</p>
          <h1>{greet}, {first(me.name)}</h1>
          <p className="a-sub">This is <b>{ws.biz}</b>’s workspace. {role === 'owner' ? 'You own it.' : 'You’re a member, so you can see everything here.'}</p>
        </div>
      </header>

      <div className="a-bento">
        <section className="a-card a-tonight">
          <div className="a-card-top"><h2>Your receptionist</h2><span className="ap t-green"><i />Saved</span></div>
          <div className="a-rcpt">
            <Klaro mood="success" size={92} decorative />
            <div><b>{ws.klaro} for {ws.biz}</b><span>{ws.url ? 'Learned from ' + ws.url : 'Set up from your details'}</span></div>
          </div>
          <div className="a-chips">{(ws.services || []).slice(0, 4).map((x) => <span key={x}>{x}</span>)}{(ws.services || []).length > 4 && <span>+{ws.services.length - 4} more</span>}</div>
          <div className="a-latest" role="note"><Icon name="info" size="sm" /><span>Changing what {ws.klaro} says (Klaro Studio) is planned for the next review.</span></div>
        </section>

        <section className="a-card a-glow">
          <div className="a-card-top"><h2>Calls</h2></div>
          <div className="a-glow-num"><span className="dotnum">00</span><span>calls yet</span></div>
          <p className="a-glow-p">Every call {ws.klaro} answers shows up here with a summary, and anything that needs a person goes to Needs You.</p>
          {role === 'owner' && onExamples
            ? <button className="a-glow-foot" onClick={() => onExamples(true)}><span><b>Load example calls</b>Try the dashboard with made-up calls for {ws.biz}</span><Icon name="arrow" size="sm" /></button>
            : <p className="a-glow-foot calm">Nothing is live until the phone number is connected.</p>}
        </section>

        <section className="a-card a-dark">
          <div className="a-card-top"><h2>Phone number</h2><span className="ap t-amber on-dark"><i />Not live</span></div>
          <p className="a-dark-t">Next: connect a number</p>
          <p className="a-dark-p">Forward the number customers already call, or get a new one. Calls reach {ws.klaro} only after this step.</p>
          <div className="a-dark-foot">
            <span className="a-mute">Saved · {ws.savedAt}</span>
            {role === 'owner' ? <button className="ab ab-white" onClick={() => go('/app/number')}>Set up a number<Icon name="arrow" size="sm" /></button> : <span className="a-mute">An owner sets this up</span>}
          </div>
        </section>
      </div>

      <div className="a-two">
        <section className="a-card">
          <div className="a-card-top"><h2>How this works</h2></div>
          <ol className="a-steps">
            <li className="done"><span>1</span><div><b>{ws.klaro} is saved</b><p>Linked to your work email. This dashboard is yours.</p></div></li>
            <li><span>2</span><div><b>Connect a phone number</b><p>Forward your number or get a new one, then run a test call.</p></div></li>
            <li><span>3</span><div><b>{ws.klaro} answers your calls</b><p>Each call lands in Calls & Enquiries with a summary.</p></div></li>
            <li><span>4</span><div><b>Your team follows up</b><p>Anything {ws.klaro} can’t finish goes to Needs You for a person.</p></div></li>
          </ol>
        </section>
        <section className="a-card">
          <div className="a-card-top"><h2>Team</h2><span className="a-mute sm">{team.length} {team.length === 1 ? 'person' : 'people'}</span></div>
          <div className="a-sunk">
            {team.map((p) => (
              <div key={p.id} className="a-row static">
                <span className="a-av sm">{initials(p.name).slice(0, 2)}</span>
                <span className="m"><b>{p.name}{p.id === me.id ? ' (you)' : ''}</b><span>{p.email}</span></span>
                <span className={'ap ' + (p.role === 'owner' ? 't-violet' : 't-grey')}><i />{p.role === 'owner' ? 'Owner' : 'Member'}</span>
              </div>
            ))}
          </div>
          {!personal ? (
            <div className="a-invite">
              <p className="a-fine">To add colleagues, send them the sign-in link. Anyone who signs in with an <b>@{domain}</b> email joins this workspace as a member.</p>
              <button className="ab ab-light" onClick={copy}>{copied ? 'Link copied' : 'Copy sign-in link'}</button>
            </div>
          ) : <p className="a-fine" style={{ marginTop: 12 }}>This is a personal workspace (signed in with a personal email), so it isn’t shared. Sign in with a company email to work as a team.</p>}
        </section>
      </div>
    </div>
  );
}

/* ---------- 05 Command Centre ---------- */
function CommandCentre({ ws, role, me, go, openEnq, ann, live, onSetup, onExamples, domain, personal }) {
  const c = counts(ws);
  if (live && !ws.enquiries.length) return <FirstRun ws={ws} role={role} me={me} go={go} onExamples={onExamples} domain={domain} personal={personal} />;
  const openNeeds = ws.needs.filter((n) => n.state !== 'resolved');
  const lead = openNeeds[0] && ws.enquiries.find((e) => e.id === openNeeds[0].enquiry);
  const today = ws.enquiries.filter((e) => e.day === ws.today).sort((a, b) => (a.received < b.received ? 1 : -1));
  const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const lo = today.length ? Math.min(...today.map((e) => mins(e.received))) : ws.clock - 120;
  const startH = Math.max(0, Math.floor(lo / 60) - (lo % 60 < 15 ? 1 : 0));
  const span = [startH * 60, Math.min(24, startH + 3) * 60];
  const hrs = [0, 1, 2, 3].map((k) => String((startH + k) % 24).padStart(2, '0') + ':00');
  const hour = Math.floor(ws.clock / 60);
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const when = hour >= 17 ? 'tonight' : 'today';
  return (
    <div className="a-page">
      <header className="a-head">
        <div>
          <p className="a-eyebrow">{ws.todayLong} · Command Centre</p>
          <h1>{greet}, {first(me.name)}</h1>
          <p className="a-sub">{c.needsOpen ? c.needsOpen + (c.needsOpen > 1 ? ' things need' : ' thing needs') + ' a person ' + when + '.' : 'Nothing needs a person right now.'}</p>
        </div>
        <Tag kind="demo" show={ann} label="Sample workspace data" />
      </header>

      <SampleNote ws={ws} live={live} onSetup={onSetup} onExamples={onExamples} role={role} />

      <div className="a-bento">
        <section className="a-card a-tonight">
          <div className="a-card-top"><h2>{when === 'tonight' ? 'Tonight' : 'Today'}</h2><button className="a-pill-btn" onClick={() => go('/app/enquiries')}>All calls<Icon name="upright" size="sm" /></button></div>
          <div className="a-big-row">
            <button className="a-big" onClick={() => go('/app/enquiries')} aria-label={c.callsToday + ' calls today. Open calls and enquiries'}>
              <span className="dotnum">{two(c.callsToday)}</span><span className="lab">Calls answered</span>
            </button>
            <button className="a-big" onClick={() => go('/app/enquiries?f=open')} aria-label={c.openEnq + ' open enquiries'}>
              <span className="dotnum">{two(c.openEnq)}</span><span className="lab">Open enquiries</span>
            </button>
          </div>
          {today[0] && (
            <button className="a-latest" onClick={() => openEnq(today[0].id)}>
              <Ally shape={today[0].ally.shape} tile={today[0].ally.tile} size={34} radius={17} />
              <span><small>Latest call · {today[0].received}</small><b>{today[0].customer}</b> · {today[0].topic}</span>
              <Icon name="upright" size="sm" />
            </button>
          )}
          <div className="a-track" aria-hidden="true">
            <div className="a-ticks">{Array.from({ length: 37 }).map((_, i) => <i key={i} className={i % 12 === 0 ? 'h' : ''} />)}</div>
            {today.map((e) => <span key={e.id} className="a-mark" style={{ left: ((mins(e.received) - span[0]) / (span[1] - span[0]) * 100) + '%' }}><b>{first(e.customer === 'Unknown caller' ? 'Caller' : e.customer)}</b></span>)}
            <div className="a-hours">{hrs.map((h) => <span key={h}>{h}</span>)}</div>
          </div>
        </section>

        <section className="a-card a-glow">
          <div className="a-card-top">
            <h2>Needs you</h2>
            <button className="a-circle light" onClick={() => go('/app/needs-you')} aria-label="Open Needs You"><Icon name="upright" size="sm" /></button>
          </div>
          <div className="a-glow-num"><span className="dotnum">{two(c.needsOpen)}</span><span>{c.needsOpen ? 'open item' + (c.needsOpen > 1 ? 's' : '') : 'All clear'}</span></div>
          <div className="a-orbit" aria-hidden="true">
            <span className="ring r1" /><span className="ring r2" />
            {openNeeds.slice(0, 3).map((n, i) => { const e = ws.enquiries.find((x) => x.id === n.enquiry); return <span key={n.id} className={'sat s' + i}><Ally shape={e.ally.shape} tile={e.ally.tile} size={34} radius={17} /></span>; })}
            <span className="core"><BrandMark className="core-mark" /></span>
          </div>
          {lead ? (
            <button className="a-glow-foot" onClick={() => openEnq(lead.id)}>
              <span><b>{openNeeds[0].reason}</b>{lead.customer} · {lead.topic}</span>
              <span className="dotnum sm">{openNeeds[0].opened}</span>
            </button>
          ) : <p className="a-glow-foot calm">Klaro will add anything it can’t finish here.</p>}
        </section>

        <section className="a-card a-dark">
          <div className="a-card-top"><h2>Phone number</h2><span className="ap t-amber on-dark"><i />Not live</span></div>
          <p className="a-dark-t">No number yet</p>
          <p className="a-dark-p">Calls can’t reach {ws.klaro} until a number is active. Until then, the calls here are examples.</p>
          <div className="a-dark-foot">
            <span className="a-mute">Saved · {ws.savedAt}</span>
            {role === 'owner'
              ? <button className="ab ab-white" onClick={() => go('/app/number')}>Set up a number<Icon name="arrow" size="sm" /></button>
              : <span className="a-mute">An owner sets this up</span>}
          </div>
          <Tag kind="pending" show={ann} label="Number not active" />
        </section>
      </div>

      <div className="a-two">
        <section className="a-card">
          <div className="a-card-top"><h2>Latest calls</h2><button className="a-link" onClick={() => go('/app/enquiries')}>See all</button></div>
          <div className="a-sunk">
            {ws.enquiries.map((e) => (
              <button key={e.id} className="a-row" onClick={() => openEnq(e.id)}>
                <Ally shape={e.ally.shape} tile={e.ally.tile} size={36} radius={18} />
                <span className="m"><b>{e.customer}</b><span>{e.topic}</span></span>
                <Dot map={STATUS} k={e.status} />
                <span className="t">{e.day === ws.today ? e.received : e.day.slice(0, 3)}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="a-card a-follow">
          <div className="a-card-top"><h2>Follow-ups</h2><button className="a-link" onClick={() => go('/app/enquiries?f=action')}>Open</button></div>
          <button className="a-follow-n" onClick={() => go('/app/enquiries?f=action')}><span className="dotnum">{two(c.actions)}</span><span>Confirmations to make or send</span></button>
          <div className="a-sep" />
          <div className="a-demo">
            <span className="a-demo-ic"><Icon name="play" size="sm" /></span>
            <div><b>{ws.demoCall === 'completed' ? 'Your test call' : 'Your example call'}</b><span>{ws.demoCall === 'completed' ? 'Kept for reference. Not a real enquiry and not counted.' : ws.demoCall === 'preview' ? 'You heard an example call during setup. No call was made.' : 'Skipped during setup.'}</span></div>
            <span className="ap t-violet"><i />Demo</span>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- 07 Calls & Enquiries ---------- */
function Enquiries({ ws, role, filter, setFilter, q, openEnq, ann, live, onSetup, onExamples }) {
  const needle = q.trim().toLowerCase();
  const list = ws.enquiries.filter((e) => {
    if (needle && !(e.customer + ' ' + e.topic + ' ' + e.phone).toLowerCase().includes(needle)) return false;
    if (filter === 'open') return e.status !== 'closed';
    if (filter === 'action') return e.booking === 'awaiting' || e.delivery === 'failed' || (e.status === 'confirmed' && e.delivery === 'none');
    if (filter === 'closed') return e.status === 'closed';
    return true;
  });
  const tabs = [['all', 'All'], ['open', 'Open'], ['action', 'Needs action'], ['closed', 'Closed']];
  return (
    <div className="a-page">
      <header className="a-head">
        <div><p className="a-eyebrow">Calls & Enquiries</p><h1>Every call, and what happens next</h1></div>
        <Tag kind="demo" show={ann} label="Sample calls" />
      </header>
      <SampleNote ws={ws} live={live} onSetup={onSetup} onExamples={onExamples} role={role} />
      {!ws.enquiries.length && <EmptyCalls ws={ws} role={role} onExamples={onExamples} />}
      {ws.enquiries.length > 0 && <div className="a-card a-table-card">
        <div className="a-card-top">
          <div className="a-seg" role="tablist" aria-label="Filter enquiries">
            {tabs.map((f) => <button key={f[0]} role="tab" aria-selected={filter === f[0]} className={filter === f[0] ? 'on' : ''} onClick={() => setFilter(f[0])}>{f[1]}</button>)}
          </div>
          {needle && <span className="a-mute">Matching “{q.trim()}”</span>}
        </div>
        <div className="a-table" role="table" aria-label="Enquiries">
          <div className="a-tr th" role="row"><span role="columnheader">Caller</span><span role="columnheader">Enquiry</span><span role="columnheader">Status</span><span role="columnheader">Owner</span><span role="columnheader">Received</span></div>
          {list.length === 0 && <p className="a-empty">No enquiries match.</p>}
          {list.map((e) => (
            <button key={e.id} className={'a-tr' + (e.delivery === 'failed' || e.booking === 'awaiting' ? ' attn' : '')} role="row" onClick={() => openEnq(e.id)}>
              <span role="cell" className="who"><Ally shape={e.ally.shape} tile={e.ally.tile} size={32} radius={16} /><b>{e.customer}</b></span>
              <span role="cell" className="what">{e.topic}{e.delivery === 'failed' && <em> · email not delivered</em>}</span>
              <span role="cell"><Dot map={STATUS} k={e.status} /></span>
              <span role="cell" className="own">{e.owner ? <><span className="a-av xs">{initials(PEOPLE[e.owner].name)}</span>{PEOPLE[e.owner].name}</> : <span className="a-mute">Unassigned</span>}</span>
              <span role="cell" className="when">{e.day.slice(0, 3)} · {e.received}</span>
            </button>
          ))}
        </div>
      </div>}
      {role === 'member' && <p className="a-fine">You can see every enquiry. Owners and admins assign and close them.</p>}
    </div>
  );
}

function CallerView({ e, biz }) {
  const [pos, setPos] = useState(0.36);
  const bars = 46;
  return (
    <div className="a-call">
      <div className="a-call-top">
        <div><b>{e.customer}</b><span>Called {biz}</span></div>
        <span className="dotnum sm">{e.duration ? e.duration.replace(' min ', ':').replace(' s', '') : '—'}</span>
        <div className="a-wave" aria-hidden="true">{Array.from({ length: 64 }).map((_, i) => <i key={i} style={{ height: (18 + Math.abs(Math.sin(i * 0.55) * 46) + (i % 5) * 4) + '%' }} />)}</div>
      </div>
      <div className="a-call-card">
        <div className="a-call-id">
          <h3>{e.customer.split(' ').map((w, i) => <span key={i}>{w}<br /></span>)}</h3>
          <div><b>{e.received}</b><span>{e.day}</span></div>
        </div>
        <p className="a-call-sub">Answered by Klaro · nothing was booked on the call</p>
      </div>
      <div className="a-call-body">
        {e.transcript ? e.transcript.map((l, i) => (
          <div key={i} className={'a-line' + (i > 3 ? ' fade' : '')}>
            <small>{l[0] === 'Klaro' ? 'Klaro' : first(l[0])} • 0:{two(i * 14)}</small>
            <p>{l[1]}</p>
          </div>
        )) : <p className="a-empty">No transcript was kept for this call.</p>}
        <div className="a-player">
          <span className="a-mute sm">0:{two(Math.round(pos * 72) % 60)}</span>
          <div className="a-scrub" role="slider" tabIndex={0} aria-label="Recording position" aria-valuemin={0} aria-valuemax={72} aria-valuenow={Math.round(pos * 72)}
            onKeyDown={(ev) => { if (ev.key === 'ArrowRight') setPos(Math.min(1, pos + 0.05)); if (ev.key === 'ArrowLeft') setPos(Math.max(0, pos - 0.05)); }}>
            {Array.from({ length: bars }).map((_, i) => <i key={i} className={i / bars < pos ? 'on' : ''} />)}
          </div>
          <button className="a-circle dark" aria-label="Recording playback is simulated" disabled><Icon name="pause" size="sm" /></button>
        </div>
      </div>
    </div>
  );
}

function Drawer({ ws, e, role, setRole, canPreview, meId, apply, saving, save, sim, onClose, go, ann, live }) {
  const ref = useRef(null);
  const [tab, setTab] = useState('team');
  const [mode, setMode] = useState(null);
  const [result, setResult] = useState('reached');
  const [time, setTime] = useState(e.request ? e.request.time : '');
  const [party, setParty] = useState(e.request ? String(e.request.party) : '');
  const [spokeBy, setSpokeBy] = useState(e.owner || meId);
  const [email, setEmail] = useState(first(e.customer).toLowerCase() + '@example.com');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const owner = role === 'owner';
  const need = e.needs ? ws.needs.find((n) => n.id === e.needs) : null;
  const lastAttempt = e.deliveryLog[e.deliveryLog.length - 1];
  const fails = e.deliveryLog.filter((x) => !x.ok).length;
  const fn = first(e.customer);

  useEffect(() => {
    const prev = document.activeElement;
    if (ref.current) ref.current.focus();
    const onKey = (ev) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
  }, []);
  useEffect(() => { setSpokeBy(e.owner || meId); }, [e.owner]);

  const submitOutcome = (ev) => {
    ev.preventDefault();
    if (result === 'reached' && !time.trim()) { setErr('Add the confirmed date and time.'); return; }
    setErr('');
    if (result === 'none') save({ type: 'attempt', id: e.id, spokeBy, mins: 6 }, () => setMode(null));
    else save({ type: 'confirm', id: e.id, spokeBy, time: time.trim(), party: e.request && e.request.party ? (party || String(e.request.party)) : '', email: email.trim(), mins: 8 }, () => setMode(null));
  };
  const send = (channel) => {
    setSending(true);
    const ok = channel === 'text' ? true : sim.email === 'ok' ? true : sim.email === 'fail' ? false : fails >= 1;
    setTimeout(() => save({ type: 'send-result', id: e.id, ok, channel, mins: fails ? 3 : 2 }, null, true).finally(() => setSending(false)), 1100);
  };
  const delivery = sending ? 'sending' : e.delivery;

  return (
    <div className="a-scrim" onClick={onClose}>
      <aside className="a-drawer" role="dialog" aria-modal="true" aria-labelledby="dr-t" tabIndex={-1} ref={ref} onClick={(ev) => ev.stopPropagation()}>
        <div className="a-dr-top">
          <Ally shape={e.ally.shape} tile={e.ally.tile} size={52} radius={26} />
          <div className="a-dr-id"><h2 id="dr-t">{e.customer}</h2><span>{e.phone} · {e.day}, {e.received}</span></div>
          <button className="a-circle" onClick={onClose} aria-label="Close enquiry"><Icon name="close" size="sm" /></button>
        </div>
        <div className="a-dr-status">
          <Dot map={STATUS} k={e.status} />
          {e.booking !== 'n/a' && <Dot map={BOOKING} k={e.booking} pre="Booking" />}
          {(e.booking === 'confirmed' || e.delivery !== 'none') && <Dot map={DELIVERY} k={delivery} pre="Email" />}
          <Tag kind={e.delivery === 'failed' ? 'failure' : e.booking === 'awaiting' ? 'pending' : 'live'} show={ann} label="Booking and delivery are separate statuses" />
        </div>

        <div className="a-dr-bar">
          <div className="a-seg" role="tablist" aria-label="Whose view">
            <button role="tab" aria-selected={tab === 'team'} className={tab === 'team' ? 'on' : ''} onClick={() => setTab('team')}>Team view</button>
            <button role="tab" aria-selected={tab === 'caller'} className={tab === 'caller' ? 'on' : ''} onClick={() => setTab('caller')}>What {fn} heard</button>
          </div>
          {canPreview && (
            <div className="a-seg sm dashed" role="group" aria-label="Preview as">
              <button className={role === 'owner' ? 'on' : ''} aria-pressed={role === 'owner'} onClick={() => setRole('owner')}>Owner</button>
              <button className={role === 'member' ? 'on' : ''} aria-pressed={role === 'member'} onClick={() => setRole('member')}>Member</button>
            </div>
          )}
        </div>

        {tab === 'caller' && (
          <div className="a-dr-body">
            <p className="a-fine">{fn} never sees this workspace. This is the call as {fn} heard it, and what was sent afterwards.</p>
            <CallerView e={e} biz={ws.biz} />
            <div className="a-card flat">
              <div className="a-card-top"><h3>Messages to {fn}</h3></div>
              {e.deliveryLog.length === 0 && e.delivery !== 'told' && <p className="a-empty">Nothing sent yet.{e.booking === 'awaiting' ? ' ' + fn + ' is waiting for the team to confirm availability.' : ''}</p>}
              {e.delivery === 'told' && <p className="a-empty">Told the confirmed time on the call. No written confirmation.</p>}
              <ul className="a-log">{e.deliveryLog.map((x, i) => <li key={i} className={x.ok ? 'ok' : 'bad'}><span>{x.t}</span>{x.ok ? x.text : 'Email not delivered. ' + fn + ' hasn’t received anything.'}</li>)}</ul>
            </div>
            <Tag kind="demo" show={ann} label="Same record, caller’s side · simulated audio" />
          </div>
        )}

        {tab === 'team' && (
          <div className="a-dr-body">
            <div className="a-card flat">
              <div className="a-card-top"><h3>Summary</h3>{e.repeat && <span className="ap t-violet"><i />Repeat caller</span>}</div>
              <p className="a-p">{e.summary}</p>
              {e.request && <div className="a-chips">{e.request.party ? <span>Party of {e.request.party}</span> : null}<span>{e.request.time}</span><span>Callback {e.phone}</span></div>}
              <dl className="a-dl">
                <div><dt>{ws.klaro} did</dt><dd>{e.attempted}</dd></div>
                {e.outcome && <div><dt>Outcome</dt><dd>{e.outcome}</dd></div>}
                {e.repeat && <div><dt>Before</dt><dd>{e.repeat}</dd></div>}
                {need && <div><dt>Needs You</dt><dd><button className="a-link" onClick={() => go('/app/needs-you')}>{need.reason} · {need.state === 'resolved' ? 'Resolved' : need.state === 'reopened' ? 'Reopened' : 'Open'}</button></dd></div>}
              </dl>
              {e.next && <div className="a-next"><span>Next</span><b>{e.next}</b></div>}
            </div>

            <div className="a-card flat">
              <div className="a-card-top"><h3>Owner</h3></div>
              {owner ? (
                <>
                  <label className="sr-only" htmlFor="dr-own">Assign to</label>
                  <div className="a-select"><select id="dr-own" value={e.owner || ''} disabled={saving} onChange={(ev) => save({ type: 'assign', id: e.id, owner: ev.target.value || null, mins: 2 })}>
                    <option value="">Unassigned</option>{peopleList().map((p) => <option key={p.id} value={p.id}>{p.name} · {p.role === 'owner' ? 'Owner' : p.team}</option>)}
                  </select><Icon name="chev" size="sm" /></div>
                  {peopleList().length < 2 && <p className="a-fine">Only you so far. Colleagues appear here after they sign in with a work email from your company.</p>}
                  <p className="a-fine">Assigning puts it in their Needs You. Only owners and admins record the outcome.</p>
                </>
              ) : (
                <>
                  <p className="a-owner">{e.owner && PEOPLE[e.owner] ? <><span className="a-av sm">{initials(PEOPLE[e.owner].name)}</span>{PEOPLE[e.owner].name}{e.owner === meId ? ' (you)' : ''}</> : 'Unassigned'}</p>
                  <p className="a-fine">Only owners and admins can reassign or change this enquiry.</p>
                </>
              )}
            </div>

            {e.booking === 'awaiting' && (
              <div className="a-card flat">
                <div className="a-card-top"><h3>Follow-up</h3>{e.attempts > 0 && <span className="a-mute sm">{e.attempts} attempt{e.attempts > 1 ? 's' : ''}, no answer</span>}</div>
                {!owner && <ReadOnly ann={ann} what="record the outcome" />}
                {owner && !mode && <button className="ab ab-dark" onClick={() => { setResult('reached'); setErr(''); setMode('outcome'); }}><Icon name="phone" size="sm" />Log a call to {fn}</button>}
                {owner && mode === 'outcome' && (
                  <form className="a-form" onSubmit={submitOutcome} noValidate>
                    <fieldset className="a-choice">
                      <legend>What happened?</legend>
                      <label className={result === 'reached' ? 'on' : ''}><input type="radio" name="res" checked={result === 'reached'} onChange={() => setResult('reached')} /><span><b>Confirmed</b>Spoke to {fn} and agreed a time</span></label>
                      <label className={result === 'none' ? 'on' : ''}><input type="radio" name="res" checked={result === 'none'} onChange={() => setResult('none')} /><span><b>No answer</b>Keep it open with a next step</span></label>
                    </fieldset>
                    {result === 'reached' && (
                      <div className={'a-grid' + (e.request && e.request.party ? '' : ' one')}>
                        <div className="a-field"><label htmlFor="dr-time">Confirmed for</label><input id="dr-time" className={err ? 'bad' : ''} value={time} onChange={(ev) => setTime(ev.target.value)} aria-invalid={!!err} /></div>
                        {e.request && e.request.party ? <div className="a-field"><label htmlFor="dr-party">Guests</label><input id="dr-party" inputMode="numeric" value={party} onChange={(ev) => setParty(ev.target.value.replace(/\D/g, ''))} /></div> : null}
                        <div className="a-field full"><label htmlFor="dr-email">{fn}’s email for the confirmation <em>Optional</em></label><input id="dr-email" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} /></div>
                      </div>
                    )}
                    <div className="a-field"><label htmlFor="dr-by">Who {result === 'reached' ? 'spoke to' : 'called'} {fn}?</label>
                      <div className="a-select"><select id="dr-by" value={spokeBy} onChange={(ev) => setSpokeBy(ev.target.value)}>{peopleList().map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><Icon name="chev" size="sm" /></div>
                    </div>
                    {err && <p className="a-err" role="alert"><Icon name="alert" size="sm" />{err}</p>}
                    <div className="a-actions">
                      <button className="ab ab-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : result === 'reached' ? 'Save outcome' : 'Save attempt'}</button>
                      <button className="ab ab-light" type="button" onClick={() => setMode(null)}>Cancel</button>
                    </div>
                    <p className="a-fine">Views update only after the save succeeds. The time is recorded for you.</p>
                  </form>
                )}
              </div>
            )}

            {e.booking === 'confirmed' && (
              <div className="a-pair">
                <div className="a-card flat a-pair-l">
                  <h3>{e.request && e.request.party ? 'Booking' : 'Confirmed time'}</h3>
                  <p className="a-pair-t">{e.request && e.request.party ? 'Table for ' + e.request.party : e.topic}<br />{e.confirmed}</p>
                  <div className="a-chips"><span className="ok">Confirmed</span>{e.owner && <span>{ownerName(e.owner)}</span>}</div>
                  <p className="a-mute sm a-pair-f">Unchanged by email delivery</p>
                </div>
                <div className={'a-card a-pair-r' + (e.delivery === 'failed' ? ' bad' : '')}>
                  <h3>Written confirmation</h3>
                  {delivery === 'none' && <p className="a-pair-p">Nothing sent yet. {e.email ? 'Email it to ' + e.email + ', or send a text.' : 'No email on file.'}</p>}
                  {delivery === 'sending' && <p className="a-pair-p" role="status">Sending…</p>}
                  {e.delivery === 'failed' && <p className="a-pair-p" role="alert">Email not delivered. The provider was unavailable.<br /><span className="a-mute">Last attempt {lastAttempt.t}{fails > 1 ? ' · ' + fails + ' attempts' : ''}</span></p>}
                  {e.delivery === 'delivered' && <p className="a-pair-p">{lastAttempt.text}<br /><span className="a-mute">Delivered {lastAttempt.t}</span></p>}
                  {e.delivery === 'told' && <p className="a-pair-p">{fn} heard the confirmed time on the call. Nothing was sent.</p>}
                  <div className="a-pair-foot">
                    <Dot map={DELIVERY} k={delivery} />
                    {owner && delivery === 'none' && <div className="a-actions"><button className="ab ab-white" onClick={() => send('email')} disabled={!e.email}>Email<Icon name="arrow" size="sm" /></button><button className="ab ab-glass" onClick={() => send('text')}>Text</button></div>}
                    {owner && e.delivery === 'failed' && <div className="a-actions"><button className="ab ab-white" onClick={() => send('email')}>Retry email<Icon name="arrow" size="sm" /></button></div>}
                  </div>
                  {owner && e.delivery === 'failed' && (
                    <div className="a-pair-alt">
                      <button className="ab ab-glass" onClick={() => send('text')}>Send by text</button>
                      <button className="ab ab-glass" onClick={() => save({ type: 'told', id: e.id, mins: 1 })}>{fn} was told on the call</button>
                    </div>
                  )}
                  {!owner && (e.delivery === 'none' || e.delivery === 'failed') && <p className="a-mute sm">An owner or admin can send or retry this.</p>}
                  {live && <p className="a-mute sm">Sample call: no email or text is really sent to this caller.</p>}
                  <Tag kind={e.delivery === 'failed' ? 'failure' : e.delivery === 'delivered' ? 'recovery' : 'pending'} show={ann} label={e.delivery === 'failed' ? 'Retry, text, or record told on call' : null} />
                </div>
              </div>
            )}

            <div className="a-card flat">
              <div className="a-card-top"><h3>Timeline</h3><span className="a-mute sm">{e.timeline.length} entries</span></div>
              <ol className="a-tl">{e.timeline.map((t, i) => <li key={i}><span className="tm">{t.t}</span><div><b>{t.by}</b><p>{t.text}</p></div></li>)}</ol>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ---------- 08 Needs You ---------- */
function NeedsYou({ ws, role, save, saving, openEnq, ann }) {
  const lead = ws.enquiries.find((x) => x.id === 'e1');
  const [tab, setTab] = useState('open');
  const [resolving, setResolving] = useState(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const owner = role === 'owner';
  const list = ws.needs.filter((n) => (tab === 'open' ? n.state !== 'resolved' : n.state === 'resolved'));
  const doResolve = (ev, n) => {
    ev.preventDefault();
    if (!reason.trim()) { setErr('Add a reason so the team knows why this was closed.'); return; }
    setErr('');
    save({ type: 'resolve', id: n.id, reason: reason.trim(), mins: 2 }, () => { setResolving(null); setReason(''); });
  };
  return (
    <div className="a-page">
      <header className="a-head">
        <div><p className="a-eyebrow">Needs You</p><h1>Things {ws.klaro} couldn’t finish alone</h1></div>
        <Tag kind="demo" show={ann} label="Sample items" />
      </header>
      <div className="a-toolbar">
        <div className="a-seg" role="tablist" aria-label="Needs You items">
          <button role="tab" aria-selected={tab === 'open'} className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>Open <em>{ws.needs.filter((n) => n.state !== 'resolved').length}</em></button>
          <button role="tab" aria-selected={tab === 'resolved'} className={tab === 'resolved' ? 'on' : ''} onClick={() => setTab('resolved')}>Resolved <em>{ws.needs.filter((n) => n.state === 'resolved').length}</em></button>
        </div>
      </div>
      {!owner && <ReadOnly ann={ann} what="assign, resolve or reopen these items" />}
      {list.length === 0 && <div className="a-card a-empty-card"><Klaro mood="success" size={84} decorative /><p>{tab === 'open' ? 'Nothing needs a person right now.' : 'Nothing resolved yet.'}</p></div>}
      <div className="a-needs">
        {list.map((n) => {
          const e = ws.enquiries.find((x) => x.id === n.enquiry);
          return (
            <article key={n.id} className={'a-card a-need s-' + n.state}>
              <div className="a-need-top">
                <Ally shape={e.ally.shape} tile={e.ally.tile} size={40} radius={20} />
                <span className={'ap t-' + PRIO[n.priority]}><i />{n.priority}</span>
                {n.state === 'reopened' && <span className="ap t-amber"><i />Reopened</span>}
              </div>
              <h2>{n.reason}</h2>
              <p className="a-p">{e.customer} · {e.topic}</p>
              <div className="a-chips"><span>Since {n.opened}</span><span>{ownerName(n.owner)}</span>{e.attempts > 0 && <span>{e.attempts} failed attempt{e.attempts > 1 ? 's' : ''}</span>}</div>
              {n.next && <div className="a-next"><span>Next</span><b>{n.next}</b></div>}
              {n.resolution && n.state !== 'open' && <p className="a-res"><Icon name="check" size="sm" />{n.resolution}</p>}
              <div className="a-need-foot">
                <button className="a-link" onClick={() => openEnq(e.id)}>Open enquiry</button>
                <div className="a-actions">
                  {owner && n.state !== 'resolved' && (
                    <>
                      <label className="sr-only" htmlFor={'own-' + n.id}>Assign {n.reason}</label>
                      <div className="a-select pill"><select id={'own-' + n.id} value={n.owner || ''} disabled={saving} onChange={(ev) => save({ type: 'assign', id: e.id, owner: ev.target.value || null, mins: 2 })}>
                        <option value="">Unassigned</option>{peopleList().map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select><Icon name="chev" size="sm" /></div>
                      {resolving !== n.id && <button className="ab ab-dark" onClick={() => { setResolving(n.id); setReason(''); setErr(''); }}>Resolve</button>}
                    </>
                  )}
                  {owner && n.state === 'resolved' && <button className="ab ab-light" disabled={saving} onClick={() => save({ type: 'reopen', id: n.id, mins: 1 })}>Reopen</button>}
                </div>
              </div>
              {resolving === n.id && (
                <form className="a-form a-resolve" onSubmit={(ev) => doResolve(ev, n)} noValidate>
                  <div className="a-field"><label htmlFor={'rs-' + n.id}>Why is this resolved?</label>
                    <input id={'rs-' + n.id} className={err ? 'bad' : ''} value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="e.g. Sent the deposit terms by email" aria-invalid={!!err} autoFocus /></div>
                  {err && <p className="a-err" role="alert"><Icon name="alert" size="sm" />{err}</p>}
                  <div className="a-actions"><button className="ab ab-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Resolve item'}</button><button className="ab ab-light" type="button" onClick={() => setResolving(null)}>Cancel</button></div>
                  {n.enquiry === 'e1' && lead && <p className="a-fine">For {first(lead.customer)}’s request, record the outcome on the enquiry instead. It resolves this item for you.</p>}
                </form>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function NextReview({ which, go, role }) {
  const info = which === 'number'
    ? ['06 · Number & Go Live', 'Choose a new number or forward your own', 'The next review covers choosing or forwarding a number, payment and verification, and the requested, configuring, failed and live states. Paying alone won’t mark Klaro as live.']
    : ['09 · Klaro Studio', 'Change what Klaro knows and says', 'The next review covers business knowledge, greeting, voice, call handling and supported actions, with draft, saved and test states.'];
  return (
    <div className="a-page">
      <div className="a-pair a-next-pair">
        <div className="a-card a-pair-l">
          <p className="a-eyebrow">{info[0]}</p>
          <h1 className="a-next-h">{info[1]}</h1>
          <p className="a-p">{info[2]}</p>
          {which === 'number' && role === 'member' && <p className="a-fine">Only an authorised owner or admin can set up a number.</p>}
        </div>
        <div className="a-card a-dark">
          <div className="a-next-k"><Klaro mood="thinking" size={110} decorative /></div>
          <p className="a-dark-p">This screen is planned for the next review. Nothing here is broken; it just isn’t designed yet.</p>
          <div className="a-actions"><button className="ab ab-white" onClick={() => go('/app')}>Command Centre<Icon name="arrow" size="sm" /></button><button className="ab ab-glass" onClick={() => go('/app/enquiries')}>Calls</button></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- shell ---------- */
export default function Workspace({ ws, apply, live, review, onExamples, me, realRole, domain, personal, role, setRole, view, enquiryId, filter, go, sim, onHome, onSetup, onSignOut, theme, onToggleTheme, motion, ann }) {
  PEOPLE = ws.people || {};
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [q, setQ] = useState('');
  const searchRef = useRef(null);
  const c = counts(ws);
  const meP = PEOPLE[me] || { id: me, name: 'You', role: realRole, team: '' };
  const canPreview = !!review && (!live || realRole === 'owner');
  const e = enquiryId ? ws.enquiries.find((x) => x.id === enquiryId) : null;
  const base = view === 'needs' ? '/app/needs-you' : view === 'home' ? '/app' : '/app/enquiries';
  const openEnq = (id) => go(base + '?e=' + id);
  const closeEnq = () => go(base + (view === 'enquiries' && filter !== 'all' ? '?f=' + filter : ''));
  const team = Object.values(PEOPLE);

  useEffect(() => {
    const onKey = (ev) => { if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); if (searchRef.current) searchRef.current.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const flash = (t, kind) => { setToast({ t, kind }); clearTimeout(flash.t); flash.t = setTimeout(() => setToast(null), 4200); };
  const save = (action, after, quiet) => {
    if (role !== 'owner') { flash('Only owners and admins can change this. Nothing was changed.', 'bad'); return Promise.resolve(); }
    setSaving(true);
    return Promise.resolve(apply({ ...action, actor: me }))
      .then(() => {
        if (after) after();
        if (!quiet) flash(action.type === 'assign' ? 'Assigned. Shown in Needs You and on the enquiry.' : action.type === 'confirm' ? 'Outcome saved. Needs You and the Command Centre are updated.' : action.type === 'attempt' ? 'Attempt saved. The item stays open.' : action.type === 'resolve' ? 'Resolved. The enquiry timeline has a new entry.' : action.type === 'reopen' ? 'Reopened. It’s back in Needs You.' : 'Saved.', 'ok');
      })
      .catch((err) => flash((err && err.message) || 'Couldn’t save. Nothing changed. Try again.', 'bad'))
      .finally(() => setSaving(false));
  };

  const examples = onExamples && role === 'owner' ? (on) => onExamples(on).then(() => flash(on ? 'Example calls added. Remove them any time.' : 'Example calls removed.', 'ok')).catch((err) => flash((err && err.message) || 'Couldn’t change the examples. Try again.', 'bad')) : null;

  const nav = [
    ['home', '/app', 'Command Centre', 'grid'],
    ['enquiries', '/app/enquiries', 'Calls & Enquiries', 'phone', c.openEnq],
    ['needs', '/app/needs-you', 'Needs You', 'bell', c.needsOpen],
    ['number', '/app/number', 'Number & Go Live', 'sim', null, true],
    ['studio', '/app/studio', 'Klaro Studio', 'sparkle', null, true]
  ];
  const title = { home: 'Overview', enquiries: 'Calls & Enquiries', needs: 'Needs You', number: 'Number & Go Live', studio: 'Klaro Studio' }[view];
  const words = String(ws.biz || '').split(' ');
  const half = Math.ceil(words.length / 2);

  return (
    <div className={'kc adm' + (motion === 'reduce' ? ' rm' : '')}>
      <div className="adm-glow" aria-hidden="true" />
      <div className="adm-shell">
        <aside className="adm-side" aria-label="Workspace">
          <div className="adm-side-top">
            <a className="adm-brand" href="/" onClick={(ev) => { ev.preventDefault(); onHome(); }} aria-label="Klaro Call home"><BrandMark /><span>klaro<em>call</em></span></a>
            {live
              ? <button className="a-circle sm" onClick={onSignOut} aria-label="Sign out" title="Sign out"><Icon name="out" size="sm" /></button>
              : <button className="a-circle sm" onClick={onHome} aria-label="Leave the sample workspace" title="Leave"><Icon name="out" size="sm" /></button>}
          </div>
          <div className="adm-title">
            <span className="a-eyebrow">{live ? 'Workspace' : 'Sample workspace'}</span>
            <h2>{words.slice(0, half).join(' ')}{words.length > 1 && <br />}{words.slice(half).join(' ')}</h2>
          </div>
          <label className="adm-search">
            <Icon name="search" size="sm" />
            <span className="sr-only">Search calls and people</span>
            <input ref={searchRef} value={q} placeholder="Search calls and people" onChange={(ev) => { setQ(ev.target.value); if (view !== 'enquiries' && ev.target.value) go('/app/enquiries'); }} />
            <kbd>⌘K</kbd>
          </label>
          <nav className="adm-nav">
            {nav.map((n) => (
              <button key={n[0]} className={'adm-nav-i' + (view === n[0] ? ' on' : '') + (n[5] ? ' later' : '')} aria-current={view === n[0] ? 'page' : undefined} onClick={() => go(n[1])}>
                <Icon name={n[3]} size="sm" /><span>{n[2]}</span>
                {n[4] ? <em>{n[4]}</em> : null}
                {n[5] && <i>Next review</i>}
              </button>
            ))}
          </nav>
          <div className="adm-side-foot">
            <div className="adm-team">
              <div className="adm-team-top"><b>Team</b><span>{team.length} {team.length === 1 ? 'person' : 'people'}</span></div>
              <div className="adm-team-avs">{team.slice(0, 6).map((p) => <span key={p.id} className="a-av sm" title={p.name + ' · ' + (p.role === 'owner' ? 'Owner/admin' : 'Member')}>{initials(p.name).slice(0, 2)}</span>)}</div>
              {live && !personal && <p className="a-fine">Colleagues join by signing in with an @{domain} email.</p>}
              {live && personal && <p className="a-fine">Personal workspace. Sign in with a company email to share it with a team.</p>}
            </div>
            <div className="adm-me">
              <span className="a-av">{initials(meP.name).slice(0, 2)}</span>
              <div><b>{meP.name}</b><span>{realRole === 'owner' ? 'Owner/admin' : 'Member · ' + (meP.team || 'Team')}</span></div>
            </div>
            {live
              ? <button className="a-link" onClick={onSignOut}>Sign out</button>
              : <span className="ap t-violet"><i />Sample data</span>}
          </div>
        </aside>

        <div className="adm-main">
          <div className="adm-bar">
            <div className="adm-bar-l">
              <span className="adm-crumb">{title}</span>
              <span className="adm-time"><Icon name="clock" size="sm" />{ws.today} · {String(Math.floor(ws.clock / 60) % 24).padStart(2, '0')}:{two(ws.clock % 60)}</span>
            </div>
            <div className="adm-bar-r">
              {canPreview ? (
                <div className="a-seg dashed" role="group" aria-label={live ? 'Preview as' : 'View as (review control)'}>
                  <button className={role === 'owner' ? 'on' : ''} aria-pressed={role === 'owner'} onClick={() => setRole('owner')}>Owner/admin</button>
                  <button className={role === 'member' ? 'on' : ''} aria-pressed={role === 'member'} onClick={() => setRole('member')}>{live ? 'Preview as member' : 'Member'}</button>
                </div>
              ) : <span className={'ap ' + (realRole === 'owner' ? 't-violet' : 't-grey')}><i />{realRole === 'owner' ? 'Owner/admin' : 'Member · view only'}</span>}
              <button className="a-circle" onClick={() => go('/app/needs-you')} aria-label={'Needs You, ' + c.needsOpen + ' open'}><Icon name="bell" size="sm" />{c.needsOpen > 0 && <b className="badge">{c.needsOpen}</b>}</button>
              {onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} className="a-theme" />}
            </div>
          </div>

          <main className="adm-content" id="main-content">
            {view === 'home' && <CommandCentre ws={ws} role={role} me={meP} go={go} openEnq={openEnq} ann={ann} live={live} onSetup={onSetup} onExamples={examples} domain={domain} personal={personal} />}
            {view === 'enquiries' && <Enquiries ws={ws} role={role} filter={filter} q={q} setFilter={(f) => go('/app/enquiries' + (f === 'all' ? '' : '?f=' + f))} openEnq={openEnq} ann={ann} live={live} onSetup={onSetup} onExamples={examples} />}
            {view === 'needs' && <NeedsYou ws={ws} role={role} save={save} saving={saving} openEnq={openEnq} ann={ann} />}
            {(view === 'number' || view === 'studio') && <NextReview which={view} go={go} role={role} />}
          </main>
        </div>
      </div>

      {e && <Drawer key={e.id} ws={ws} e={e} role={role} setRole={setRole} canPreview={canPreview} meId={me} apply={apply} saving={saving} save={save} sim={sim} onClose={closeEnq} go={go} ann={ann} live={live} />}
      {toast && <div className={'a-toast' + (toast.kind === 'bad' ? ' bad' : '')} role={toast.kind === 'bad' ? 'alert' : 'status'}><Icon name={toast.kind === 'bad' ? 'alert' : 'check'} size="sm" />{toast.t}</div>}
    </div>
  );
}
