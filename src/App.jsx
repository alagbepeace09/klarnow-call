import { useEffect, useReducer, useRef, useState } from 'react';
import Landing from './Landing.jsx';
import Flow from './Flow.jsx';
import Verify from './Verify.jsx';
import Workspace from './Workspace.jsx';
import { useTheme } from './components/Brand.jsx';
import { ReviewPanel, AnnotationDock } from './components/Review.jsx';
import { initialWorkspace, reducer, hhmm } from './workspace/model.js';

const store = {
  get(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};
const local = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
};
const localIso = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':00'; };

function readRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const p = new URLSearchParams(window.location.search);
  const key = path + window.location.search;
  if (path.startsWith('/start')) {
    const site = p.get('site') || '';
    const state = p.get('state') || '';
    return { view: 'flow', init: { url: site || (state ? 'canalstreetkitchen.co.uk' : ''), manual: !site && !state, state }, key };
  }
  if (path === '/save') return { view: 'save', key };
  if (path.startsWith('/app')) {
    const sub = path.split('/')[2] || '';
    const ws = { '': 'home', enquiries: 'enquiries', 'needs-you': 'needs', number: 'number', studio: 'studio' }[sub] || 'home';
    return { view: 'app', ws, enquiry: p.get('e') || '', filter: p.get('f') || 'all', key: 'app' };
  }
  return { view: 'landing', key: 'landing' };
}

