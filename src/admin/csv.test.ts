import { describe, expect, it } from 'vitest';
import { rowsToCsv } from './csv';
import { computeStats, type RsvpRow } from './types';

const rows: RsvpRow[] = [
  { id: '1', primary_guest_name: 'Kari Nordmann', secondary_guest_name: 'Ola Nordmann', attending: true, guest_count: 2, created_at: '2026-10-10T10:00:00Z' },
  { id: '2', primary_guest_name: 'Åse "Bestemor" Ødegård', secondary_guest_name: null, attending: true, guest_count: 1, created_at: '2026-10-11T10:00:00Z' },
  { id: '3', primary_guest_name: '=HYPERLINK("x")', secondary_guest_name: null, attending: false, guest_count: 0, created_at: '2026-10-12T10:00:00Z' },
];

describe('statistikk', () => {
  it('teller gjester og svar', () => {
    expect(computeStats(rows)).toEqual({ attendingGuests: 3, yesCount: 2, noCount: 1, total: 3 });
  });
});

describe('CSV-eksport', () => {
  const csv = rowsToCsv(rows);

  it('starter med BOM og bruker semikolon (norsk Excel)', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Svar";"Navn";"Navn person 2";"Antall som kommer";"Registrert"');
  });

  it('escaper anførselstegn og beholder æøå', () => {
    expect(csv).toContain('"Åse ""Bestemor"" Ødegård"');
  });

  it('nøytraliserer formler (CSV-injeksjon)', () => {
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
