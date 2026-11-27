import { useEffect, useRef, useState } from 'react';
import Icon from './components/Icons.jsx';
import Ally from './components/Ally.jsx';
import Klaro from './components/Klaro.jsx';
import { Brand, ThemeToggle } from './components/Brand.jsx';
import { Tag } from './components/Review.jsx';
import { PEOPLE, counts } from './workspace/model.js';

const STATUS = {
  awaiting: ['Awaiting confirmation', 'pill-warn'],
  open: ['Open', 'pill-warn'],
  confirmed: ['Confirmed · follow-up open', 'pill-demo'],
  closed: ['Closed', 'pill-neutral']
};
const BOOKING = {
  awaiting: ['Not confirmed yet', 'pill-warn'],
  confirmed: ['Confirmed', 'pill-live'],
  'n/a': ['No booking', 'pill-neutral']
};
const DELIVERY = {
  none: ['Not sent', 'pill-neutral'],
  sending: ['Sending…', 'pill-demo'],
  failed: ['Not delivered', 'pill-err'],
  delivered: ['Delivered', 'pill-live'],
  told: ['Told on the call · nothing sent', 'pill-neutral']
};

const Pill = ({ map, k, prefix }) => {
  const v = map[k] || [k, 'pill-neutral'];
  return <span className={'kc-pill ' + v[1]}><span className="dot" />{prefix ? prefix + ': ' : ''}{v[0]}</span>;
};
const initials = (n) => n.split(' ').map((w) => w[0]).join('');
const ownerName = (id) => (id ? PEOPLE[id].name : 'Unassigned');

function ReadOnly({ ann, what = 'change this enquiry' }) {
  return (
    <div className="ws-ro" role="note">
      <Icon name="eye" size="sm" />
      <div><b>View only.</b> Only owners and admins can {what}. Being assigned lets you see it and follow up, but the outcome is recorded by an owner or admin.</div>
      <Tag kind="flag" show={ann} label="Should assigned members record outcomes?" />
    </div>
  );
}

