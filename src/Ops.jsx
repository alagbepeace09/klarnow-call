import { useEffect, useState } from 'react';
import Icon from './components/Icons.jsx';
import { BrandMark, ThemeToggle } from './components/Brand.jsx';

/** Klarnow team page: number requests from every workspace; assign a real number or mark it live. */
export default function Ops({ onSignIn, onHome, theme, onToggleTheme }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState('todo');
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/ops', { credentials: 'same-origin' })
    .then((r) => r.json().then((j) => ({ ok: r.ok, status: r.status, j })))
    .then(({ ok, status, j }) => { if (ok) { setData(j); setErr(null); } else setErr({ status, ...j }); })
    .catch(() => setErr({ status: 0, message: 'Couldn’t reach the server.' }));
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    setBusy(id + action); setMsg('');
    const r = await fetch('/api/ops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id, action, number: draft[id] || '' }) });
    const j = await r.json().catch(() => ({}));
    setBusy('');
    if (!r.ok) { setMsg(j.message || 'Couldn’t save. Nothing changed.'); return; }
    setMsg(action === 'assign' ? 'Number saved. The business sees it in their dashboard now.' : action === 'live' ? 'Marked live.' : 'Number removed.');
    load();
  };

  const list = data ? data.workspaces.filter((w) => (filter === 'todo' ? w.number.status === 'requested' : filter === 'assigned' ? w.number.status === 'assigned' || w.number.status === 'live' : true)) : [];
  const count = (st) => (data ? data.workspaces.filter((w) => (st === 'assigned' ? w.number.status === 'assigned' || w.number.status === 'live' : w.number.status === st)).length : 0);

  return (
    <div className="kc adm ops">
      <div className="adm-glow" aria-hidden="true" />
      <main className="ops-wrap" id="main-content">
        <div className="adm-bar">
          <div className="adm-bar-l"><a className="adm-brand" href="/" onClick={(e) => { e.preventDefault(); onHome(); }}><BrandMark /><span>klaro<em>call</em></span></a><span className="adm-crumb">Klarnow team · Numbers</span></div>
          <div className="adm-bar-r">{data && <span className="ap t-violet"><i />{data.me}</span>}{onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} className="a-theme" />}</div>
        </div>

        {!data && !err && <p className="a-empty">Loading…</p>}
        {err && (
          <div className="a-card a-empty-big">
            <div>
              <h2>{err.status === 401 ? 'Sign in with your Klarnow team email' : err.status === 403 ? 'This page is for the Klarnow team' : 'Something went wrong'}</h2>
              <p className="a-p">{err.message}{err.status === 403 ? ' Add the email to OPS_EMAILS in Vercel, then redeploy.' : ''}</p>
              {err.status === 401 && <div className="a-actions" style={{ marginTop: 14 }}><button className="ab ab-dark" onClick={onSignIn}>Sign in</button></div>}
            </div>
          </div>
        )}

        {data && (
          <div className="a-page">
            <header className="a-head"><div><p className="a-eyebrow">Private · Klarnow team only</p><h1>Phone numbers</h1><p className="a-sub">Businesses request a number in their dashboard. Add the real number here and it appears for them straight away.</p></div></header>
            <div className="a-toolbar">
              <div className="a-seg" role="tablist" aria-label="Filter">
                <button role="tab" aria-selected={filter === 'todo'} className={filter === 'todo' ? 'on' : ''} onClick={() => setFilter('todo')}>To do <em>{count('requested')}</em></button>
                <button role="tab" aria-selected={filter === 'assigned'} className={filter === 'assigned' ? 'on' : ''} onClick={() => setFilter('assigned')}>Has a number <em>{count('assigned')}</em></button>
                <button role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All workspaces <em>{data.workspaces.length}</em></button>
              </div>
              {msg && <span className="ap t-green" role="status"><i />{msg}</span>}
            </div>
            {list.length === 0 && <div className="a-card a-empty-big"><div><h2>Nothing here</h2><p className="a-p">{filter === 'todo' ? 'No businesses are waiting for a number.' : 'No workspaces match.'}</p></div></div>}
            <div className="a-needs">
              {list.map((w) => {
                const n = w.number;
                return (
                  <article key={w.id} className="a-card a-need">
                    <div className="a-need-top">
                      <span className="a-av">{(w.biz || '?').slice(0, 2).toUpperCase()}</span>
                      {n.status === 'live' ? <span className="ap t-green"><i />Live</span> : n.status === 'assigned' ? <span className="ap t-violet"><i />Number assigned</span> : n.status === 'requested' ? <span className="ap t-amber"><i />Requested</span> : <span className="ap t-grey"><i />No request</span>}
                    </div>
                    <h2>{w.biz}</h2>
                    <p className="a-p">{w.ownerName} · {w.owner}{w.url ? ' · ' + w.url : ''}</p>
                    <div className="a-chips">
                      {n.status !== 'none' && <span>{n.kind === 'forward' ? 'Keep their number: ' + n.existing : 'New number' + (n.area ? ' · ' + n.area : '')}</span>}
                      {n.requestedAt && <span>Requested {n.requestedAt}</span>}
                      <span>{w.team} {w.team === 1 ? 'person' : 'people'}</span>
                    </div>
                    {n.value && <div className="a-next"><span>Number</span><b>{n.value}</b></div>}
                    <div className="a-form a-resolve">
                      <div className="a-field"><label htmlFor={'num-' + w.id}>{n.value ? 'Change number' : 'Klaro number for this business'}</label>
                        <input id={'num-' + w.id} inputMode="tel" placeholder="+44 161 555 0123" value={draft[w.id] != null ? draft[w.id] : (n.value || '')} onChange={(e) => setDraft({ ...draft, [w.id]: e.target.value })} /></div>
                      <div className="a-actions">
                        <button className="ab ab-dark" disabled={busy === w.id + 'assign'} onClick={() => act(w.id, 'assign')}>{busy === w.id + 'assign' ? 'Saving…' : n.value ? 'Update number' : 'Assign number'}</button>
                        {n.value && n.status !== 'live' && <button className="ab ab-light" onClick={() => act(w.id, 'live')}>Mark live</button>}
                        {n.value && <button className="ab ab-light" onClick={() => act(w.id, 'unassign')}>Remove</button>}
                      </div>
                      <p className="a-fine">Only mark live once Klaro really answers calls on this number.</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
