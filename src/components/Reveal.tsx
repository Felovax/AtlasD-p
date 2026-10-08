import { m } from 'motion/react';
import type { ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  delay?: number;
  /** «rise» = glir opp, «ink» = trer fram som blekk på papir */
  variant?: 'rise' | 'ink';
  className?: string;
}

/** Lar innhold gli rolig fram når det kommer inn på skjermen (én gang). */
export function Reveal({ children, delay = 0, variant = 'rise', className }: RevealProps) {
  const hidden = variant === 'ink' ? { opacity: 0, y: 10, filter: 'blur(6px)' } : { opacity: 0, y: 28 };
  const shown = variant === 'ink' ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 1, y: 0 };
  return (
    <m.div
      className={className}
      initial={hidden}
      whileInView={shown}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: variant === 'ink' ? 1.1 : 0.85, delay, ease }}
    >
      {children}
    </m.div>
  );
}