const SCREEN = { home: '05', enquiries: '07', needs: '08', number: '06', studio: '09' };

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [theme, toggleTheme] = useTheme();
  const [draft, setDraft] = useState(() => store.get('kc-draft', null));
  const [sample, dispatch] = useReducer(reducer, null, () => store.get('kc-ws2', null) || initialWorkspace(null));
  const [session, setSession] = useState(null); // signed-in user and their shared workspace (from the server)
  const [checked, setChecked] = useState(false);
  const [role, setRole] = useState(() => store.get('kc-role', 'owner'));
  const [ann, setAnn] = useState(() => local.get('kc-ann', '0') === '1');
  const [motion, setMotion] = useState(() => local.get('kc-motion', (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'reduce' : 'full'));
  const [sim, setSim] = useState({ scan: 'success', call: 'answered', email: 'fail-once', save: 'ok' });
  const [flowScreen, setFlowScreen] = useState('02');
  const [review] = useState(() => {
    const m = (window.location.search.match(/[?&]review=([01])/) || [])[1];
    if (m) local.set('kc-review', m);
    return local.get('kc-review', '0') === '1';
  });
  const sessionRef = useRef(null);
  sessionRef.current = session;

  const go = (url, opts) => {
    if (url !== window.location.pathname + window.location.search) window.history.pushState({}, '', url);
    const r = readRoute();
    setRoute(opts && opts.fresh ? { ...r, key: r.key + '-' + Date.now() } : r);
    if (!(r.view === 'app' && (r.enquiry || route.view === 'app'))) window.scrollTo(0, 0);
  };

  const refresh = () => fetch('/api/me', { credentials: 'same-origin' })
    .then((r) => r.json())
    .then((j) => { setSession(j && j.signedIn ? j : null); })
    .catch(() => { /* offline or no API: keep the current view */ })
    .finally(() => setChecked(true));

  useEffect(() => {
    refresh();
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Keep a shared workspace fresh so teammates see each other's changes.
  useEffect(() => {
    if (!session || route.view !== 'app') return undefined;
    const tick = () => { if (document.visibilityState === 'visible') fetch('/api/workspace', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && j.signedIn) setSession(j); }).catch(() => {}); };
    const t = setInterval(tick, 20000);
    window.addEventListener('focus', tick);
    return () => { clearInterval(t); window.removeEventListener('focus', tick); };
  }, [!!session, route.view]);
  useEffect(() => { store.set('kc-ws2', sample); }, [sample]);
  useEffect(() => { store.set('kc-role', role); }, [role]);
  useEffect(() => { local.set('kc-ann', ann ? '1' : '0'); }, [ann]);
  useEffect(() => { local.set('kc-motion', motion); document.documentElement.setAttribute('data-motion', motion); }, [motion]);
  useEffect(() => { if (session) setRole(session.me.role); }, [session && session.me.email, session && session.me.role]);

  const start = (url, manual) => go('/start' + (manual || !url ? '' : '?site=' + encodeURIComponent(url.trim())), { fresh: true });
  const home = () => go('/', { fresh: true });
  const onSave = (d) => { setDraft(d); store.set('kc-draft', d); go('/save'); };
  const onVerified = (r) => { setSession({ signedIn: true, me: r.me, workspace: r.workspace, personal: r.personal, domain: r.domain }); setRole(r.me.role); go('/app'); };
  const onPreviewDone = () => { setRole('owner'); go('/app'); };
  const signOut = () => fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).finally(() => { setSession(null); go('/', { fresh: true }); });

  // Writes: shared workspace goes through the server (owner-only is enforced there); the sample stays in this browser.
  const applyLive = async (action) => {
    let r;
    try {
      r = await fetch('/api/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ action: { ...action, now: hhmm(new Date()), nowIso: localIso() } }) });
    } catch (e) { throw new Error('Couldn’t reach the server. Nothing changed. Try again.'); }
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { setSession(null); throw new Error('Your session ended. Sign in again.'); }
    if (!r.ok) throw new Error(j.message || 'Couldn’t save. Nothing changed. Try again.');
    setSession(j);
    return j;
  };
  const applySample = (action) => new Promise((resolve, reject) => setTimeout(() => {
    if (sim.save === 'fail') { setSim({ ...sim, save: 'ok' }); reject(new Error('Couldn’t save. Nothing changed. Try again.')); return; }
    dispatch(action); resolve();
  }, 600));

  const reset = () => {
    if (session && session.me.role === 'owner') applyLive({ type: 'reset-samples' }).catch(() => {});
    else dispatch({ type: 'reset' });
    if (!session) setRole('owner');
    setSim({ scan: 'success', call: 'answered', email: 'fail-once', save: 'ok' });
  };

  const screen = route.view === 'landing' ? '01' : route.view === 'flow' ? flowScreen : route.view === 'save' ? '04' : SCREEN[route.ws];
  const common = { theme, onToggleTheme: toggleTheme, motion, ann: review && ann };

  let page;
  if (route.view === 'flow') {
    page = <Flow key={route.key} init={route.init} onHome={home} onSave={onSave} sim={sim} onScreen={(s) => setFlowScreen(s)} {...common} />;
  } else if (route.view === 'save') {
    page = <Verify key={route.key} draft={draft} onHome={home} onBack={() => go(draft && draft.url ? '/start?state=' + (draft.testCall === 'completed' ? 'summary' : 'review') : '/start', { fresh: true })} onDone={onVerified} onPreviewDone={onPreviewDone} {...common} />;
  } else if (route.view === 'app') {
    if (!checked) page = <div className="kc adm" aria-busy="true" />;
    else if (session) {
      const effective = session.me.role === 'owner' ? role : 'member';
      page = <Workspace ws={session.workspace} apply={applyLive} live me={session.me.email} realRole={session.me.role} domain={session.domain} personal={session.personal}
        role={effective} setRole={setRole} view={route.ws} enquiryId={route.enquiry} filter={route.filter} go={go} sim={sim} onHome={home} onSetup={() => start('', true)} onSignOut={signOut} {...common} />;
    } else {
      page = <Workspace ws={sample} apply={applySample} live={false} me={role === 'member' ? 'tolu' : 'dami'} realRole={role}
        role={role} setRole={setRole} view={route.ws} enquiryId={route.enquiry} filter={route.filter} go={go} sim={sim} onHome={home} onSetup={() => go('/', { fresh: true })} onSignOut={home} {...common} />;
    }
  } else {
    page = <Landing key={route.key} onStart={start} signedIn={!!session} onOpenApp={() => go('/app')} {...common} />;
  }

  return (
    <>
      <a className="skip" href="#main-content" onClick={(e) => { e.preventDefault(); const m = document.querySelector('main'); if (m) { m.setAttribute('tabindex', '-1'); m.focus(); } }}>Skip to content</a>
      {page}
      <AnnotationDock key={screen} screen={screen} show={review && ann} onClose={() => setAnn(false)} />
      <ReviewPanel show={review} go={(u) => go(u, { fresh: true })} ann={ann} setAnn={setAnn} motion={motion} setMotion={setMotion} role={role} setRole={setRole} sim={sim} setSim={setSim} onReset={reset} />
    </>
  );
}
