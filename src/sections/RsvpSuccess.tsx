import { m } from 'motion/react';
import { invitation } from '../config/invitation';
import { Bee } from '../components/decor/Bee';
import { Leaf } from '../components/decor/Leaves';
import { useFocusOnMount } from '../hooks/useFocusOnMount';
import type { RsvpPayload } from '../lib/rsvp';
import { WISHLIST_ID, wishlistContent } from './WishlistSection';
import honeypot from '../assets/illustrations/honeypot.webp';

export function RsvpSuccess({ payload, onReset }: { payload: RsvpPayload; onReset: () => void }) {
  const texts = invitation.texts.rsvp;
  const ref = useFocusOnMount<HTMLDivElement>();
  const message = !payload.attending ? texts.successNo : payload.guestCount === 2 ? texts.successYesTwo : texts.successYes;
  const names = [payload.primaryName, payload.secondaryName].filter(Boolean).join(' og ');

  return (
    <m.div
      ref={ref}
      className={`rsvp__success ${payload.attending ? 'is-yes' : 'is-no'}`}
      tabIndex={-1}
      role="status"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="success-scene" aria-hidden="true">
        <m.img
          className="success-scene__pot"
          src={honeypot}
          alt=""
          initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 170, damping: 11, delay: 0.1 }}
        />
        <span className="success-scene__drip" />
        {payload.attending ? (
          <>
            <span className="success-scene__orbit success-scene__orbit--a">
              <Bee size={30} />
            </span>
            <span className="success-scene__orbit success-scene__orbit--b">
              <Bee size={24} />
            </span>
            <span className="success-scene__orbit success-scene__orbit--c">
              <Bee size={20} />
            </span>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`success-scene__heart success-scene__heart--${i}`}>
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path d="M12 21 C 5 15.5 2 12.5 2 8.5 C 2 5.5 4.3 3.5 7 3.5 C 9.2 3.5 10.8 4.8 12 6.6 C 13.2 4.8 14.8 3.5 17 3.5 C 19.7 3.5 22 5.5 22 8.5 C 22 12.5 19 15.5 12 21 Z" fill="#e8a79a" stroke="#4a3426" strokeWidth="1.4" />
                </svg>
              </span>
            ))}
          </>
        ) : (
          <>
            <span className="success-scene__orbit success-scene__orbit--a">
              <Bee size={26} />
            </span>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`success-scene__leaf success-scene__leaf--${i}`}>
                <Leaf size={22} color={['#c9a14a', '#8fab6a', '#d58f4e'][i]} />
              </span>
            ))}
          </>
        )}
      </div>

      <p className="rsvp__success-title">{message}</p>
      <p className="rsvp__success-names">
        {payload.attending ? 'Registrert som kommer: ' : 'Registrert som ikke kommer: '}
        <strong>{names}</strong>
      </p>
      <div className="rsvp__after">
        {payload.attending && wishlistContent() && (
          <a className="btn btn--small btn--leaf" href={`#${WISHLIST_ID}`}>
            Se ønskelisten
          </a>
        )}
        <button type="button" className="btn btn--small rsvp__again" onClick={onReset}>
          Send svar for flere
        </button>
      </div>
    </m.div>
  );
}
