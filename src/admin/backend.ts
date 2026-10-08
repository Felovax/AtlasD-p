import type { RsvpRow } from './types';
import { supabase } from './supabaseClient';

/** Det oversiktssiden trenger fra databasen. */
export interface AdminBackend {
  currentUserEmail(): Promise<string | null>;
  onAuthChange(callback: (email: string | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  isAdmin(): Promise<boolean>;
  listRsvps(): Promise<RsvpRow[]>;
  deleteRsvp(id: string): Promise<void>;
  isDemo: boolean;
}

export class AdminError extends Error {
  constructor(
    public kind: 'invalid_login' | 'network' | 'forbidden' | 'unknown',
    message?: string,
  ) {
    super(message ?? kind);
  }
}

function mapAuthError(error: { message?: string; status?: number } | null): AdminError {
  const message = error?.message ?? '';
  if (/invalid login credentials/i.test(message) || error?.status === 400) return new AdminError('invalid_login', message);
  if (/fetch|network/i.test(message)) return new AdminError('network', message);
  return new AdminError('unknown', message);
}

export const supabaseBackend: AdminBackend | null = supabase
  ? {
      isDemo: false,
      async currentUserEmail() {
        const { data } = await supabase!.auth.getSession();
        return data.session?.user.email ?? null;
      },
      onAuthChange(callback) {
        const { data } = supabase!.auth.onAuthStateChange((_event, session) => callback(session?.user.email ?? null));
        return () => data.subscription.unsubscribe();
      },
      async signIn(email, password) {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw mapAuthError(error);
      },
      async signOut() {
        await supabase!.auth.signOut();
      },
      async isAdmin() {
        const { data, error } = await supabase!.rpc('is_admin');
        if (error) throw new AdminError(/fetch/i.test(error.message) ? 'network' : 'unknown', error.message);
        return data === true;
      },
      async listRsvps() {
        const { data, error } = await supabase!
          .from('rsvps')
          .select('id, primary_guest_name, secondary_guest_name, attending, guest_count, created_at')
          .order('created_at', { ascending: false });
        if (error) throw new AdminError(/fetch/i.test(error.message) ? 'network' : 'unknown', error.message);
        return (data ?? []) as RsvpRow[];
      },
      async deleteRsvp(id) {
        const { error, count } = await supabase!.from('rsvps').delete({ count: 'exact' }).eq('id', id);
        if (error) throw new AdminError('unknown', error.message);
        if (count === 0) throw new AdminError('forbidden', 'Svaret ble ikke slettet (mangler tilgang?)');
      },
    }
  : null;

/**
 * DEMO – kun under utvikling (npm run dev, og adressen slutter på ?demo).
 * Viser hvordan oversikten ser ut, med tydelig falske testnavn. Ingenting lagres.
 */
export function createDemoBackend(): AdminBackend {
  let email: string | null = null;
  const listeners = new Set<(email: string | null) => void>();
  const now = Date.now();
  let rows: RsvpRow[] = [
    { id: 'd1', primary_guest_name: 'Testperson Én', secondary_guest_name: 'Testperson To', attending: true, guest_count: 2, created_at: new Date(now - 36e5).toISOString() },
    { id: 'd2', primary_guest_name: 'Testperson Tre', secondary_guest_name: null, attending: true, guest_count: 1, created_at: new Date(now - 864e5).toISOString() },
    { id: 'd3', primary_guest_name: 'Testperson Fire', secondary_guest_name: null, attending: false, guest_count: 0, created_at: new Date(now - 2 * 864e5).toISOString() },
    { id: 'd4', primary_guest_name: '=Formeltest', secondary_guest_name: null, attending: true, guest_count: 1, created_at: new Date(now - 3 * 864e5).toISOString() },
  ];
  const emit = () => listeners.forEach((l) => l(email));
  const wait = () => new Promise((r) => setTimeout(r, 350));
  return {
    isDemo: true,
    async currentUserEmail() {
      return email;
    },
    onAuthChange(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    async signIn(e) {
      await wait();
      email = e || 'demo@eksempel.no';
      emit();
    },
    async signOut() {
      email = null;
      emit();
    },
    async isAdmin() {
      return true;
    },
    async listRsvps() {
      await wait();
      return [...rows];
    },
    async deleteRsvp(id) {
      await wait();
      rows = rows.filter((r) => r.id !== id);
    },
  };
}