/* ---------- 05 Command Centre ---------- */
function CommandCentre({ ws, role, go, openEnq, ann }) {
  const c = counts(ws);
  const me = role === 'owner' ? PEOPLE.dami : PEOPLE.tolu;
  const openNeeds = ws.needs.filter((n) => n.state !== 'resolved');
  const recent = ws.enquiries.slice(0, 4);
  return (
    <div className="ws-page">
      <div className="ws-head">
        <div>
          <span className="kc-kicker">Command Centre · Wed 26 Nov</span>
          <h1>Good evening, {me.name.split(' ')[0]}</h1>
          <p className="ws-sub">{c.needsOpen ? c.needsOpen + ' thing' + (c.needsOpen > 1 ? 's need' : ' needs') + ' a person tonight.' : 'Nothing needs you right now.'} {ws.klaro} has handled {c.callsToday} calls today.</p>
        </div>
        <Tag kind="demo" show={ann} label="Sample workspace data" />
      </div>

      <div className="ws-number" role="status">
        <span className="ico"><Icon name="sim" /></span>
        <div>
          <b>No phone number yet</b>
          <span>Calls can’t reach {ws.klaro} until a number is active. The calls below are sample data for this review.</span>
        </div>
        {role === 'owner'
          ? <button className="btn btn-sm btn-dark" onClick={() => go('/app/number')}>Set up a number</button>
          : <span className="kc-pill pill-neutral"><span className="dot" />Owner sets this up</span>}
        <Tag kind="pending" show={ann} label="Number not active" />
      </div>

      <div className="ws-stats">
        <button className="ws-stat" onClick={() => go('/app/enquiries')}><span className="n">{c.callsToday}</span><span className="l">Calls today</span><span className="s">Opens Calls & Enquiries</span></button>
        <button className="ws-stat" onClick={() => go('/app/enquiries?f=open')}><span className="n">{c.openEnq}</span><span className="l">Open enquiries</span><span className="s">Waiting on a person</span></button>
        <button className={'ws-stat' + (c.needsOpen ? ' hot' : '')} onClick={() => go('/app/needs-you')}><span className="n">{c.needsOpen}</span><span className="l">Needs You</span><span className="s">{c.needsOpen ? 'Open items' : 'All clear'}</span></button>
        <button className="ws-stat" onClick={() => go('/app/enquiries?f=action')}><span className="n">{c.actions}</span><span className="l">Follow-ups due</span><span className="s">Confirmations to make or send</span></button>
      </div>

      <div className="ws-cols">
        <section className="ws-card">
          <div className="ws-card-head"><h2>Needs You</h2><button className="ws-link" onClick={() => go('/app/needs-you')}>See all</button></div>
          {openNeeds.length === 0 && <p className="ws-empty">Nothing needs a person right now.</p>}
          {openNeeds.map((n) => {
            const e = ws.enquiries.find((x) => x.id === n.enquiry);
            return (
              <button key={n.id} className="ws-row" onClick={() => openEnq(e.id)}>
                <Ally shape={e.ally.shape} tile={e.ally.tile} size={38} radius={11} />
                <span className="m"><b>{n.reason}</b><span>{e.customer} · {e.topic}</span></span>
                <span className="r"><span className={'prio p-' + n.priority.toLowerCase()}>{n.priority}</span><span className="o">{ownerName(n.owner)}</span></span>
              </button>
            );
          })}
        </section>
        <section className="ws-card">
          <div className="ws-card-head"><h2>Latest calls</h2><button className="ws-link" onClick={() => go('/app/enquiries')}>See all</button></div>
          {recent.map((e) => (
            <button key={e.id} className="ws-row" onClick={() => openEnq(e.id)}>
              <Ally shape={e.ally.shape} tile={e.ally.tile} size={38} radius={11} />
              <span className="m"><b>{e.customer}</b><span>{e.topic}</span></span>
              <span className="r"><Pill map={STATUS} k={e.status} /><span className="o mono">{e.day === 'Wed 26 Nov' ? e.received : 'Tue ' + e.received}</span></span>
            </button>
          ))}
        </section>
      </div>

      <section className="ws-card ws-demo">
        <div className="ws-card-head"><h2>Your test call</h2><span className="kc-pill pill-demo"><span className="dot" />Demo · not counted</span></div>
        <p>{ws.demoCall === 'completed' ? 'The demo call from setup is kept here for reference. It isn’t a real enquiry and isn’t counted above.' : ws.demoCall === 'preview' ? 'You heard a browser preview during setup. No call was made.' : 'You haven’t tried a test call yet.'}</p>
      </section>
    </div>
  );
}

/* ---------- 07 Calls & Enquiries ---------- */
function Enquiries({ ws, role, filter, setFilter, openEnq, ann }) {
  const list = ws.enquiries.filter((e) => {
    if (filter === 'open') return e.status !== 'closed';
    if (filter === 'action') return e.booking === 'awaiting' || e.delivery === 'failed' || (e.status === 'confirmed' && e.delivery === 'none');
    if (filter === 'closed') return e.status === 'closed';
    return true;
  });
  return (
    <div className="ws-page">
      <div className="ws-head">
        <div><span className="kc-kicker">Calls & Enquiries</span><h1>Every call, and what happens next</h1><p className="ws-sub">Open an enquiry to see the summary, who owns it and the full timeline.</p></div>
        <Tag kind="demo" show={ann} label="Sample calls" />
      </div>
      <div className="ws-filters" role="tablist" aria-label="Filter enquiries">
        {[['all', 'All'], ['open', 'Open'], ['action', 'Needs action'], ['closed', 'Closed']].map((f) => (
          <button key={f[0]} role="tab" aria-selected={filter === f[0]} className={filter === f[0] ? 'on' : ''} onClick={() => setFilter(f[0])}>{f[1]}</button>
        ))}
      </div>
      <div className="ws-table" role="table" aria-label="Enquiries">
        <div className="ws-tr th" role="row"><span role="columnheader">Caller</span><span role="columnheader">Enquiry</span><span role="columnheader">Received</span><span role="columnheader">Status</span><span role="columnheader">Owner</span></div>
        {list.length === 0 && <p className="ws-empty">No enquiries here.</p>}
        {list.map((e) => (
          <button key={e.id} className="ws-tr" role="row" onClick={() => openEnq(e.id)}>
            <span role="cell" className="who"><Ally shape={e.ally.shape} tile={e.ally.tile} size={34} radius={10} /><b>{e.customer}</b></span>
            <span role="cell" className="what">{e.topic}{e.delivery === 'failed' && <em className="bad"> · confirmation not delivered</em>}</span>
            <span role="cell" className="mono when">{e.day.slice(0, 3)} {e.received}</span>
            <span role="cell"><Pill map={STATUS} k={e.status} /></span>
            <span role="cell" className="own">{ownerName(e.owner)}</span>
          </button>
        ))}
      </div>
      {role === 'member' && <p className="ws-fine">You can see every enquiry. Owners and admins assign and close them.</p>}
    </div>
  );
}

