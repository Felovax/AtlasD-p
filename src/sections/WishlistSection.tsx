import { useCallback, useEffect, useState } from 'react';
import { invitation, isPlaceholder, type WishItem } from '../config/invitation';
import { ChapterHeading, Ornament } from '../components/decor/Ornament';
import { FlyingBee } from '../components/decor/Bee';
import { Fill } from '../components/Fill';
import { Reveal } from '../components/Reveal';
import { tidy } from '../lib/format';
import { fetchReservedWishes, myReservations, reserveWish, unreserveWish, wishErrorMessage } from '../lib/wishes';
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

        {content.items.length > 0 && <WishItems items={content.items} hint={texts.reserveHint} />}

        {content.missing && placeholder && (
          <p className="wishlist__missing">
            <Fill value={placeholder} />
          </p>
        )}
      </div>
    </section>
  );
}

type ItemMessage = { id: string; text: string; tone: 'info' | 'error' };

function WishItems({ items, hint }: { items: WishItem[]; hint: string }) {
  const [reserved, setReserved] = useState<Set<string> | null>(null);
  const [mine, setMine] = useState<Set<string>>(() => myReservations());
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<ItemMessage | null>(null);

  const refresh = useCallback(async () => {
    try {
      const ids = await fetchReservedWishes();
      setReserved(ids);
      setLoadFailed(false);
      // Rydd bort «mine» som ikke lenger er reservert (f.eks. fjernet av foreldrene).
      setMine((current) => new Set([...current].filter((id) => ids.has(id))));
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = async (item: WishItem) => {
    if (busy || !reserved) return;
    const isMine = mine.has(item.id);
    const takenByOther = reserved.has(item.id) && !isMine;
    if (takenByOther) return;

    const question = isMine
      ? `Vil du angre reservasjonen av «${item.title}»?\n\nDa kan andre gjester reservere den igjen.`
      : `Vil du reservere «${item.title}»?\n\nDa ser de andre gjestene at gaven er tatt. Ingen får vite at det var deg.`;
    if (!window.confirm(question)) return;

    setBusy(item.id);
    setMessage(null);
    try {
      if (isMine) {
        await unreserveWish(item.id);
        setMine((current) => new Set([...current].filter((id) => id !== item.id)));
        setMessage({ id: item.id, text: 'Reservasjonen er angret.', tone: 'info' });
      } else {
        const result = await reserveWish(item.id);
        if (result === 'reserved') {
          setMine((current) => new Set(current).add(item.id));
        } else {
          setMessage({ id: item.id, text: 'Noen rakk å reservere denne rett før deg.', tone: 'info' });
        }
      }
      await refresh();
    } catch (error) {
      setMessage({ id: item.id, text: wishErrorMessage(error), tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="wishlist__hint">
        <span className="wishlist__hint-box" aria-hidden="true">
          <CheckIcon />
        </span>
        <p>{tidy(hint)}</p>
      </div>

      {loadFailed && (
        <p className="wishlist__load-error" role="status">
          Reservering er ikke tilgjengelig akkurat nå. Last siden inn på nytt litt senere.
        </p>
      )}

      <ul className="wishlist__tags">
        {items.map((item) => {
          const isMine = mine.has(item.id);
          const isReserved = reserved?.has(item.id) ?? false;
          const takenByOther = isReserved && !isMine;
          const statusId = `wish-${item.id}-status`;
          const itemMessage = message?.id === item.id ? message : null;
          const links = item.links ?? (item.url ? [{ label: 'Se gaven', url: item.url }] : []);

          return (
            <li key={item.id} className={`gift-tag ${isMine ? 'is-mine' : ''} ${takenByOther ? 'is-taken' : ''}`}>
              <label className="gift-tag__check">
                <input
                  type="checkbox"
                  checked={isReserved}
                  disabled={!reserved || takenByOther || busy === item.id}
                  onChange={() => void toggle(item)}
                  aria-describedby={statusId}
                />
                <span className="gift-tag__box" aria-hidden="true">
                  {busy === item.id ? <span className="gift-tag__spinner" /> : <CheckIcon />}
                </span>
                <span className="gift-tag__check-text" aria-hidden="true">
                  {isMine ? 'Din' : takenByOther ? 'Tatt' : 'Reserver'}
                </span>
                <span className="visually-hidden">
                  {isMine ? `Angre reservasjon av ${item.title}` : takenByOther ? `${item.title} er reservert` : `Reserver ${item.title}`}
                </span>
              </label>

              <div className="gift-tag__body">
                <span className="gift-tag__title">{item.title}</span>
                {item.note && <span className="gift-tag__note">{item.note}</span>}
                {links.length > 0 && (
                  <span className="gift-tag__links">
                    {links.map((link) => (
                      <a key={link.url} className="gift-tag__link" href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.label}
                        <span className="visually-hidden">: {item.title} (åpnes i en ny fane)</span>
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    ))}
                  </span>
                )}
                <span id={statusId} className={`gift-tag__status ${itemMessage?.tone === 'error' ? 'is-error' : ''}`} aria-live="polite">
                  {itemMessage
                    ? itemMessage.text
                    : isMine
                      ? 'Du har reservert denne – tusen takk! Trykk på ruten for å angre.'
                      : takenByOther
                        ? 'Reservert av en gjest'
                        : ''}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
