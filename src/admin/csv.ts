import { formatTimestamp, type RsvpRow } from './types';

/**
 * Beskytter mot «CSV-injeksjon»: celler som starter med = + - @ kan tolkes som formler
 * i Excel. Vi setter en apostrof foran slike verdier.
 */
function safeCell(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/**
 * Lager CSV med semikolon som skilletegn og UTF-8-BOM, slik at norsk Excel
 * åpner fila riktig (med æ, ø og å) ved dobbeltklikk.
 */
export function rowsToCsv(rows: RsvpRow[]): string {
  const header = ['Svar', 'Navn', 'Navn person 2', 'Antall som kommer', 'Registrert'];
  const lines = rows.map((row) =>
    [
      row.attending ? 'Kommer' : 'Kommer ikke',
      row.primary_guest_name,
      row.secondary_guest_name ?? '',
      String(row.guest_count),
      formatTimestamp(row.created_at),
    ]
      .map(safeCell)
      .join(';'),
  );
  return '﻿' + [header.map(safeCell).join(';'), ...lines].join('\r\n') + '\r\n';
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
