import { useRef, useState } from 'react';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { invitation } from '../config/invitation';
import { tidy } from '../lib/format';
import { FlyingBee } from '../components/decor/Bee';
import { FallingLeaves } from '../components/decor/Leaves';
import clouds from '../assets/illustrations/clouds.webp';
import hills from '../assets/illustrations/hills-far.webp';
import meadow from '../assets/illustrations/meadow-front.webp';
import treeLeft from '../assets/illustrations/tree-left.webp';
import treeRight from '../assets/illustrations/tree-right.webp';
import bear from '../assets/illustrations/bear-honey.webp';
import './Hero.css';

export function Hero({ nextSectionId }: { nextSectionId: string }) {
  const { hero } = invitation.texts;
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [hopping, setHopping] = useState(false);

  // Myk parallakse: lagene langt borte beveger seg saktere enn de nære.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const cloudsY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const hillsY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const parallax = !reduceMotion;

  const openInvitation = () => {
    const target = document.getElementById(nextSectionId);
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    const heading = target.querySelector<HTMLElement>('[data-focus-target]');
    heading?.focus({ preventScroll: true });
  };

  return (
    <header ref={ref} className="hero">
      <div className="hero__sky" aria-hidden="true" />
      <m.div className="hero__clouds-wrap" aria-hidden="true" style={parallax ? { y: cloudsY } : undefined}>
        <img className="hero__clouds" src={clouds} alt="" />
      </m.div>
      <m.img className="hero__hills" src={hills} alt="" aria-hidden="true" style={parallax ? { y: hillsY } : undefined} />
      <img className="hero__tree hero__tree--left" src={treeLeft} alt="" aria-hidden="true" fetchPriority="high" />
      <img className="hero__tree hero__tree--right" src={treeRight} alt="" aria-hidden="true" fetchPriority="high" />
      <img className="hero__meadow" src={meadow} alt="" aria-hidden="true" fetchPriority="high" />

      <FallingLeaves count={5} />
      <FlyingBee size={26} style={{ top: '58%', right: '20%' }} rangeX={22} rangeY={14} duration={5} delay={-1} />
      <FlyingBee size={30} style={{ top: '30%', left: '12%' }} rangeX={70} rangeY={30} duration={9} delay={-3} />

      <m.div className="hero__text" style={parallax ? { y: textY } : undefined}>
        <p className="hero__kicker">{tidy(hero.kicker)}</p>
        <h1 className="hero__title">
          <span className="hero__title-line">{hero.title}</span>
          <span className="hero__name">{invitation.childName}!</span>
        </h1>
        <button type="button" className="btn btn--honey hero__button" onClick={openInvitation}>
          {hero.button}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5 V19 M6 13 L12 19 L18 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </m.div>

      <div className="hero__bear-walk">
        <button
          type="button"
          className={`hero__bear ${hopping ? 'is-hopping' : ''}`}
          aria-label="Si hei til bjørnen"
          onClick={() => setHopping(true)}
          onAnimationEnd={(event) => {
            if (event.animationName === 'bear-hop') setHopping(false);
          }}
        >
          <img src={bear} alt="" width={640} height={768} fetchPriority="high" />
        </button>
        <FlyingBee size={22} className="hero__pot-bee" rangeX={26} rangeY={12} duration={4.2} />
      </div>
    </header>
  );
}
