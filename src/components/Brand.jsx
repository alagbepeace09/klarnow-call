import { useEffect, useState } from 'react';

export function BrandMark({ className = 'brand-mark' }) {
  return (
    <svg className={className} viewBox="0 0 30 22" aria-hidden="true">
      <rect x="1" y="1" width="28" height="20" rx="10" fill="#7346ff" />
      <rect x="1" y="1" width="28" height="20" rx="10" fill="none" stroke="#b9a6ff" strokeOpacity=".7" strokeWidth="1.4" />
      <ellipse cx="10.5" cy="11" rx="2.9" ry="3.6" fill="#fff" />
      <ellipse cx="19.5" cy="11" rx="2.9" ry="3.6" fill="#d2ff3a" />
    </svg>
  );
}

export function Brand({ onClick, href = '/' }) {
  return (
    <a className="brand" href={href} onClick={onClick} aria-label="Klaro Call home">
      <BrandMark />
      <span className="brand-word">klaro<em>call</em></span>
    </a>
  );
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('kc-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (e) { /* storage unavailable */ }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || getInitialTheme());
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('kc-theme', theme); } catch (e) { /* ignore */ }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

export function ThemeToggle({ theme, onToggle, className = '' }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button className={'theme-toggle ' + className} onClick={onToggle} aria-label={'Switch to ' + next + ' mode'} title={'Switch to ' + next + ' mode'}>
      <svg className="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>
      <svg className="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>
    </button>
  );
}
