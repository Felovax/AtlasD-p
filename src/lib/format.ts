import { isPlaceholder, type Fillable } from '../config/invitation';

/** Parser «ÅÅÅÅ-MM-DD» som en lokal dato (uten tidssone-forskyvning). */
export function parseLocalDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('nb-NO') + text.slice(1);

/** «Søndag 8. november 2026» */
export function formatLongDate(iso: string): string {
  const date = parseLocalDate(iso);
  if (!date) return iso;
  return capitalize(
    new Intl.DateTimeFormat('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date),
  );
}

/** «8. november» */
export function formatShortDate(iso: string): string {
  const date = parseLocalDate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long' }).format(date);
}

/** «11:00» → «kl. 11.00» (norsk skrivemåte). */
export function formatTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  return `kl. ${match[1].padStart(2, '0')}.${match[2]}`;
}

/** Antall hele dager fra i dag til datoen (0 = i dag, negativ = passert). */
export function daysUntil(iso: string, now: Date = new Date()): number | null {
  const date = parseLocalDate(iso);
  if (!date) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

export function countdownLabel(iso: string, now?: Date): string | null {
  const days = daysUntil(iso, now);
  if (days === null || days < 0) return null;
  if (days === 0) return 'I dag!';
  if (days === 1) return 'I morgen!';
  return `Om ${days} dager`;
}

/** Tekst for en verdi som kanskje ikke er fylt inn ennå. */
export function textOf(value: Fillable<string>): string | null {
  return isPlaceholder(value) ? null : value;
}

/**
 * Små typografiske forbedringer: hindrer at «…» eller en emoji havner alene på en ny linje
 * på smale skjermer (bytter vanlig mellomrom med hardt mellomrom).
 */
export function tidy(text: string): string {
  return text
    .replace(/\s+…/g, '\u00a0…')
    .replace(/…\s+/g, '…\u00a0')
    .replace(/\s+(\p{Extended_Pictographic})/gu, '\u00a0$1');
}
