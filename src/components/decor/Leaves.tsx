import './decor.css';

const LEAF_COLORS = ['#8fab6a', '#a7bd7b', '#c9a14a', '#d58f4e', '#7d9a5c', '#b8c27c'];

export function Leaf({ color = '#8fab6a', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M4 28 C 4 14 14 4 28 4 C 28 18 18 28 4 28 Z" fill={color} fillOpacity="0.9" stroke="#4a3426" strokeOpacity="0.55" strokeWidth="1.2" />
      <path d="M5 27 C 12 20 18 14 26 6" stroke="#4a3426" strokeOpacity="0.45" strokeWidth="1.1" fill="none" />
    </svg>
  );
}

/**
 * Blader som daler sakte ned. Faste (ikke tilfeldige) verdier gir lik visning hver gang
 * og ingen hopp i layout. Skjules helt for brukere som har bedt om mindre bevegelse.
 */
export function FallingLeaves({ count = 6, seed = 0 }: { count?: number; seed?: number }) {
  const leaves = Array.from({ length: count }, (_, i) => {
    const n = i + seed * 7;
    return {
      left: `${(n * 37 + 11) % 92}%`,
      duration: 11 + ((n * 5) % 7),
      delay: -((n * 3.7) % 12),
      size: 16 + ((n * 7) % 12),
      sway: 30 + ((n * 13) % 40),
      color: LEAF_COLORS[n % LEAF_COLORS.length],
    };
  });
  return (
    <div className="falling-leaves motion-only" aria-hidden="true">
      {leaves.map((leaf, i) => (
        <span
          key={i}
          className="falling-leaf"
          style={
            {
              left: leaf.left,
              '--leaf-dur': `${leaf.duration}s`,
              '--leaf-delay': `${leaf.delay}s`,
              '--leaf-sway': `${leaf.sway}px`,
            } as React.CSSProperties
          }
        >
          <span className="falling-leaf__sway">
            <Leaf color={leaf.color} size={leaf.size} />
          </span>
        </span>
      ))}
    </div>
  );
}
