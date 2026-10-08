import { useEffect, useMemo, useState } from 'react';
import { createDemoBackend, supabaseBackend, type AdminBackend } from './backend';
import { Login } from './Login';
import { Dashboard } from './Dashboard';

type View = { kind: 'loading' } | { kind: 'login' } | { kind: 'checking'; email: string } | { kind: 'forbidden'; email: string } | { kind: 'ready'; email: string } | { kind: 'error'; message: string };

function pickBackend(): AdminBackend | null {
  const wantsDemo = import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo');
  return wantsDemo ? createDemoBackend() : supabaseBackend;
}

export function AdminApp() {
  const backend = useMemo(pickBackend, []);
  const [view, setView] = useState<View>({ kind: 'loading' });

  useEffect(() => {
    if (!backend) return;
    let cancelled = false;
    // Hvilken bruker vi sist sjekket – så vi ikke sjekker på nytt ved hver token-fornyelse.
    let resolvedEmail: string | null | undefined;

    const resolve = async (email: string | null) => {
      if (cancelled || email === resolvedEmail) return;
      resolvedEmail = email;
      if (!email) return setView({ kind: 'login' });
      setView({ kind: 'checking', email });
      try {
        const admin = await backend.isAdmin();
        if (!cancelled) setView(admin ? { kind: 'ready', email } : { kind: 'forbidden', email });
      } catch {
        if (!cancelled) setView({ kind: 'error', message: 'Fikk ikke kontakt med databasen. Sjekk nettforbindelsen og last inn siden på nytt.' });
      }
    };

    backend.currentUserEmail().then(resolve);
    // Supabase anbefaler å ikke kalle databasen direkte inne i auth-lytteren (kan låse seg),
    // så vi utsetter sjekken til neste tick.
    const unsubscribe = backend.onAuthChange((email) => {
      setTimeout(() => void resolve(email), 0);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [backend]);

  if (!backend) {
    return (
      <Shell>
        <div className="admin-card">
          <h1>Oversikten er ikke satt opp ennå</h1>
          <p>
            Nettsiden mangler tilkobling til Supabase. Sett <code>VITE_SUPABASE_URL</code> og <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> (se README, «Supabase»).
          </p>
          {import.meta.env.DEV && (
            <p>
              Vil du bare se hvordan oversikten ser ut? Åpne <a href="?demo">demo-visningen</a> med falske testdata.
            </p>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell demo={backend.isDemo}>
      {view.kind === 'loading' || view.kind === 'checking' ? (
        <p className="admin-muted" role="status">
          Laster …
        </p>
      ) : view.kind === 'login' ? (
        <Login backend={backend} />
      ) : view.kind === 'forbidden' ? (
        <div className="admin-card">
          <h1>Ingen tilgang</h1>
          <p>
            Du er logget inn som <strong>{view.email}</strong>, men denne brukeren har ikke tilgang til svarene. Be den som satte opp
            databasen om å legge deg til som administrator (se README).
          </p>
          <button type="button" className="admin-btn" onClick={() => backend.signOut()}>
            Logg ut
          </button>
        </div>
      ) : view.kind === 'error' ? (
        <div className="admin-card" role="alert">
          <h1>Noe gikk galt</h1>
          <p>{view.message}</p>
        </div>
      ) : (
        <Dashboard backend={backend} email={view.email} />
      )}
    </Shell>
  );
}

function Shell({ children, demo = false }: { children: React.ReactNode; demo?: boolean }) {
  return (
    <div className="admin">
      {demo && (
        <div className="admin-demo" role="note">
          DEMO – falske testdata, ingenting lagres. (Kun tilgjengelig under utvikling.)
        </div>
      )}
      <main className="admin-main">{children}</main>
    </div>
  );
}
