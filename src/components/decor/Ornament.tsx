/** Liten håndtegnet skillelinje med en honningdråpe i midten. */
export function Ornament({ className = 'ornament' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 24" aria-hidden="true" focusable="false">
      <path d="M4 13 C 24 9 44 15 62 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M156 13 C 136 9 116 15 98 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M80 3 C 84 9 88 12 88 16 C 88 20.5 84.5 23 80 23 C 75.5 23 72 20.5 72 16 C 72 12 76 9 80 3 Z" fill="#eeb03a" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="68" cy="11.5" r="1.8" fill="currentColor" />
      <circle cx="92" cy="11.5" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function ChapterHeading({ number, title }: { number: number | string; title: string }) {
  return (
    <div className="chapter">
      <span className="chapter__number">{typeof number === 'number' ? `Kapittel ${number}` : number}</span>
      <span className="chapter__title">{title}</span>
    </div>
  );
}
