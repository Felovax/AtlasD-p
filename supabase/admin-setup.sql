-- ═══════════════════════════════════════════════════════════════════════════════
--  Gi en bruker tilgang til oversikten over svar (/admin/)
--
--  1. Opprett brukeren først: Supabase → Authentication → Users → «Add user»
--     → «Create new user». Skriv inn e-post og et sterkt passord, og huk av
--     «Auto Confirm User».
--  2. Bytt ut e-postadressen under, og kjør i Supabase → SQL Editor.
--  3. Gjenta for den andre forelderen hvis dere vil ha hver deres innlogging.
-- ═══════════════════════════════════════════════════════════════════════════════

insert into private.admins (user_id, note)
select id, 'Forelder'
from auth.users
where email = 'DIN-EPOST@eksempel.no'   -- ← bytt ut
on conflict (user_id) do nothing;

-- Sjekk hvem som har tilgang:
select u.email, a.note, a.created_at
from private.admins a
join auth.users u on u.id = a.user_id;

-- Fjerne tilgang:
-- delete from private.admins where user_id = (select id from auth.users where email = 'DIN-EPOST@eksempel.no');

-- Etter dåpen: slett alle svar (personvern). Kan ikke angres!
-- delete from public.rsvps;
