import { missingConfig } from '../config/invitation';
import { isSupabaseConfigured } from '../lib/supabaseConfig';

/** Vises kun under utvikling (npm run dev): hva som mangler før invitasjonen kan sendes ut. */
export function DevBanner() {
  const missing = missingConfig();
  const mock = import.meta.env.VITE_RSVP_MOCK === 'true';
  if (missing.length === 0 && isSupabaseConfigured && !mock) return null;
  const count = missing.length + (isSupabaseConfigured ? 0 : 1) + (mock ? 1 : 0);
  return (
    <details className="dev-banner">
      <summary>
        <strong>Under utvikling:</strong> {count} ting å ordne før invitasjonen sendes ut (trykk for liste)
      </summary>
      <ul>
        {missing.map((item) => (
          <li key={item}>Fyll inn «{item}» i src/config/invitation.ts</li>
        ))}
        {!isSupabaseConfigured && <li>Sett VITE_SUPABASE_URL og VITE_SUPABASE_PUBLISHABLE_KEY (se README)</li>}
        {mock && <li>VITE_RSVP_MOCK=true – svar blir bare simulert, ikke lagret</li>}
      </ul>
    </details>
  );
}
