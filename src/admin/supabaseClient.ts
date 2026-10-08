import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from '../lib/supabaseConfig';

/**
 * Supabase-klient for oversiktssiden. Bruker kun den offentlige nøkkelen –
 * tilgangen til svarene styres av databasen (RLS), basert på hvem som er logget inn.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'atlas-dap-admin',
      },
    })
  : null;
