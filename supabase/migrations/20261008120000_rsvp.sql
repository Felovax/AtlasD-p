-- ═══════════════════════════════════════════════════════════════════════════════
--  Atlas' dåp – svar på invitasjonen (RSVP)
--
--  Sikkerhetsmodell:
--   • Gjester (rollen «anon») kan IKKE lese, endre eller slette noe som helst.
--     Det eneste de kan gjøre er å kalle funksjonen public.submit_rsvp(), som
--     validerer alt på serveren, begrenser hvor ofte man kan sende, og lagrer svaret.
--   • Innloggede brukere («authenticated») kan lese og slette svar KUN hvis de står
--     i tabellen private.admins. Dette håndheves av databasen (Row Level Security),
--     ikke bare av nettsiden.
--   • Skjemaet «private» er ikke tilgjengelig via Supabase sitt API.
--
--  Kjør hele fila én gang i Supabase: SQL Editor → New query → lim inn → Run.
--  (Eller med Supabase CLI: supabase db push)
-- ═══════════════════════════════════════════════════════════════════════════════

create schema if not exists private;
revoke all on schema private from public;

-- ─── Svar ──────────────────────────────────────────────────────────────────────
create table public.rsvps (
  id                    uuid primary key default gen_random_uuid(),
  primary_guest_name    text        not null,
  secondary_guest_name  text,
  attending             boolean     not null,
  guest_count           smallint    not null,
  created_at            timestamptz not null default now(),

  constraint rsvps_primary_name_length   check (char_length(primary_guest_name) between 2 and 80),
  constraint rsvps_primary_name_trimmed  check (primary_guest_name = btrim(primary_guest_name)),
  constraint rsvps_secondary_name_length check (secondary_guest_name is null or char_length(secondary_guest_name) between 2 and 80),
  constraint rsvps_secondary_name_trimmed check (secondary_guest_name is null or secondary_guest_name = btrim(secondary_guest_name)),
  constraint rsvps_guest_count_range     check (guest_count between 0 and 2),
  -- Ja = 1 eller 2 personer (navn på nr. 2 kun når de er to). Nei = 0 personer og ett navn.
  constraint rsvps_attendance_consistent check (
       (attending and guest_count = 1 and secondary_guest_name is null)
    or (attending and guest_count = 2 and secondary_guest_name is not null)
    or (not attending and guest_count = 0 and secondary_guest_name is null)
  )
);

comment on table public.rsvps is 'Svar på dåpsinvitasjonen til Atlas. Settes kun inn via public.submit_rsvp().';
create index rsvps_created_at_idx on public.rsvps (created_at desc);

alter table public.rsvps enable row level security;

-- Supabase gir som standard anon/authenticated tilgang til nye tabeller. Vi fjerner alt,
-- og gir bare tilbake det administratorer trenger (fortsatt begrenset av RLS under).
revoke all on table public.rsvps from public, anon, authenticated;
grant select, delete on table public.rsvps to authenticated;

-- ─── Administratorer ───────────────────────────────────────────────────────────
create table private.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

comment on table private.admins is 'Brukere (Supabase Auth) som får se svarene i oversikten.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admins a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "Administratorer kan lese svar"
  on public.rsvps for select
  to authenticated
  using ((select public.is_admin()));

create policy "Administratorer kan slette svar"
  on public.rsvps for delete
  to authenticated
  using ((select public.is_admin()));

-- Med vilje INGEN policy for insert/update: ingen kan skrive direkte til tabellen via API-et.

-- ─── Begrensning av antall innsendinger (mot spam) ─────────────────────────────
-- Vi lagrer aldri IP-adresser. Kun en enveis-hash av (IP + dagens dato), som ikke kan
-- spores tilbake og ikke kan kobles mellom dager. Radene slettes automatisk etter ett døgn.
create table private.rsvp_attempts (
  id          bigint generated always as identity primary key,
  client_hash text        not null,
  created_at  timestamptz not null default now()
);

