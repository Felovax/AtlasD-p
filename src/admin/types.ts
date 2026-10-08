/** Én rad i tabellen public.rsvps (se supabase/migrations). */
export interface RsvpRow {
  id: string;
  primary_guest_name: string;
  secondary_guest_name: string | null;
  attending: boolean;
  guest_count: number;
  created_at: string;
}

export interface RsvpStats {
  attendingGuests: number;
  yesCount: number;
  noCount: number;
  total: number;
}

export function computeStats(rows: RsvpRow[]): RsvpStats {
  const yes = rows.filter((r) => r.attending);
  return {
    attendingGuests: yes.reduce((sum, r) => sum + r.guest_count, 0),
    yesCount: yes.length,
    noCount: rows.length - yes.length,
    total: rows.length,
  };
}

export function guestNames(row: RsvpRow): string {
  return [row.primary_guest_name, row.secondary_guest_name].filter(Boolean).join(' og ');
}

const timestampFormat = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Oslo',
});

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : timestampFormat.format(date);
}