function Drawer({ ws, e, role, setRole, dispatch, saving, save, sim, onClose, go, ann }) {
  const ref = useRef(null);
  const [tab, setTab] = useState('team');
  const [mode, setMode] = useState(null); // null | outcome
  const [result, setResult] = useState('reached');
  const [time, setTime] = useState(e.request ? e.request.time : '');
  const [party, setParty] = useState(e.request ? String(e.request.party) : '');
  const [spokeBy, setSpokeBy] = useState(e.owner || 'dami');
  const [email, setEmail] = useState('alex.morgan@example.com');
  const [err, setErr] = useState('');
  const owner = role === 'owner';
  const need = e.needs ? ws.needs.find((n) => n.id === e.needs) : null;
  const lastAttempt = e.deliveryLog[e.deliveryLog.length - 1];
  const fails = e.deliveryLog.filter((x) => !x.ok).length;

  useEffect(() => {
    const prev = document.activeElement;
    if (ref.current) ref.current.focus();
    const onKey = (ev) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
  }, []);
  useEffect(() => { setSpokeBy(e.owner || 'dami'); }, [e.owner]);

  const submitOutcome = (ev) => {
    ev.preventDefault();
    if (result === 'reached' && !time.trim()) { setErr('Add the confirmed date and time.'); return; }
    setErr('');
    if (result === 'none') save({ type: 'attempt', id: e.id, spokeBy, mins: 6 }, () => setMode(null));
    else save({ type: 'confirm', id: e.id, spokeBy, time: time.trim(), party: party || '8', email: email.trim(), mins: 8 }, () => setMode(null));
  };
  const send = (channel) => {
    dispatch({ type: 'send-start', id: e.id });
    const ok = channel === 'text' ? true : sim.email === 'ok' ? true : sim.email === 'fail' ? false : fails >= 1;
    setTimeout(() => dispatch({ type: 'send-result', id: e.id, ok, channel, mins: fails ? 3 : 2 }), 1100);
  };

  return (
    <div className="ws-scrim" onClick={onClose}>
      <aside className="ws-drawer" role="dialog" aria-modal="true" aria-labelledby="dr-t" tabIndex={-1} ref={ref} onClick={(ev) => ev.stopPropagation()}>
        <div className="dr-top">
          <Ally shape={e.ally.shape} tile={e.ally.tile} size={52} radius={14} />
          <div className="dr-id">
            <h2 id="dr-t">{e.customer}</h2>
            <span>{e.phone} · called {e.day} at {e.received}</span>
          </div>
          <button className="dr-x" onClick={onClose} aria-label="Close enquiry"><Icon name="close" size="sm" /></button>
        </div>
        <div className="dr-status">
          <Pill map={STATUS} k={e.status} />
          {e.booking !== 'n/a' && <Pill map={BOOKING} k={e.booking} prefix="Booking" />}
          {(e.booking === 'confirmed' || e.delivery !== 'none') && <Pill map={DELIVERY} k={e.delivery} prefix="Confirmation" />}
          <Tag kind={e.delivery === 'failed' ? 'failure' : e.booking === 'awaiting' ? 'pending' : 'live'} show={ann} label="Booking and delivery are separate statuses" />
        </div>

        <div className="dr-viewas" role="group" aria-label="View this enquiry as (review control)">
          <span>Same enquiry, viewed as</span>
          <button className={role === 'owner' ? 'on' : ''} aria-pressed={role === 'owner'} onClick={() => setRole('owner')}>Dami · Owner/admin</button>
          <button className={role === 'member' ? 'on' : ''} aria-pressed={role === 'member'} onClick={() => setRole('member')}>Tolu · Member</button>
        </div>
        <div className="dr-tabs" role="tablist" aria-label="Who is looking">
          <button role="tab" aria-selected={tab === 'team'} className={tab === 'team' ? 'on' : ''} onClick={() => setTab('team')}>Team view</button>
          <button role="tab" aria-selected={tab === 'caller'} className={tab === 'caller' ? 'on' : ''} onClick={() => setTab('caller')}>What {e.customer.split(' ')[0]} heard</button>
        </div>

        {tab === 'caller' && (
          <div className="dr-body">
            <p className="dr-note">The caller never sees this workspace. This is what they were told and sent.</p>
            {e.transcript ? <ol className="dr-transcript">{e.transcript.map((l, i) => <li key={i} className={l[0] === 'Klaro' ? 'k' : 'c'}><b>{l[0]}</b>{l[1]}</li>)}</ol> : <p className="ws-empty">No transcript kept for this call.</p>}
            <div className="dr-sec">
              <h3>Messages to {e.customer.split(' ')[0]}</h3>
              {e.deliveryLog.length === 0 && e.delivery !== 'told' && <p className="ws-empty">Nothing sent yet. {e.booking === 'awaiting' ? 'They’re waiting for the team to confirm availability.' : ''}</p>}
              {e.delivery === 'told' && <p className="ws-empty">Told the confirmed time on the call. No written confirmation.</p>}
              <ul className="dr-log">{e.deliveryLog.map((x, i) => <li key={i} className={x.ok ? 'ok' : 'bad'}><span className="mono">{x.t}</span>{x.ok ? x.text : 'Email not delivered. They haven’t received anything.'}</li>)}</ul>
            </div>
            <Tag kind="demo" show={ann} label="Same record, caller’s side" />
          </div>
        )}

        {tab === 'team' && (
          <div className="dr-body">
            <div className="dr-sec">
              <h3>Summary</h3>
              <p>{e.summary}</p>
              {e.request && <div className="kc-kv"><span className="kv">Party of {e.request.party}</span><span className="kv">{e.request.time}</span><span className="kv">Callback {e.phone}</span></div>}
              <dl className="dr-dl">
                <div><dt>{ws.klaro} did</dt><dd>{e.attempted}</dd></div>
                {e.confirmed && <div><dt>Confirmed</dt><dd>{e.confirmed}</dd></div>}
                {e.outcome && <div><dt>Outcome</dt><dd>{e.outcome}</dd></div>}
                {e.next && <div><dt>Next action</dt><dd className="next">{e.next}</dd></div>}
                {e.repeat && <div><dt>Repeat caller</dt><dd>{e.repeat}</dd></div>}
                {need && <div><dt>Needs You</dt><dd><button className="ws-link" onClick={() => go('/app/needs-you')}>{need.reason} · {need.state === 'resolved' ? 'Resolved' : need.state === 'reopened' ? 'Reopened' : 'Open'}</button></dd></div>}
              </dl>
            </div>

            <div className="dr-sec">
              <h3>Owner</h3>
              {owner ? (
                <div className="dr-assign">
                  <label className="sr-only" htmlFor="dr-own">Assign to</label>
                  <select id="dr-own" className="kc-select" value={e.owner || ''} disabled={saving} onChange={(ev) => save({ type: 'assign', id: e.id, owner: ev.target.value || null, actor: 'dami', mins: 2 })}>
                    <option value="">Unassigned</option>
                    <option value="dami">Dami Ade · Owner</option>
                    <option value="tolu">Tolu Bello · Reservations</option>
                  </select>
                  <span className="dr-hint">Assigning lets them see it in Needs You. Only owners and admins record the outcome.</span>
                </div>
              ) : (
                <>
                  <p className="dr-owner">{e.owner ? <><span className="ws-av">{initials(PEOPLE[e.owner].name)}</span>{PEOPLE[e.owner].name}{e.owner === 'tolu' ? ' (you)' : ''}</> : 'Unassigned'}</p>
                  <p className="dr-hint">Only owners and admins can reassign or change this enquiry.</p>
                </>
              )}
            </div>

            {e.booking === 'awaiting' && (
              <div className="dr-sec">
                <h3>Record follow-up</h3>
                {!owner && <ReadOnly ann={ann} what="record the outcome" />}
                {owner && !mode && (
                  <div className="dr-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => { setResult('reached'); setErr(''); setMode('outcome'); }}>Log a call to {e.customer.split(' ')[0]}</button>
                    {e.attempts > 0 && <span className="dr-hint">{e.attempts} earlier attempt{e.attempts > 1 ? 's' : ''} with no answer.</span>}
                  </div>
                )}
                {owner && mode === 'outcome' && (
                  <form className="dr-form" onSubmit={submitOutcome} noValidate>
                    <fieldset>
                      <legend>What happened?</legend>
                      <label className="dr-radio"><input type="radio" name="res" checked={result === 'reached'} onChange={() => setResult('reached')} />Spoke to {e.customer.split(' ')[0]} and confirmed the booking</label>
                      <label className="dr-radio"><input type="radio" name="res" checked={result === 'none'} onChange={() => setResult('none')} />No answer · keep it open</label>
                    </fieldset>
                    {result === 'reached' && (
                      <div className="dr-grid">
                        <div className="kc-field"><label className="kc-label" htmlFor="dr-time">Confirmed for</label><input id="dr-time" className={'kc-input' + (err ? ' bad' : '')} value={time} onChange={(ev) => setTime(ev.target.value)} aria-invalid={!!err} /></div>
                        <div className="kc-field"><label className="kc-label" htmlFor="dr-party">Guests</label><input id="dr-party" className="kc-input" inputMode="numeric" value={party} onChange={(ev) => setParty(ev.target.value.replace(/\D/g, ''))} /></div>
                        <div className="kc-field full"><label className="kc-label" htmlFor="dr-email">{e.customer.split(' ')[0]}’s email for the confirmation <span className="opt">Optional</span></label><input id="dr-email" className="kc-input" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} /></div>
                      </div>
                    )}
                    <div className="kc-field"><label className="kc-label" htmlFor="dr-by">Who {result === 'reached' ? 'spoke to' : 'called'} {e.customer.split(' ')[0]}?</label>
                      <select id="dr-by" className="kc-select" value={spokeBy} onChange={(ev) => setSpokeBy(ev.target.value)}><option value="dami">Dami Ade</option><option value="tolu">Tolu Bello</option></select>
                    </div>
                    {err && <div className="kc-field-err vf-err" role="alert"><Icon name="alert" size="sm" />{err}</div>}
                    <div className="dr-actions">
                      <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Saving…' : result === 'reached' ? 'Save outcome' : 'Save attempt'}</button>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setMode(null)}><span>Cancel</span></button>
                    </div>
                    <p className="dr-hint">Views update only after the save succeeds. The time is recorded automatically.</p>
                  </form>
                )}
              </div>
            )}

            {e.booking === 'confirmed' && e.id === 'e1' && (
              <div className="dr-sec">
                <h3>Written confirmation</h3>
                {e.delivery === 'none' && (owner
                  ? <div className="dr-actions"><button className="btn btn-primary btn-sm" onClick={() => send('email')} disabled={!e.email}>Email confirmation</button><button className="btn btn-ghost btn-sm" onClick={() => send('text')}><span>Send by text</span></button>{!e.email && <span className="dr-hint">No email on file. Send by text instead.</span>}</div>
                  : <ReadOnly ann={ann} what="send confirmations" />)}
                {e.delivery === 'sending' && <p className="dr-hint" role="status">Sending…</p>}
                {e.delivery === 'failed' && (
                  <div className="kc-banner banner-err" role="alert">
                    <span className="ico"><Icon name="alert" size="sm" /></span>
                    <div>
                      <b>Confirmation email not delivered.</b> The booking is still confirmed. Only the email failed. Last attempt {lastAttempt.t}: email provider unavailable.{fails > 1 ? ' ' + fails + ' attempts so far.' : ''}
                      <Tag kind="failure" show={ann} label="Delivery failed, booking unchanged" />
                      {owner ? (
                        <div className="dr-actions">
                          <button className="btn btn-dark btn-sm" onClick={() => send('email')}>Retry email</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => send('text')}><span>Send by text</span></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => save({ type: 'told', id: e.id, actor: 'dami', mins: 1 })}><span>Alex was told on the call</span></button>
                          <Tag kind="recovery" show={ann} />
                        </div>
                      ) : <p className="dr-hint">An owner or admin can retry or send it another way.</p>}
                    </div>
                  </div>
                )}
                {e.delivery === 'delivered' && <div className="kc-banner banner-ok" role="status"><span className="ico"><Icon name="check" size="sm" /></span><div><b>Delivered at {lastAttempt.t}.</b> {lastAttempt.text}</div></div>}
                {e.delivery === 'told' && <p className="dr-hint">Recorded that Alex heard the confirmed time on the call. Nothing was sent.</p>}
              </div>
            )}

            <div className="dr-sec">
              <h3>Timeline</h3>
              <ol className="dr-tl">{e.timeline.map((t, i) => <li key={i}><span className="mono">{t.t}</span><b>{t.by}</b><span>{t.text}</span></li>)}</ol>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ---------- 08 Needs You ---------- */
function NeedsYou({ ws, role, save, saving, openEnq, ann }) {
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
    save({ type: 'resolve', id: n.id, reason: reason.trim(), actor: 'dami', mins: 2 }, () => { setResolving(null); setReason(''); });
  };
  return (
    <div className="ws-page">
      <div className="ws-head">
        <div><span className="kc-kicker">Needs You</span><h1>Things {ws.klaro} couldn’t finish alone</h1><p className="ws-sub">Each item links to its enquiry. Resolve it with a reason, or reopen it if something changes.</p></div>
        <Tag kind="demo" show={ann} label="Sample items" />
      </div>
      <div className="ws-filters" role="tablist" aria-label="Needs You items">
        <button role="tab" aria-selected={tab === 'open'} className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>Open · {ws.needs.filter((n) => n.state !== 'resolved').length}</button>
        <button role="tab" aria-selected={tab === 'resolved'} className={tab === 'resolved' ? 'on' : ''} onClick={() => setTab('resolved')}>Resolved · {ws.needs.filter((n) => n.state === 'resolved').length}</button>
      </div>
      {!owner && <ReadOnly ann={ann} what="assign, resolve or reopen these items" />}
      {list.length === 0 && <div className="ws-card ws-empty-card"><Klaro mood="success" size={90} decorative /><p>{tab === 'open' ? 'Nothing needs a person right now.' : 'Nothing resolved yet.'}</p></div>}
      <div className="ny-list">
        {list.map((n) => {
          const e = ws.enquiries.find((x) => x.id === n.enquiry);
          return (
            <article key={n.id} className={'ny-item s-' + n.state}>
              <div className="ny-top">
                <Ally shape={e.ally.shape} tile={e.ally.tile} size={44} radius={12} />
                <div className="ny-m">
                  <h2>{n.reason}</h2>
                  <span>{e.customer} · {e.topic} · since {n.opened}</span>
                </div>
                <span className={'prio p-' + n.priority.toLowerCase()}>{n.priority}</span>
                {n.state === 'reopened' && <span className="kc-pill pill-warn"><span className="dot" />Reopened</span>}
              </div>
              {n.next && <p className="ny-next"><b>Next:</b> {n.next}</p>}
              {n.resolution && n.state === 'resolved' && <p className="ny-res"><Icon name="check" size="sm" />{n.resolution}</p>}
              <div className="ny-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEnq(e.id)}><span>Open enquiry</span></button>
                {owner && n.state !== 'resolved' && (
                  <>
                    <label className="sr-only" htmlFor={'own-' + n.id}>Assign {n.reason}</label>
                    <select id={'own-' + n.id} className="kc-select ny-sel" value={n.owner || ''} disabled={saving} onChange={(ev) => save({ type: 'assign', id: e.id, owner: ev.target.value || null, actor: 'dami', mins: 2 })}>
                      <option value="">Unassigned</option><option value="dami">Dami Ade</option><option value="tolu">Tolu Bello</option>
                    </select>
                    {resolving !== n.id && <button className="btn btn-dark btn-sm" onClick={() => { setResolving(n.id); setReason(''); setErr(''); }}>Resolve</button>}
                  </>
                )}
                {!owner && <span className="ny-own">{ownerName(n.owner)}</span>}
                {owner && n.state === 'resolved' && <button className="btn btn-ghost btn-sm" disabled={saving} onClick={() => save({ type: 'reopen', id: n.id, actor: 'dami', mins: 1 })}><span>Reopen</span></button>}
              </div>
              {resolving === n.id && (
                <form className="ny-resolve" onSubmit={(ev) => doResolve(ev, n)} noValidate>
                  <label className="kc-label" htmlFor={'rs-' + n.id}>Why is this resolved?</label>
                  <input id={'rs-' + n.id} className={'kc-input' + (err ? ' bad' : '')} value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="e.g. Sent the deposit terms by email" aria-invalid={!!err} autoFocus />
                  {err && <div className="kc-field-err vf-err" role="alert"><Icon name="alert" size="sm" />{err}</div>}
                  <div className="dr-actions"><button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Resolve item'}</button><button className="btn btn-ghost btn-sm" type="button" onClick={() => setResolving(null)}><span>Cancel</span></button></div>
                  {n.enquiry === 'e1' && <p className="dr-hint">For Alex’s table, record the outcome on the enquiry instead. It resolves this item for you.</p>}
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
    ? ['06 · Number & Go Live', 'Choose a new number or forward your existing one', 'This screen is the next review. It will cover choosing or forwarding a number, payment and verification, and the requested, configuring, failed and live states. A paid plan alone won’t mark Klaro as live.']
    : ['09 · Klaro Studio', 'Change what Klaro knows and says', 'This screen is the next review. It will cover business knowledge, greeting, voice, call handling and supported actions, with draft, saved and test states.'];
  return (
    <div className="ws-page">
      <div className="ws-card ws-next">
        <Klaro mood="thinking" size={110} decorative />
        <span className="kc-kicker">{info[0]}</span>
        <h1>{info[1]}</h1>
        <p>{info[2]}</p>
        {which === 'number' && role === 'member' && <p className="dr-hint">Only an authorised owner or admin can set up a number.</p>}
        <div className="dr-actions"><button className="btn btn-primary btn-sm" onClick={() => go('/app')}>Back to the Command Centre</button><button className="btn btn-ghost btn-sm" onClick={() => go('/app/enquiries')}><span>See calls & enquiries</span></button></div>
      </div>
    </div>
  );
}

/* ---------- shell ---------- */
export default function Workspace({ ws, dispatch, role, setRole, view, enquiryId, filter, go, sim, setSim, onHome, theme, onToggleTheme, motion, ann }) {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const c = counts(ws);
  const me = role === 'owner' ? PEOPLE.dami : PEOPLE.tolu;
  const e = enquiryId ? ws.enquiries.find((x) => x.id === enquiryId) : null;
  const base = view === 'needs' ? '/app/needs-you' : view === 'home' ? '/app' : '/app/enquiries';
  const openEnq = (id) => go((view === 'needs' ? '/app/needs-you' : view === 'home' ? '/app' : '/app/enquiries') + '?e=' + id);
  const closeEnq = () => go(base + (view === 'enquiries' && filter !== 'all' ? '?f=' + filter : ''));

  const flash = (t, kind) => { setToast({ t, kind }); clearTimeout(flash.t); flash.t = setTimeout(() => setToast(null), 4200); };
  const save = (action, after) => {
    if (role !== 'owner') return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (sim.save === 'fail') { setSim({ ...sim, save: 'ok' }); flash('Couldn’t save. Nothing changed. Try again.', 'bad'); return; }
      dispatch(action);
      if (after) after();
      flash(action.type === 'assign' ? 'Assigned. Shown in Needs You and on the enquiry.' : action.type === 'confirm' ? 'Outcome saved. Needs You and the Command Centre are updated.' : action.type === 'attempt' ? 'Attempt saved. The item stays open.' : action.type === 'resolve' ? 'Resolved. The enquiry timeline has a new entry.' : action.type === 'reopen' ? 'Reopened. It’s back in Needs You.' : 'Saved.', 'ok');
    }, 700);
  };

  const nav = [
    ['home', '/app', 'Command Centre', 'grid'],
    ['enquiries', '/app/enquiries', 'Calls & Enquiries', 'phone', c.openEnq],
    ['needs', '/app/needs-you', 'Needs You', 'bell', c.needsOpen],
    ['number', '/app/number', 'Number & Go Live', 'sim'],
    ['studio', '/app/studio', 'Klaro Studio', 'sparkle']
  ];

  return (
    <div className={'kc ws' + (motion === 'reduce' ? ' rm' : '')}>
      <header className="kc-top">
        <Brand onClick={(ev) => { ev.preventDefault(); onHome(); }} />
        <div className="kc-top-mid"><span className="kc-chip"><Icon name="fork" size="sm" /><span>{ws.biz}</span></span></div>
        <div className="kc-top-right">
          <div className="ws-viewas" role="group" aria-label="View as (review control)">
            <span className="lab">View as</span>
            <button className={role === 'owner' ? 'on' : ''} aria-pressed={role === 'owner'} onClick={() => setRole('owner')}>Owner/admin</button>
            <button className={role === 'member' ? 'on' : ''} aria-pressed={role === 'member'} onClick={() => setRole('member')}>Member</button>
          </div>
          {onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
        </div>
      </header>

      <div className="ws-shell">
        <nav className="ws-nav" aria-label="Workspace">
          <div className="ws-me"><span className="ws-av">{initials(me.name)}</span><div><b>{me.name}</b><span>{role === 'owner' ? 'Owner/admin' : 'Member · ' + me.team}</span></div></div>
          {nav.map((n) => (
            <button key={n[0]} className={'ws-nav-i' + (view === n[0] ? ' on' : '')} aria-current={view === n[0] ? 'page' : undefined} onClick={() => go(n[1])}>
              <Icon name={n[3]} size="sm" /><span>{n[2]}</span>{n[4] ? <em>{n[4]}</em> : null}{(n[0] === 'number' || n[0] === 'studio') && <i className="soon">Next review</i>}
            </button>
          ))}
          <div className="ws-nav-foot"><span className="kc-pill pill-demo"><span className="dot" />Preview · sample data</span></div>
        </nav>

        <main className="ws-main" id="ws-main">
          {view === 'home' && <CommandCentre ws={ws} role={role} go={go} openEnq={openEnq} ann={ann} />}
          {view === 'enquiries' && <Enquiries ws={ws} role={role} filter={filter} setFilter={(f) => go('/app/enquiries' + (f === 'all' ? '' : '?f=' + f))} openEnq={openEnq} ann={ann} />}
          {view === 'needs' && <NeedsYou ws={ws} role={role} save={save} saving={saving} openEnq={openEnq} ann={ann} />}
          {(view === 'number' || view === 'studio') && <NextReview which={view} go={go} role={role} />}
        </main>
      </div>

      {e && <Drawer key={e.id} ws={ws} e={e} role={role} setRole={setRole} dispatch={dispatch} saving={saving} save={save} sim={sim} onClose={closeEnq} go={go} ann={ann} />}
      {toast && <div className={'kc-toast' + (toast.kind === 'bad' ? ' bad' : '')} role={toast.kind === 'bad' ? 'alert' : 'status'}><Icon name={toast.kind === 'bad' ? 'alert' : 'check'} size="sm" />{toast.t}</div>}
    </div>
  );
}
