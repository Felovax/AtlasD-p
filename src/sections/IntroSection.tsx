import { m } from 'motion/react';
import { invitation } from '../config/invitation';
import { tidy } from '../lib/format';
import { ChapterHeading, Ornament } from '../components/decor/Ornament';
import { FlyingBee } from '../components/decor/Bee';
import { Photo } from '../components/Photo';
import { Reveal } from '../components/Reveal';
import piglet from '../assets/illustrations/piglet-peek.webp';
import washHoney from '../assets/illustrations/wash-honey.webp';
import './IntroSection.css';

export function IntroSection({ id }: { id: string }) {
  const { intro } = invitation.texts;
  const photo = invitation.photos.intro;

  return (
    <section id={id} className="page page--torn intro" aria-labelledby={`${id}-heading`}>
      <div className="page__inner">
        <ChapterHeading number={1} title={intro.chapterTitle} />
        <Reveal variant="ink">
          <h2 id={`${id}-heading`} className="section-heading" tabIndex={-1} data-focus-target>
            {intro.heading}
          </h2>
          <Ornament />
        </Reveal>

        <figure className="intro__figure">
          <img className="intro__wash" src={washHoney} alt="" aria-hidden="true" loading="lazy" />
          {/* Grisen kikker fram bak bildet når det kommer til syne */}
          <Reveal className="intro__photo-wrap">
            <Photo photo={photo} sizes="(min-width: 560px) 420px, 82vw" aspect="4 / 5" />
          </Reveal>
          <m.div className="intro__peek" aria-hidden="true" initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.5 }}>
            <m.img
              className="intro__piglet"
              src={piglet}
              alt=""
              loading="lazy"
              variants={{ hidden: { y: '105%' }, shown: { y: '0%' } }}
              transition={{ type: 'spring', stiffness: 110, damping: 12, delay: 0.8 }}
            />
          </m.div>
          <FlyingBee size={28} style={{ top: '18%', left: '-2%' }} rangeX={24} rangeY={40} duration={6} />
          <figcaption className="intro__caption">{tidy(photo.caption)}</figcaption>
        </figure>

        <Reveal delay={0.1}>
          <p className="intro__body">{intro.body}</p>
        </Reveal>
      </div>
    </section>
  );
}
