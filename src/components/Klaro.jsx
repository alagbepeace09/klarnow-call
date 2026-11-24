const LABELS = {
  welcome: 'Klaro waving hello',
  thinking: 'Klaro thinking',
  listening: 'Klaro listening',
  speaking: 'Klaro speaking',
  working: 'Klaro working',
  success: 'Klaro happy, task done',
  attention: 'Klaro needs your attention'
};

/** Klaro: the Klarnow Call receptionist. Pure CSS character, 10em wide. */
export default function Klaro({ mood = 'welcome', size = 240, decorative = false }) {
  return (
    <div
      className={'klaro mood-' + mood}
      style={{ fontSize: size / 10 + 'px' }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : LABELS[mood]}
      aria-hidden={decorative ? 'true' : undefined}
    >
      <div className="k-aura" />
      <div className="k-shadow" />
      <div className="k-orbit" />
      <div className="k-fig">
        <div className="k-arm l" />
        <div className="k-arm r" />
        <div className="k-band" />
        <div className="k-body" />
        <div className="k-foot l" />
        <div className="k-foot r" />
        <div className="k-ear l" />
        <div className="k-ear r" />
        <div className="k-visor">
          <div className="k-scan" />
          <div className="k-eye l" />
          <div className="k-eye r" />
        </div>
        <div className="k-mouth" />
        <div className="k-mic" />
        <div className="k-mic-tip" />
        <div className="k-ringfx"><i /><i /><i /></div>
        <div className="k-sound"><i /><i /><i /><i /></div>
        <div className="k-dots"><i /><i /><i /></div>
      </div>
      <div className="k-badge">
        {mood === 'success' && (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        )}
        {mood === 'attention' && (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v8M12 18.5v.01" /></svg>
        )}
      </div>
    </div>
  );
}
