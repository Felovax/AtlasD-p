import { invitation } from '../config/invitation';
import { Fill } from '../components/Fill';
import { Reveal } from '../components/Reveal';
import { FallingLeaves } from '../components/decor/Leaves';
import { Ornament } from '../components/decor/Ornament';
import closingHill from '../assets/illustrations/closing-hill.webp';
import './ClosingScene.css';

const fireflies = Array.from({ length: 9 }, (_, i) => ({
  left: `${8 + ((i * 41) % 84)}%`,
  top: `${38 + ((i * 23) % 40)}%`,
  delay: -((i * 1.7) % 6),
  duration: 5 + (i % 4),
}));

export function ClosingScene() {
  const { closing } = invitation.texts;
  return (
    <footer className="closing" aria-labelledby="closing-heading">
      <div className="closing__sky" aria-hidden="true">
        <span className="closing__sun" />
      </div>
      <FallingLeaves count={4} seed={3} />
      <div className="closing__fireflies motion-only" aria-hidden="true">
        {fireflies.map((f, i) => (
          <span
            key={i}
            className="firefly"
            style={{ left: f.left, top: f.top, animationDelay: `${f.delay}s`, animationDuration: `${f.duration}s` }}
          />
        ))}
      </div>

      <div className="closing__text">
        <Reveal variant="ink">
          <p className="closing__kicker">{'Og så\u00a0…'}</p>
          <h2 id="closing-heading" className="closing__heading">
            {closing.heading}
          </h2>
          <Ornament />
          <p className="closing__signature">
            <Fill value={closing.signature} />
          </p>
        </Reveal>
      </div>

      <img className="closing__hill" src={closingHill} alt="" aria-hidden="true" loading="lazy" width={1400} height={665} />
      <p className="closing__end" aria-hidden="true">
        ~ Slutt ~
      </p>
    </footer>
  );
}
