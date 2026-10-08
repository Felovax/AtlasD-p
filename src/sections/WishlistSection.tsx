import { invitation, isPlaceholder, type WishItem } from '../config/invitation';
import { ChapterHeading, Ornament } from '../components/decor/Ornament';
import { FlyingBee } from '../components/decor/Bee';
import { Fill } from '../components/Fill';
import { Reveal } from '../components/Reveal';
import { tidy } from '../lib/format';
import honeypot from '../assets/illustrations/honeypot.webp';
import './WishlistSection.css';

export const WISHLIST_ID = 'onskeliste';

/** Hva ønskelisten inneholder akkurat nå, eller null hvis den er skrudd av / tom. */
export function wishlistContent(): { url: string | null; items: WishItem[]; missing: boolean } | null {
  const { enabled, url, items } = invitation.wishlist;
  if (!enabled) return null;
  const realUrl = url && !isPlaceholder(url) ? url : null;
  const missing = !realUrl && items.length === 0 && url !== null && isPlaceholder(url);
  if (!realUrl && items.length === 0 && !missing) return null;
  return { url: realUrl, items, missing };
}

export function WishlistSection() {
  const content = wishlistContent();
  if (!content) return null;
  const texts = invitation.texts.wishlist;
  const placeholder = invitation.wishlist.url;

  return (
    <section id={WISHLIST_ID} className="page wishlist" aria-labelledby="wishlist-heading">
      <div className="page__inner">
        <ChapterHeading number={5} title={texts.chapterTitle} />
        <Reveal variant="ink">
          <h2 id="wishlist-heading" className="section-heading">
            {texts.heading}
          </h2>
          <Ornament />
        </Reveal>

        <Reveal className="wishlist__intro">
          <div className="wishlist__pot" aria-hidden="true">
            <img src={honeypot} alt="" loading="lazy" width={420} height={448} />
            <FlyingBee size={24} style={{ top: '-22%', left: '-4%' }} rangeX={12} rangeY={8} duration={4.6} />
          </div>
          <p>{tidy(texts.body)}</p>
        </Reveal>

        {content.url && (
          <div className="wishlist__cta">
            <a className="btn btn--honey" href={content.url} target="_blank" rel="noopener noreferrer">
              <GiftIcon />
              {texts.button}
              <span className="visually-hidden"> (åpnes i en ny fane)</span>
            </a>
          </div>
        )}

        {content.items.length > 0 && (
          <ul className="wishlist__tags">
            {content.items.map((item, index) => (
              <li key={`${item.title}-${index}`} className="gift-tag">
                <span className="gift-tag__hole" aria-hidden="true" />
                <span className="gift-tag__title">{item.title}</span>
                {item.note && <span className="gift-tag__note">{item.note}</span>}
                {item.url && (
                  <a className="gift-tag__link" href={item.url} target="_blank" rel="noopener noreferrer">
                    Se ønsket<span className="visually-hidden">: {item.title} (åpnes i en ny fane)</span>
                    <span aria-hidden="true"> ↗</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        {content.missing && placeholder && (
          <p className="wishlist__missing">
            <Fill value={placeholder} />
          </p>
        )}
      </div>
    </section>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3.5" y="9" width="17" height="11.5" rx="1.5" />
      <path d="M2.5 9 H21.5 V12.5 H2.5 Z M12 9 V20.5" />
      <path d="M12 9 C 10 5 6.5 4.5 6.5 6.8 C 6.5 8.6 9.5 9 12 9 Z M12 9 C 14 5 17.5 4.5 17.5 6.8 C 17.5 8.6 14.5 9 12 9 Z" />
    </svg>
  );
}
