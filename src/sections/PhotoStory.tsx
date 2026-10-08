import { useState } from 'react';
import { m } from 'motion/react';
import { invitation } from '../config/invitation';
import { tidy } from '../lib/format';
import { ChapterHeading, Ornament } from '../components/decor/Ornament';
import { Bee } from '../components/decor/Bee';
import { Photo } from '../components/Photo';
import { Reveal } from '../components/Reveal';
import tiger from '../assets/illustrations/tiger-bounce.webp';
import './PhotoStory.css';

const tilt = [-2.2, 1.8, -1.4, 2];

export function PhotoStory() {
  const { story } = invitation.texts;
  const photos = invitation.photos.story;
  const [bouncing, setBouncing] = useState(false);

  return (
    <section className="page story" aria-labelledby="story-heading">
      <div className="page__inner">
        <ChapterHeading number={2} title={story.chapterTitle} />
        <Reveal variant="ink">
          <h2 id="story-heading" className="section-heading">
            {tidy(story.heading)}
          </h2>
          <Ornament />
        </Reveal>

        <ol className="story__pages">
          {photos.map((photo, index) => (
            <li key={photo.id} className={`story__item story__item--${index % 2 === 0 ? 'left' : 'right'}`}>
              {index > 0 && <BeePath flip={index % 2 === 0} />}
              {/* Hver side «blas» fram som i en bok når den kommer inn på skjermen */}
              <m.figure
                className="story__page"
                style={{ rotate: tilt[index % tilt.length] }}
                initial={{ opacity: 0, rotateY: index % 2 === 0 ? -70 : 70 }}
                whileInView={{ opacity: 1, rotateY: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="story__paper">
                  <div className="story__photo">
                    <Photo photo={photo} sizes="(min-width: 560px) 320px, 66vw" aspect="4 / 5" edge="none" />
                    <span className="story__corner story__corner--tl" aria-hidden="true" />
                    <span className="story__corner story__corner--tr" aria-hidden="true" />
                    <span className="story__corner story__corner--bl" aria-hidden="true" />
                    <span className="story__corner story__corner--br" aria-hidden="true" />
                  </div>
                  <figcaption className="story__caption">{tidy(photo.caption)}</figcaption>
                  <span className="story__folio" aria-hidden="true">
                    – {index + 1} –
                  </span>
                </div>
              </m.figure>
            </li>
          ))}
        </ol>

        <div className="story__tiger">
          <button
            type="button"
            className={`story__tiger-button ${bouncing ? 'is-bouncing' : ''}`}
            aria-label="Få tigeren til å hoppe"
            onClick={() => setBouncing(true)}
            onAnimationEnd={(event) => {
              if (event.animationName === 'tiger-big-bounce') setBouncing(false);
            }}
          >
            <img src={tiger} alt="" loading="lazy" width={420} height={588} />
          </button>
          <span className="story__tiger-shadow" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/** Stiplet flyrute med en bie mellom to boksider. */
function BeePath({ flip }: { flip: boolean }) {
  return (
    <div className={`story__bee-path ${flip ? 'is-flipped' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 200 90" preserveAspectRatio="none">
        <m.path
          d="M30 4 C 10 40 70 56 100 40 C 130 24 170 40 170 86"
          fill="none"
          stroke="#b8761a"
          strokeWidth="2"
          strokeDasharray="2 7"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="story__bee">
        <Bee size={30} flip={flip} />
      </span>
    </div>
  );
}
