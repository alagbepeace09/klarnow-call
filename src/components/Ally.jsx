// Allies characters, rebuilt for Klarnow Call as the callers Klaro talks to.
// Same geometry as the Allies set (circle, drip, rounded square, drop; thick ink
// outline; crescent eyes whose position shows where they're looking), recoloured
// to the Klarnow palette.

export const ALLY_COLORS = {
  violet: '#845aee',
  lime: '#dfff75',
  lilac: '#b9aaff',
  ink: '#111111',
  amber: '#ffb547',
  blush: '#ffd3ec',
  mist: '#efefeb'
};

const SHAPES = {
  circle: { body: <circle cx="50" cy="50" r="33" />, eyes: [[53, 44], [64, 44]] },
  drip: {
    body: <path d="M19 49C19 30 32 17 50 17s31 13 31 32c0 10-5 17-9 21l-1.6 10.5c-.7 4-5.6 4-6.4 0l-1.2-6c-.6-3-4.6-3-5.2 0l-1.6 9c-.7 4.2-6.2 4.2-7 0l-1.6-9c-.6-3-4.6-3-5.2 0l-1.2 6c-.8 4-5.7 4-6.4 0L28 70c-4-4-9-11-9-21z" />,
    eyes: [[37, 47], [48, 47]]
  },
  square: { body: <rect x="18" y="18" width="64" height="64" rx="17" />, eyes: [[58, 58], [69, 58]] },
  drop: {
    body: <path d="M47 19c9-1 16 7 23 20s13 27 9 36-15 9-29 9-27 0-30-9 3-21 10-34 9-21 17-22z" />,
    eyes: [[36, 62], [47, 62]]
  }
};

export default function Ally({ shape = 'circle', tile, size = 64, radius = 14, look = 0, className = '', title }) {
  const s = SHAPES[shape] || SHAPES.circle;
  const bg = tile ? ALLY_COLORS[tile] || tile : null;
  return (
    <svg
      className={'ally ' + className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    >
      {bg && <rect x="0" y="0" width="100" height="100" rx={radius} fill={bg} />}
      <g fill="#ffffff" stroke="#111111" strokeWidth="5.5" strokeLinejoin="round">{s.body}</g>
      {s.eyes.map(([x, y], i) => (
        <g key={i} transform={'translate(' + (x + look) + ' ' + y + ')'}>
          <ellipse rx="3.9" ry="5.4" fill="#111111" />
          <ellipse cx="1.7" cy="-.2" rx="2.4" ry="4.1" fill="#ffffff" />
        </g>
      ))}
    </svg>
  );
}

// A stable sequence of caller personas used across the site.
export const CALLERS = [
  { shape: 'circle', tile: 'violet' },
  { shape: 'drip', tile: 'lime' },
  { shape: 'square', tile: 'lilac' },
  { shape: 'drop', tile: 'amber' },
  { shape: 'circle', tile: 'blush' },
  { shape: 'square', tile: 'ink' },
  { shape: 'drip', tile: 'violet' },
  { shape: 'drop', tile: 'lime' }
];
