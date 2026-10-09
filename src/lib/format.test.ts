import { describe, expect, it } from 'vitest';
import { countdownLabel, daysUntil, formatLongDate, formatShortDate, formatTime, parseLocalDate, tidy } from './format';
import { buildIcs } from './ics';
import { mapsLinkFor } from './maps';
import { fyllInn, invitation, missingConfig } from '../config/invitation';

describe('datoer og klokkeslett', () => {
  it('formaterer dåpsdatoen på norsk', () => {
    expect(formatLongDate('2026-11-08')).toBe('Søndag 8. november 2026');
    expect(formatShortDate('2026-11-08')).toBe('8. november');
  });

  it('skriver klokkeslett på norsk måte', () => {
    expect(formatTime('11:00')).toBe('kl. 11.00');
    expect(formatTime('9:30')).toBe('kl. 09.30');
  });

  it('avviser ugyldige datoer', () => {
    expect(parseLocalDate('2026-02-30')).toBeNull();
    expect(parseLocalDate('8. november')).toBeNull();
  });

  it('teller ned dager', () => {
    const now = new Date(2026, 9, 8, 22, 30); // 8. oktober 2026, sent på kvelden
    expect(daysUntil('2026-11-08', now)).toBe(31);
    expect(countdownLabel('2026-11-08', now)).toBe('Om 31 dager');
    expect(countdownLabel('2026-10-09', now)).toBe('I morgen!');
    expect(countdownLabel('2026-10-08', now)).toBe('I dag!');
    expect(countdownLabel('2026-10-01', now)).toBeNull();
  });
});

describe('tidy', () => {
  it('holder «…» og emoji sammen med ordet foran', () => {
    expect(tidy('Et lite eventyr begynner …')).toBe('Et lite eventyr begynner …');
    expect(tidy('… og sprell')).toBe('… og sprell');
    expect(tidy('Ja, jeg kommer! 🍯')).toBe('Ja, jeg kommer! 🍯');
  });
});

describe('kalenderfil (.ics)', () => {
  it('lager en gyldig avtale med riktig tidspunkt', () => {
    const ics = buildIcs(
      { title: 'Dåpen til Atlas', date: '2026-11-08', time: '11:00', durationMinutes: 60, location: 'Moen kirke, Jaren' },
      new Date('2026-10-08T12:00:00Z'),
    )!;
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261108T110000');
    expect(ics).toContain('DTEND:20261108T120000');
    expect(ics).toContain('SUMMARY:Dåpen til Atlas');
    expect(ics).toContain('LOCATION:Moen kirke\\, Jaren');
    expect(ics.includes('\r\n')).toBe(true);
  });

  it('gir null når dato eller tid mangler', () => {
    expect(buildIcs({ title: 'x', date: 'snart', time: '11:00', durationMinutes: 60 })).toBeNull();
  });
});

describe('Google Maps-lenker', () => {
  it('gir veibeskrivelse til mapsQuery når den finnes', () => {
    expect(mapsLinkFor({ name: 'Moen kirke', address: 'Jaren', mapsQuery: 'Moen kirke, Jaren' })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Moen%20kirke%2C%20Jaren',
    );
  });

  it('bruker nøyaktige koordinater når de er oppgitt', () => {
    expect(mapsLinkFor({ name: 'Moen bedehus', address: 'Moen', coordinates: { lat: 60.407818, lng: 10.568667 } })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=60.407818%2C10.568667',
    );
  });

  it('bruker navn + adresse, og hopper over plassholdere', () => {
    expect(mapsLinkFor({ name: 'Grendehuset', address: fyllInn('adresse') })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Grendehuset',
    );
    expect(mapsLinkFor({ name: fyllInn('sted'), address: fyllInn('adresse') })).toBeNull();
  });

  it('bruker en ferdig lenke når den er oppgitt', () => {
    expect(mapsLinkFor({ name: 'X', address: 'Y', mapsUrl: 'https://maps.app.goo.gl/abc' })).toBe('https://maps.app.goo.gl/abc');
  });
});

describe('konfigurasjonen', () => {
  it('har riktig dato, tid og kirke', () => {
    expect(invitation.event.date).toBe('2026-11-08');
    expect(invitation.event.time).toBe('11:00');
    expect(invitation.event.church.name).toBe('Moen kirke');
  });

  it('har feiringen i Moen bedehus og hilsen fra Erica og Matias', () => {
    expect(invitation.event.celebration.name).toBe('Moen bedehus');
    expect(invitation.event.celebrationTime).toBe('Rett etter gudstjenesten');
    expect(invitation.texts.closing.signature).toBe('Hilsen Erica og Matias');
  });

  it('har ingen plassholdere igjen', () => {
    expect(missingConfig()).toEqual([]);
  });
});
