import { useEffect, useReducer, useState } from 'react';
import Landing from './Landing.jsx';
import Flow from './Flow.jsx';
import Verify from './Verify.jsx';
import Workspace from './Workspace.jsx';
import { useTheme } from './components/Brand.jsx';
import { ReviewPanel, AnnotationDock } from './components/Review.jsx';
import { initialWorkspace, reducer } from './workspace/model.js';

const store = {
  get(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};
const local = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
};

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
  const [ws, dispatch] = useReducer(reducer, null, () => store.get('kc-ws', null) || initialWorkspace(store.get('kc-draft', null)));
  const [role, setRole] = useState(() => store.get('kc-role', 'owner'));
  const [ann, setAnn] = useState(() => local.get('kc-ann', '1') === '1');
  const [motion, setMotion] = useState(() => local.get('kc-motion', (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'reduce' : 'full'));
  const [sim, setSim] = useState({ scan: 'success', call: 'answered', email: 'fail-once', save: 'ok' });
  const [flowScreen, setFlowScreen] = useState('02');

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => { store.set('kc-ws', ws); }, [ws]);
  useEffect(() => { store.set('kc-role', role); }, [role]);
  useEffect(() => { local.set('kc-ann', ann ? '1' : '0'); }, [ann]);
  useEffect(() => { local.set('kc-motion', motion); document.documentElement.setAttribute('data-motion', motion); }, [motion]);

  const go = (url, opts) => {
    if (url !== window.location.pathname + window.location.search) window.history.pushState({}, '', url);
    const r = readRoute();
    setRoute(opts && opts.fresh ? { ...r, key: r.key + '-' + Date.now() } : r);
    if (!(r.view === 'app' && (r.enquiry || route.view === 'app'))) window.scrollTo(0, 0);
  };
  const start = (url, manual) => go('/start' + (manual || !url ? '' : '?site=' + encodeURIComponent(url.trim())), { fresh: true });
  const home = () => go('/', { fresh: true });
  const onSave = (d) => { setDraft(d); store.set('kc-draft', d); go('/save'); };
  const onVerified = (r) => { setRole(r); go('/app'); };
  const reset = () => {
    dispatch({ type: 'reset', draft });
    setRole('owner');
    setSim({ scan: 'success', call: 'answered', email: 'fail-once', save: 'ok' });
  };

  const screen = route.view === 'landing' ? '01' : route.view === 'flow' ? flowScreen : route.view === 'save' ? '04' : SCREEN[route.ws];
  const common = { theme, onToggleTheme: toggleTheme, motion, ann };

  let page;
  if (route.view === 'flow') {
    page = <Flow key={route.key} init={route.init} onHome={home} onSave={onSave} sim={sim} onScreen={(s) => setFlowScreen(s)} {...common} />;
  } else if (route.view === 'save') {
    page = <Verify key={route.key} draft={draft} onHome={home} onBack={() => go('/start?state=' + (draft && draft.testCall === 'completed' ? 'summary' : 'review'), { fresh: true })} onDone={onVerified} {...common} />;
  } else if (route.view === 'app') {
    page = <Workspace ws={ws} dispatch={dispatch} role={role} setRole={setRole} view={route.ws} enquiryId={route.enquiry} filter={route.filter} go={go} sim={sim} setSim={setSim} onHome={home} {...common} />;
  } else {
    page = <Landing key={route.key} onStart={start} {...common} />;
  }

  return (
    <>
      <a className="skip" href="#main-content" onClick={(e) => { e.preventDefault(); const m = document.querySelector('main'); if (m) { m.setAttribute('tabindex', '-1'); m.focus(); } }}>Skip to content</a>
      {page}
      <AnnotationDock key={screen} screen={screen} show={ann} onClose={() => setAnn(false)} />
      <ReviewPanel go={(u) => go(u, { fresh: true })} ann={ann} setAnn={setAnn} motion={motion} setMotion={setMotion} role={role} setRole={setRole} sim={sim} setSim={setSim} onReset={reset} />
    </>
  );
}
