/**
 * Offentlige Supabase-innstillinger. Begge verdiene er laget for å ligge i nettleseren –
 * sikkerheten håndteres i databasen (Row Level Security + en egen innsendingsfunksjon).
 * Service role / secret key skal ALDRI inn her.
 */
export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
export const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''
).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * Nye «publishable keys» (sb_publishable_...) sendes kun i `apikey`-headeren.
 * Den eldre anon-nøkkelen er en JWT og sendes i tillegg som Bearer-token.
 */
export function supabaseHeaders(): Record<string, string> {
  const headers: Record<string, string> = { apikey: supabaseKey };
  if (supabaseKey.startsWith('eyJ')) headers.Authorization = `Bearer ${supabaseKey}`;
  return headers;
}
