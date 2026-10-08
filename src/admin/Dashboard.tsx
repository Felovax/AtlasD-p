import { useCallback, useEffect, useMemo, useState } from 'react';
import { invitation } from '../config/invitation';
import type { AdminBackend } from './backend';
import { downloadCsv, rowsToCsv } from './csv';
import { computeStats, formatTimestamp, guestNames, type RsvpRow } from './types';

type Tab = 'yes' | 'no';

export function Dashboard({ backend, email }: { backend: AdminBackend; email: string }) {
  const [rows, setRows] = useState<RsvpRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('yes');
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await backend.listRsvps());
      setUpdatedAt(new Date());
    } catch {
      setError('Klarte ikke å hente svarene. Sjekk nettforbindelsen og trykk «Oppdater».');
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => computeStats(rows ?? []), [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('nb-NO');
    return (rows ?? [])
      .filter((r) => (tab === 'yes' ? r.attending : !r.attending))
      .filter((r) => !q || guestNames(r).toLocaleLowerCase('nb-NO').includes(q));
  }, [rows, tab, query]);

  const remove = async (row: RsvpRow) => {
    if (!window.confirm(`Slette svaret fra ${guestNames(row)}?\n\nDette kan ikke angres.`)) return;
    setDeleting(row.id);
    try {
      await backend.deleteRsvp(row.id);
      setRows((current) => current?.filter((r) => r.id !== row.id) ?? null);
    } catch {
      setError('Klarte ikke å slette svaret. Prøv igjen.');
    } finally {
      setDeleting(null);
    }
  };

  const exportCsv = () => {
    if (!rows) return;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`dapsvar-${invitation.childName.toLowerCase()}-${stamp}.csv`, rowsToCsv(rows));
  };

  return (
    <div className="dash">
      <header className="dash__header">
        <div>
          <h1>Svar på invitasjonen</h1>
          <p className="admin-muted">
            Dåpen til {invitation.childName} · innlogget som {email}
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => backend.signOut()}>
          Logg ut
        </button>
      </header>

      <section className="dash__stats" aria-label="Oppsummering">
        <Stat label="Gjester som kommer" value={stats.attendingGuests} highlight />
        <Stat label="Ja-svar" value={stats.yesCount} />
        <Stat label="Nei-svar" value={stats.noCount} />
      </section>

      <div className="dash__toolbar">
        <button type="button" className="admin-btn" onClick={() => void load()} disabled={loading}>
          {loading ? 'Oppdaterer …' : 'Oppdater'}
        </button>
        <button type="button" className="admin-btn" onClick={exportCsv} disabled={!rows || rows.length === 0}>
          Last ned CSV
        </button>
        {updatedAt && <span className="admin-muted dash__updated">Sist hentet {updatedAt.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <div className="dash__tabs" role="tablist" aria-label="Filtrer svar">
        <button type="button" role="tab" aria-selected={tab === 'yes'} className={tab === 'yes' ? 'is-active' : ''} onClick={() => setTab('yes')}>
          Kommer ({stats.yesCount})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'no'} className={tab === 'no' ? 'is-active' : ''} onClick={() => setTab('no')}>
          Kommer ikke ({stats.noCount})
        </button>
      </div>

      <label className="admin-field dash__search">
        <span className="visually-hidden">Søk etter navn</span>
        <input type="search" placeholder="Søk etter navn …" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {rows === null ? (
        <p className="admin-muted" role="status">
          {loading ? 'Henter svar …' : ''}
        </p>
      ) : visible.length === 0 ? (
        <p className="admin-muted dash__empty">{query ? 'Ingen treff.' : tab === 'yes' ? 'Ingen har svart ja ennå.' : 'Ingen har svart nei ennå.'}</p>
      ) : (
        <ul className="dash__list">
          {visible.map((row) => (
            <li key={row.id} className="dash__row">
              <div className="dash__names">
                <strong>{row.primary_guest_name}</strong>
                {row.secondary_guest_name && <span>+ {row.secondary_guest_name}</span>}
              </div>
              <div className="dash__meta">
                {row.attending && (
                  <span className="dash__count" title="Antall personer i dette svaret">
                    {row.guest_count} {row.guest_count === 1 ? 'person' : 'personer'}
                  </span>
                )}
                <time dateTime={row.created_at}>{formatTimestamp(row.created_at)}</time>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--tiny"
                  onClick={() => void remove(row)}
                  disabled={deleting === row.id}
                  aria-label={`Slett svaret fra ${guestNames(row)}`}
                >
                  {deleting === row.id ? 'Sletter …' : 'Slett'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`dash__stat ${highlight ? 'is-highlight' : ''}`}>
      <span className="dash__stat-value">{value}</span>
      <span className="dash__stat-label">{label}</span>
    </div>
  );
}
