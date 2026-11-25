import { useEffect, useState } from 'react';
import Landing from './Landing.jsx';
import Flow from './Flow.jsx';
import { useTheme } from './components/Brand.jsx';

function readRoute() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  if (path.startsWith('/start')) {
    const site = params.get('site') || '';
    return { view: 'flow', init: { url: site, manual: !site }, key: path + window.location.search };
  }
  return { view: 'landing', key: 'landing' };
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const start = (url, manual) => {
    const qs = manual || !url ? '' : '?site=' + encodeURIComponent(url.trim());
    window.history.pushState({}, '', '/start' + qs);
    setRoute({ view: 'flow', init: { url, manual }, key: 'start-' + Date.now() });
  };
  const home = () => {
    window.history.pushState({}, '', '/');
    setRoute({ view: 'landing', key: 'landing-' + Date.now() });
    window.scrollTo(0, 0);
  };

  if (route.view === 'flow') return <Flow key={route.key} init={route.init} onHome={home} theme={theme} onToggleTheme={toggleTheme} />;
  return <Landing key={route.key} onStart={start} theme={theme} onToggleTheme={toggleTheme} />;
}
