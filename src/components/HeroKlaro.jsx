import { useState } from 'react';
import Klaro from './Klaro.jsx';

// The real Klaro render from klarnow.co.uk/call. Falls back to the CSS Klaro if it can't load.
export const KLARO_RENDER = 'https://www.klarnow.co.uk/images/call/klarnow-call-agent.png';

/**
 * Standalone Klaro (no frame) with an OpenBot-style light line:
 * the line drops from the top of the page, lands behind Klaro, then rolls
 * around him as a glowing orbit. A bright comet keeps travelling the orbit.
 */
export function KlaroRender({ alt = '', fallbackSize = 120, ...rest }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Klaro mood="welcome" size={fallbackSize} decorative={!alt} />;
  return <img src={KLARO_RENDER} alt={alt} onError={() => setFailed(true)} draggable="false" {...rest} />;
}

export default function HeroKlaro({ size = 460, id = 'hk', children, beamFrom = -520 }) {
  const [failed, setFailed] = useState(false);
  const g = id; // unique ids for gradients/filters
  // geometry in a 600 × 600 box
  const cx = 300, cy = 452, rx = 268, ry = 62, top = cy - ry;
  const backRight = `M${cx} ${top} A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
  const front = `M${cx + rx} ${cy} A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`;
  const backLeft = `M${cx - rx} ${cy} A${rx} ${ry} 0 0 1 ${cx} ${top}`;
  const full = `M${cx} ${top} A${rx} ${ry} 0 0 1 ${cx} ${cy + ry} A${rx} ${ry} 0 0 1 ${cx} ${top}`;
  const beam = `M${cx} ${beamFrom} L${cx} ${top}`;

  const Defs = () => (
    <defs>
      <linearGradient id={g + '-beam'} x1={cx} y1={beamFrom} x2={cx} y2={top} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#b9aaff" stopOpacity="0" />
        <stop offset=".55" stopColor="#845aee" stopOpacity=".85" />
        <stop offset="1" stopColor="#d9ccff" stopOpacity="1" />
      </linearGradient>
      <linearGradient id={g + '-ring'} x1={cx - rx} y1={cy} x2={cx + rx} y2={cy} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#845aee" />
        <stop offset=".5" stopColor="#b9aaff" />
        <stop offset=".78" stopColor="#c9f04d" />
        <stop offset="1" stopColor="#845aee" />
      </linearGradient>
      <filter id={g + '-glow'} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <clipPath id={g + '-backclip'}><rect x="-100" y="-1000" width="800" height={1000 + cy} /></clipPath>
      <clipPath id={g + '-frontclip'}><rect x="-100" y={cy} width="800" height="400" /></clipPath>
    </defs>
  );

  return (
    <div className="hk" style={{ '--hk': size + 'px' }}>
      <div className="hk-haze" aria-hidden="true" />
      {/* behind Klaro */}
      <svg className="hk-svg hk-back" viewBox="0 0 600 600" aria-hidden="true">
        <Defs />
        <g filter={`url(#${g}-glow)`}>
          <path className="hk-beam-wide" d={beam} stroke={`url(#${g}-beam)`} pathLength="1" />
          <path className="hk-beam" d={beam} stroke={`url(#${g}-beam)`} pathLength="1" />
          <path className="hk-ring hk-r1" d={backRight} stroke={`url(#${g}-ring)`} pathLength="1" />
          <path className="hk-ring hk-r3" d={backLeft} stroke={`url(#${g}-ring)`} pathLength="1" />
          <g clipPath={`url(#${g}-backclip)`}><path className="hk-comet" d={full} pathLength="1" /></g>
        </g>
        <circle className="hk-flash" cx={cx} cy={top} r="22" />
      </svg>

      <div className="hk-figure">
        {failed ? (
          <div className="hk-fallback"><Klaro mood="welcome" size={size * 0.62} /></div>
        ) : (
          <img src={KLARO_RENDER} alt="Klaro, the Klaro Call receptionist, waving hello" width="1254" height="1254" fetchPriority="high" onError={() => setFailed(true)} draggable="false" />
        )}
      </div>

      {/* in front of Klaro */}
      <svg className="hk-svg hk-front" viewBox="0 0 600 600" aria-hidden="true">
        <Defs />
        <g filter={`url(#${g}-glow)`}>
          <path className="hk-ring hk-r2" d={front} stroke={`url(#${g}-ring)`} pathLength="1" />
          <g clipPath={`url(#${g}-frontclip)`}><path className="hk-comet" d={full} pathLength="1" /></g>
        </g>
      </svg>
      {children}
    </div>
  );
}
