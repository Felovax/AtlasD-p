import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { invitation, isPlaceholder, type Place } from '../config/invitation';
import { ChapterHeading, Ornament } from '../components/decor/Ornament';
import { Fill } from '../components/Fill';
import { Reveal } from '../components/Reveal';
import { CakeIcon, CalendarAddIcon, CalendarIcon, ChurchIcon, ClockIcon, HoneyIcon, InfoIcon, MapIcon } from '../components/decor/Icons';
import { countdownLabel, formatLongDate, formatShortDate, formatTime, parseLocalDate, textOf } from '../lib/format';
import { mapsLinkFor } from '../lib/maps';
import { buildIcs, downloadIcs } from '../lib/ics';
import signpost from '../assets/illustrations/signpost.webp';
import donkey from '../assets/illustrations/donkey-sit.webp';
import './DetailsSection.css';

export function DetailsSection() {
  const { event } = invitation;
  const { details } = invitation.texts;
  const date = textOf(event.date);
  const time = textOf(event.time);
  const countdown = date ? countdownLabel(date) : null;
  const deadline = textOf(event.rsvpDeadline);
  const deadlineIsDate = deadline ? parseLocalDate(deadline) !== null : false;

  const addToCalendar = () => {
    if (!date || !time) return;
    const churchName = textOf(event.church.name);
    const churchAddress = textOf(event.church.address);
    const ics = buildIcs({
      title: `Dåpen til ${invitation.childName}`,
      date,
      time,
      durationMinutes: event.calendarDurationMinutes,
      location: [churchName, churchAddress].filter(Boolean).join(', '),
      description: [invitation.texts.shareTitle, celebrationLine(), window.location.href.split('#')[0]].filter(Boolean).join('\n'),
      url: window.location.href.split('#')[0],
    });
    if (ics) downloadIcs(`daapen-til-${invitation.childName.toLowerCase()}.ics`, ics);
  };

  return (
    <section className="page details" aria-labelledby="details-heading">
      <div className="page__inner">
        <ChapterHeading number={3} title={details.chapterTitle} />
        <Reveal variant="ink">
          <h2 id="details-heading" className="section-heading">
            {details.heading}
          </h2>
          <Ornament />
        </Reveal>

        <m.img
          className="details__signpost"
          src={signpost}
          alt=""
          aria-hidden="true"
          loading="lazy"
          initial={{ rotate: -8, y: 30, opacity: 0 }}
          whileInView={{ rotate: 0, y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: 'spring', stiffness: 90, damping: 10 }}
        />

        <Reveal className="details__card-wrap">
          <div className="details__card">
            <ul className="details__list">
              <InfoRow icon={<CalendarIcon />} label="Dato">
                <span className="details__big">
                  <Fill value={event.date} format={formatLongDate} />
                </span>
                {countdown && <span className="details__badge">{countdown}</span>}
              </InfoRow>

              <InfoRow icon={<ClockIcon />} label="Klokkeslett">
                <span className="details__big">
                  <Fill value={event.time} format={formatTime} />
                </span>
              </InfoRow>

              <PlaceRow icon={<ChurchIcon />} label="Dåpen" place={event.church} />

              <PlaceRow icon={<CakeIcon />} label="Feiringen" place={event.celebration}>
                <span className="details__note">
                  <Fill value={event.celebrationTime} />
                </span>
              </PlaceRow>

              <InfoRow icon={<HoneyIcon />} label="Svarfrist">
                {deadline && deadlineIsDate ? (
                  <span>
                    Gi beskjed innen <strong>{formatShortDate(deadline)}</strong>
                  </span>
                ) : deadline ? (
                  <span>{deadline}</span>
                ) : (
                  <Fill value={event.rsvpDeadline} />
                )}
              </InfoRow>

              {event.practicalInfo.length > 0 && (
                <InfoRow icon={<InfoIcon />} label="Praktisk informasjon">
                  <ul className="details__practical">
                    {event.practicalInfo.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </InfoRow>
              )}
            </ul>

            {date && time && (
              <div className="details__calendar">
                <button type="button" className="btn btn--leaf btn--small" onClick={addToCalendar}>
                  <CalendarAddIcon />
                  Legg til i kalenderen
                </button>
              </div>
            )}
          </div>
          <img className="details__donkey" src={donkey} alt="" aria-hidden="true" loading="lazy" width={460} height={487} />
        </Reveal>
      </div>
    </section>
  );
}

/** «Feiring: Moen bedehus, rett etter gudstjenesten» – til kalenderavtalen. */
function celebrationLine(): string | null {
  const name = textOf(invitation.event.celebration.name);
  const when = textOf(invitation.event.celebrationTime);
  if (!name) return null;
  return when ? `Feiring: ${name}, ${when.charAt(0).toLocaleLowerCase('nb-NO')}${when.slice(1)}` : `Feiring: ${name}`;
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="details__row">
      <div className="details__icon">{icon}</div>
      <div className="details__content">
        <h3 className="details__label">{label}</h3>
        <div className="details__value">{children}</div>
      </div>
    </li>
  );
}

function PlaceRow({ icon, label, place, children }: { icon: ReactNode; label: string; place: Place; children?: ReactNode }) {
  const link = mapsLinkFor(place);
  const name = isPlaceholder(place.name) ? 'stedet' : place.name;
  return (
    <InfoRow icon={icon} label={label}>
      <span className="details__big">
        <Fill value={place.name} />
      </span>
      <span className="details__address">
        <Fill value={place.address} />
      </span>
      {children}
      {link && (
        <a className="btn btn--small details__maps" href={link} target="_blank" rel="noopener noreferrer" aria-label={`Se veibeskrivelse til ${name} (åpner Google Maps)`}>
          <MapIcon />
          Se veibeskrivelse
        </a>
      )}
    </InfoRow>
  );
}
