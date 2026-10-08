import { parseLocalDate } from './format';

export interface CalendarEvent {
  title: string;
  date: string; // ÅÅÅÅ-MM-DD
  time: string; // TT:MM
  durationMinutes: number;
  location?: string;
  description?: string;
  url?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

/** Escaping etter RFC 5545. */
const esc = (text: string) => text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/**
 * Lager en .ics-kalenderfil. Tidspunktet skrives som «flytende» lokal tid, som
 * betyr at kalenderen tolker kl. 11.00 som kl. 11.00 der gjesten er (Norge).
 */
export function buildIcs(event: CalendarEvent, now: Date = new Date()): string | null {
  const day = parseLocalDate(event.date);
  const time = /^(\d{1,2}):(\d{2})$/.exec(event.time);
  if (!day || !time) return null;
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(time[1]), Number(time[2]));
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  const utc = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atlas daap//Invitasjon//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${stamp(start)}-atlas-daap@invitasjon`,
    `DTSTAMP:${utc}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(event.title)}`,
    event.location ? `LOCATION:${esc(event.location)}` : '',
    event.description ? `DESCRIPTION:${esc(event.description)}` : '',
    event.url ? `URL:${event.url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n') + '\r\n';
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
