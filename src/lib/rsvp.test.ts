import { describe, expect, it } from 'vitest';
import { NAME_MAX_LENGTH, normalizeName, rsvpErrorMessage, RsvpError, validateRsvp, type RsvpDraft } from './rsvp';

const draft = (patch: Partial<RsvpDraft>): RsvpDraft => ({
  attending: null,
  guestCount: 1,
  primaryName: '',
  secondaryName: '',
  website: '',
  ...patch,
});

describe('normalizeName', () => {
  it('fjerner mellomrom i endene og slår sammen doble mellomrom', () => {
    expect(normalizeName('   Kari    Nordmann  ')).toBe('Kari Nordmann');
    expect(normalizeName('\tOla\n Nordmann ')).toBe('Ola Nordmann');
  });
});

describe('validateRsvp', () => {
  it('krever at gjesten velger ja eller nei', () => {
    const result = validateRsvp(draft({ primaryName: 'Kari' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.attending).toBe('Velg om du kommer eller ikke.');
  });

  it('krever navn – også når gjesten takker nei', () => {
    const result = validateRsvp(draft({ attending: 'no', primaryName: '    ' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.primaryName).toBe('Skriv inn navnet ditt.');
  });

  it('godtar ett navn for «ja, 1 person»', () => {
    const result = validateRsvp(draft({ attending: 'yes', primaryName: '  Kari  Nordmann ' }));
    expect(result).toEqual({
      ok: true,
      payload: { attending: true, guestCount: 1, primaryName: 'Kari Nordmann', secondaryName: null },
    });
  });

  it('krever navn på person nummer 2 når to kommer', () => {
    const result = validateRsvp(draft({ attending: 'yes', guestCount: 2, primaryName: 'Kari' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.secondaryName).toBe('Skriv inn navnet på person nummer 2.');
  });

  it('godtar to personer', () => {
    const result = validateRsvp(draft({ attending: 'yes', guestCount: 2, primaryName: 'Kari', secondaryName: 'Ola' }));
    expect(result.ok && result.payload).toEqual({ attending: true, guestCount: 2, primaryName: 'Kari', secondaryName: 'Ola' });
  });

  it('avviser samme navn to ganger', () => {
    const result = validateRsvp(draft({ attending: 'yes', guestCount: 2, primaryName: 'Kari', secondaryName: ' kari ' }));
    expect(result.ok).toBe(false);
  });

  it('ignorerer person nummer 2 når gjesten takker nei, og setter antall til 0', () => {
    const result = validateRsvp(draft({ attending: 'no', guestCount: 2, primaryName: 'Kari', secondaryName: 'Ola' }));
    expect(result.ok && result.payload).toEqual({ attending: false, guestCount: 0, primaryName: 'Kari', secondaryName: null });
  });

  it('har en øvre grense for lengden på navn', () => {
    const result = validateRsvp(draft({ attending: 'yes', primaryName: 'a'.repeat(NAME_MAX_LENGTH + 1) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.primaryName).toMatch(/80 tegn/);
  });

  it('krever minst én bokstav', () => {
    const result = validateRsvp(draft({ attending: 'yes', primaryName: '1234' }));
    expect(result.ok).toBe(false);
  });

  it('godtar norske bokstaver og bindestrek', () => {
    const result = validateRsvp(draft({ attending: 'yes', primaryName: 'Åse Ødegård-Æsøy' }));
    expect(result.ok).toBe(true);
  });
});

describe('rsvpErrorMessage', () => {
  it('gir vennlige norske meldinger', () => {
    expect(rsvpErrorMessage(new RsvpError('network'))).toMatch(/internett/);
    expect(rsvpErrorMessage(new RsvpError('rate_limited'))).toMatch(/Vent noen minutter/);
    expect(rsvpErrorMessage(new Error('ukjent'))).toMatch(/ikke registrert/);
  });
});
