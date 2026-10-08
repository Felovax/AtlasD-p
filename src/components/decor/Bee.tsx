import './decor.css';

interface BeeProps {
  size?: number;
  className?: string;
  /** Speilvend bien så den «ser» andre veien. */
  flip?: boolean;
}

/** En liten akvarell-aktig bie med blafrende vinger (ren CSS-animasjon). */
export function Bee({ size = 34, className = '', flip = false }: BeeProps) {
  return (
    <svg
      className={`bee ${flip ? 'bee--flip' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <g className="bee__wings">
        <ellipse cx="20" cy="14" rx="8" ry="11" transform="rotate(-24 20 14)" fill="#eef6f8" fillOpacity="0.85" stroke="#4a3426" strokeWidth="1.4" />
        <ellipse cx="29" cy="13" rx="7" ry="10" transform="rotate(20 29 13)" fill="#e2eff2" fillOpacity="0.85" stroke="#4a3426" strokeWidth="1.4" />
      </g>
      <path d="M8 30 L3 31.5 L8 33" fill="#4a3426" />
      <ellipse cx="24" cy="30" rx="15" ry="11" fill="#f2c14e" stroke="#4a3426" strokeWidth="1.8" />
      <path d="M17 20.5 C 14 26 14 34 17 39.5 M25 19 C 22 25 22 35 25 41" stroke="#4a3426" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="27.5" r="1.9" fill="#3a281c" />
      <path d="M33 33.5 C 34.5 34.6 36 34.6 37.2 33.4" stroke="#3a281c" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <circle cx="36.5" cy="31.3" r="1.6" fill="#e9967f" opacity="0.6" />
      <path d="M33 20 C 33 16 35 14 37 13 M36 21 C 37.5 18 39.5 17 41.5 17" stroke="#4a3426" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

interface FlyingBeeProps {
  size?: number;
  /** Plassering i forelderen, f.eks. { top: '20%', left: '10%' } */
  style?: React.CSSProperties;
  /** Hvor langt bien flyr sidelengs og opp/ned (px). */
  rangeX?: number;
  rangeY?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

/**
 * En bie som svever i en organisk åttetallsbane. To nøstede CSS-animasjoner med ulik
 * periode gir en Lissajous-kurve – helt uten JavaScript, og kun transform (billig på mobil).
 */
export function FlyingBee({ size = 30, style, rangeX = 60, rangeY = 26, duration = 7, delay = 0, className = '' }: FlyingBeeProps) {
  const vars = {
    '--bee-x': `${rangeX}px`,
    '--bee-y': `${rangeY}px`,
    '--bee-dur': `${duration}s`,
    '--bee-delay': `${delay}s`,
    ...style,
  } as React.CSSProperties;
  return (
    <span className={`flying-bee motion-only ${className}`} style={vars} aria-hidden="true">
      <span className="flying-bee__x">
        <span className="flying-bee__y">
          <Bee size={size} />
        </span>
      </span>
    </span>
  );
}
