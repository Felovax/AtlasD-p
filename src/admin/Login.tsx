import { useState, type FormEvent } from 'react';
import { AdminError, type AdminBackend } from './backend';

export function Login({ backend }: { backend: AdminBackend }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() || (!password && !backend.isDemo)) {
      setError('Fyll inn både e-post og passord.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await backend.signIn(email.trim(), password);
    } catch (err) {
      const kind = err instanceof AdminError ? err.kind : 'unknown';
      setError(
        kind === 'invalid_login'
          ? 'Feil e-post eller passord.'
          : kind === 'network'
            ? 'Fikk ikke kontakt. Sjekk nettforbindelsen og prøv igjen.'
            : 'Innloggingen feilet. Prøv igjen om litt.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-card admin-login" onSubmit={onSubmit} noValidate>
      <h1>Svar på invitasjonen</h1>
      <p className="admin-muted">Logg inn for å se hvem som kommer i dåpen.</p>
      <label className="admin-field">
        <span>E-post</span>
        <input type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="admin-field">
        <span>Passord</span>
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
        {busy ? 'Logger inn …' : 'Logg inn'}
      </button>
    </form>
  );
}