create index rsvp_attempts_client_idx  on private.rsvp_attempts (client_hash, created_at desc);
create index rsvp_attempts_created_idx on private.rsvp_attempts (created_at);

-- ─── Innsending fra gjester ────────────────────────────────────────────────────
create or replace function public.submit_rsvp(
  p_id             uuid,
  p_attending      boolean,
  p_guest_count    integer,
  p_primary_name   text,
  p_secondary_name text default null,
  p_website        text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_primary   text := regexp_replace(btrim(coalesce(p_primary_name, '')), '\s+', ' ', 'g');
  v_secondary text := nullif(regexp_replace(btrim(coalesce(p_secondary_name, '')), '\s+', ' ', 'g'), '');
  v_headers   json;
  v_client    text;
  v_hash      text;
  v_recent    integer;
  v_burst     integer;
begin
  -- Honningkrukke-felt: mennesker ser det ikke, roboter fyller det ut. Lat som alt gikk fint.
  if coalesce(btrim(p_website), '') <> '' then
    return jsonb_build_object('id', coalesce(p_id, gen_random_uuid()));
  end if;

  -- ── Validering (samme regler som i skjemaet, men her kan ingen jukse) ──
  if p_id is null then
    raise exception 'invalid_id';
  end if;
  if p_attending is null then
    raise exception 'invalid_attending';
  end if;
  if char_length(v_primary) not between 2 and 80
     or v_primary !~ '[^[:space:][:digit:][:punct:]]' then
    raise exception 'invalid_primary_name';
  end if;

  if p_attending then
    if p_guest_count not in (1, 2) then
      raise exception 'invalid_guest_count';
    end if;
    if p_guest_count = 2 then
      if v_secondary is null
         or char_length(v_secondary) not between 2 and 80
         or v_secondary !~ '[^[:space:][:digit:][:punct:]]'
         or lower(v_secondary) = lower(v_primary) then
        raise exception 'invalid_secondary_name';
      end if;
    else
      v_secondary := null;
    end if;
  else
    if p_guest_count is distinct from 0 then
      raise exception 'invalid_guest_count';
    end if;
    v_secondary := null;
  end if;

  -- ── Begrens antall innsendinger ──
  v_headers := nullif(current_setting('request.headers', true), '')::json;
  v_client := coalesce(
    nullif(btrim(v_headers ->> 'cf-connecting-ip'), ''),
    nullif(btrim(split_part(v_headers ->> 'x-forwarded-for', ',', 1)), ''),
    nullif(btrim(v_headers ->> 'x-real-ip'), ''),
    'ukjent'
  );
  v_hash := encode(sha256(convert_to(v_client || '|' || current_date::text || '|atlas-dap', 'UTF8')), 'hex');

  delete from private.rsvp_attempts where created_at < now() - interval '1 day';

  select count(*) into v_recent
    from private.rsvp_attempts
   where client_hash = v_hash and created_at > now() - interval '10 minutes';
  select count(*) into v_burst
    from private.rsvp_attempts
   where created_at > now() - interval '1 minute';

  if v_recent >= 8 or v_burst >= 40 then
    raise exception 'rate_limited';
  end if;

  insert into private.rsvp_attempts (client_hash) values (v_hash);

  -- ── Lagre (samme ID to ganger = samme svar sendt på nytt; lagres bare én gang) ──
  insert into public.rsvps (id, primary_guest_name, secondary_guest_name, attending, guest_count)
  values (p_id, v_primary, v_secondary, p_attending, p_guest_count)
  on conflict (id) do nothing;

  return jsonb_build_object('id', p_id);
end;
$$;

revoke all on function public.submit_rsvp(uuid, boolean, integer, text, text, text) from public;
grant execute on function public.submit_rsvp(uuid, boolean, integer, text, text, text) to anon, authenticated;

comment on function public.submit_rsvp(uuid, boolean, integer, text, text, text) is
  'Eneste vei inn for gjester: validerer, begrenser antall innsendinger og lagrer ett svar.';
