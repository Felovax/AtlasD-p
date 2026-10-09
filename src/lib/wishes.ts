import { isSupabaseConfigured, supabaseHeaders, supabaseUrl } from './supabaseConfig';
import { newSubmissionId } from './rsvp';

/**
 * Reservasjon av ønsker. Gjesten får en hemmelig kode som lagres i nettleseren,
 * slik at bare samme telefon/PC kan angre. Ingen ser hvem som har reservert hva.
 */

export type WishErrorKind = 'not_configured' | 'network' | 'rate_limited' | 'server';

export class WishError extends Error {
  constructor(public kind: WishErrorKind) {
    super(kind);
    this.name = 'WishError';
  }
}

export function wishErrorMessage(error: unknown): string {
  const kind = error instanceof WishError ? error.kind : 'server';
  switch (kind) {
    case 'not_configured':
      return 'Reservering er ikke helt klar ennå. Prøv igjen litt senere.';
    case 'network':
      return 'Vi fikk ikke kontakt. Sjekk nettforbindelsen og prøv igjen.';
    case 'rate_limited':
      return 'Mange reservasjoner på kort tid. Vent noen minutter og prøv igjen.';
    default:
      return 'Noe gikk galt. Prøv igjen om litt.';
  }
}

// ─── Kodene i nettleseren ─────────────────────────────────────────────────────
const STORAGE_KEY = 'atlas-onsker-v1';

function readTokens(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeTokens(tokens: Record<string, string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    /* Privat modus o.l.: reservasjonen virker, men kan ikke angres herfra. */
  }
}

/** Ønsker som er reservert fra denne nettleseren. */
export function myReservations(): Set<string> {
  return new Set(Object.keys(readTokens()));
}

// ─── Kall til databasen ───────────────────────────────────────────────────────
const mockEnabled = import.meta.env.DEV && import.meta.env.VITE_RSVP_MOCK === 'true';
const mockReserved = new Set<string>(['barnegrind']);
const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 600));

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new WishError('not_configured');
  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { ...supabaseHeaders(), 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new WishError('network');
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data === 'object' && data && 'message' in data ? String(data.message) : '';
    throw new WishError(message.includes('rate_limited') ? 'rate_limited' : 'server');
  }
  return data as T;
}

/** ID-ene til alle reserverte ønsker (fra alle gjester). */
export async function fetchReservedWishes(): Promise<Set<string>> {
  if (mockEnabled) {
    await mockDelay();
    return new Set([...mockReserved, ...myReservations()]);
  }
  const ids = await rpc<unknown>('reserved_wishes', {});
  return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
}

/** Reserverer et ønske. Gir 'already_reserved' hvis noen andre rakk det først. */
export async function reserveWish(wishId: string): Promise<'reserved' | 'already_reserved'> {
  const tokens = readTokens();
  const token = tokens[wishId] ?? newSubmissionId();
  let status: string;
  if (mockEnabled) {
    await mockDelay();
    status = mockReserved.has(wishId) ? 'already_reserved' : 'reserved';
  } else {
    status = (await rpc<{ status: string }>('reserve_wish', { p_wish_id: wishId, p_token: token })).status;
  }
  if (status === 'reserved') writeTokens({ ...tokens, [wishId]: token });
  return status === 'reserved' ? 'reserved' : 'already_reserved';
}

/** Angrer en reservasjon gjort fra denne nettleseren. */
export async function unreserveWish(wishId: string): Promise<boolean> {
  const tokens = readTokens();
  const token = tokens[wishId];
  if (!token) return false;
  let released: boolean;
  if (mockEnabled) {
    await mockDelay();
    released = true;
  } else {
    released = (await rpc<{ status: string }>('unreserve_wish', { p_wish_id: wishId, p_token: token })).status === 'released';
  }
  const rest = { ...tokens };
  delete rest[wishId];
  writeTokens(rest);
  return released;
}
