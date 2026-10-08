import { isSupabaseConfigured, supabaseHeaders, supabaseUrl } from './supabaseConfig';

export const NAME_MAX_LENGTH = 80;
export const NAME_MIN_LENGTH = 2;

export type Attendance = 'yes' | 'no';

export interface RsvpDraft {
  attending: Attendance | null;
  guestCount: 1 | 2;
  primaryName: string;
  secondaryName: string;
  /** Skjult felt som bare roboter fyller ut. */
  website: string;
}

export interface RsvpPayload {
  attending: boolean;
  guestCount: 0 | 1 | 2;
  primaryName: string;
  secondaryName: string | null;
}

export type RsvpField = 'attending' | 'primaryName' | 'secondaryName';
export type FieldErrors = Partial<Record<RsvpField, string>>;

/** Fjerner mellomrom i starten og slutten, og slår sammen doble mellomrom. */
export function normalizeName(name: string): string {
  return name.normalize('NFC').replace(/\s+/g, ' ').trim();
}

function checkName(name: string, emptyMessage: string): string | undefined {
  if (!name) return emptyMessage;
  if (name.length < NAME_MIN_LENGTH) return 'Skriv gjerne hele navnet.';
  if (name.length > NAME_MAX_LENGTH) return `Navnet kan ikke være lengre enn ${NAME_MAX_LENGTH} tegn.`;
  if (!/\p{L}/u.test(name)) return 'Navnet må inneholde bokstaver.';
  return undefined;
}

export type ValidationResult = { ok: true; payload: RsvpPayload } | { ok: false; errors: FieldErrors };

export function validateRsvp(draft: RsvpDraft): ValidationResult {
  const errors: FieldErrors = {};
  const primaryName = normalizeName(draft.primaryName);
  const secondaryName = normalizeName(draft.secondaryName);

  if (draft.attending === null) errors.attending = 'Velg om du kommer eller ikke.';

  const primaryError = checkName(primaryName, 'Skriv inn navnet ditt.');
  if (primaryError) errors.primaryName = primaryError;

  const two = draft.attending === 'yes' && draft.guestCount === 2;
  if (two) {
    const secondaryError = checkName(secondaryName, 'Skriv inn navnet på person nummer 2.');
    if (secondaryError) errors.secondaryName = secondaryError;
    else if (!primaryError && primaryName.toLocaleLowerCase('nb-NO') === secondaryName.toLocaleLowerCase('nb-NO')) {
      errors.secondaryName = 'Person nummer 2 må ha et annet navn enn person nummer 1.';
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const attending = draft.attending === 'yes';
  return {
    ok: true,
    payload: {
      attending,
      guestCount: attending ? (two ? 2 : 1) : 0,
      primaryName,
      secondaryName: two ? secondaryName : null,
    },
  };
}

export type RsvpErrorKind = 'not_configured' | 'network' | 'timeout' | 'rate_limited' | 'invalid' | 'server';

export class RsvpError extends Error {
  constructor(
    public kind: RsvpErrorKind,
    message?: string,
  ) {
    super(message ?? kind);
    this.name = 'RsvpError';
  }
}

/** Vennlige feilmeldinger til gjesten. */
export function rsvpErrorMessage(error: unknown): string {
  const kind = error instanceof RsvpError ? error.kind : 'server';
  switch (kind) {
    case 'not_configured':
      return 'Påmeldingen er ikke helt klar ennå. Prøv igjen litt senere, eller gi beskjed direkte til foreldrene.';
    case 'network':
      return 'Vi fikk ikke kontakt. Sjekk at du er koblet til internett, og prøv igjen.';
    case 'timeout':
      return 'Det tok for lang tid å sende svaret. Sjekk nettforbindelsen og prøv igjen.';
    case 'rate_limited':
      return 'Det er sendt mange svar fra denne enheten på kort tid. Vent noen minutter og prøv igjen.';
    case 'invalid':
      return 'Noe i skjemaet ble ikke godtatt. Sjekk navnene og prøv igjen.';
    default:
      return 'Oi, noe gikk galt hos oss. Prøv igjen om litt – svaret ditt ble ikke registrert.';
  }
}

export interface SubmitOptions {
  /** Unik ID for denne innsendingen. Gjenbrukes ved nytt forsøk, slik at svaret aldri lagres to ganger. */
  submissionId: string;
  /** Honningkrukke-felt (skjult). */
  website?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const mockEnabled = import.meta.env.DEV && import.meta.env.VITE_RSVP_MOCK === 'true';

/**
 * Sender svaret til databasen via funksjonen `submit_rsvp` (se supabase/migrations).
 * Løses først når databasen har bekreftet at svaret er lagret.
 */
export async function submitRsvp(payload: RsvpPayload, options: SubmitOptions): Promise<{ id: string }> {
  if (mockEnabled) return mockSubmit(payload, options);
  if (!isSupabaseConfigured) throw new RsvpError('not_configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
  options.signal?.addEventListener('abort', () => controller.abort());

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_rsvp`, {
      method: 'POST',
      headers: { ...supabaseHeaders(), 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        p_id: options.submissionId,
        p_attending: payload.attending,
        p_guest_count: payload.guestCount,
        p_primary_name: payload.primaryName,
        p_secondary_name: payload.secondaryName,
        p_website: options.website ?? '',
      }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new RsvpError(controller.signal.aborted ? 'timeout' : 'network', String(error));
  } finally {
    clearTimeout(timeout);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* tom eller ugyldig respons håndteres under */
  }

  if (!response.ok) {
    const message = typeof body === 'object' && body && 'message' in body ? String(body.message) : '';
    if (message.includes('rate_limited') || response.status === 429) throw new RsvpError('rate_limited', message);
    if (message.startsWith('invalid')) throw new RsvpError('invalid', message);
    throw new RsvpError('server', `${response.status} ${message}`);
  }

  if (typeof body === 'object' && body && 'id' in body && typeof body.id === 'string') {
    return { id: body.id };
  }
  throw new RsvpError('server', 'Uventet svar fra databasen');
}

async function mockSubmit(payload: RsvpPayload, options: SubmitOptions): Promise<{ id: string }> {
  console.info('[RSVP-test] Simulerer innsending (VITE_RSVP_MOCK=true) – ingenting blir lagret.', payload);
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (payload.primaryName.toLowerCase().includes('nettfeil')) throw new RsvpError('network');
  if (payload.primaryName.toLowerCase().includes('serverfeil')) throw new RsvpError('server');
  return { id: options.submissionId };
}

export function newSubmissionId(): string {
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  // Reserve for eldre nettlesere (RFC 4122 v4)
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
