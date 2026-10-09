-- ═══════════════════════════════════════════════════════════════════════════════
--  Ønskeliste: gjester kan reservere et ønske, så andre ser at det er tatt.
--
--  • Ingen (heller ikke foreldrene i oversikten) ser HVEM som har reservert noe.
--  • Gjesten får en hemmelig kode i nettleseren, slik at bare samme telefon/PC kan angre.
--    I databasen lagres bare en hash av koden.
--  • Gjester kan bare bruke de tre funksjonene under – aldri lese eller endre tabellen direkte.
--
--  Kjør hele fila én gang i Supabase: SQL Editor → New query → lim inn → Run
--  (rollen nede til høyre skal være «postgres»).
-- ═══════════════════════════════════════════════════════════════════════════════

create table public.wish_reservations (
  wish_id     text        primary key,
  token_hash  text        not null,
  created_at  timestamptz not null default now(),

  constraint wish_reservations_id_format check (wish_id ~ '^[a-z0-9-]{1,60}$'),
  constraint wish_reservations_hash_format check (token_hash ~ '^[0-9a-f]{64}$')
);

comment on table public.wish_reservations is 'Reserverte ønsker fra ønskelisten. Kun via reserve_wish()/unreserve_wish().';

alter table public.wish_reservations enable row level security;
revoke all on table public.wish_reservations from public, anon, authenticated;
grant select, delete on table public.wish_reservations to authenticated;

-- Administratorer kan rydde opp (f.eks. hvis noen har reservert ved en feil) – via SQL eller API.
create policy "Administratorer kan se reservasjoner"
  on public.wish_reservations for select to authenticated
  using ((select public.is_admin()));

create policy "Administratorer kan fjerne reservasjoner"
  on public.wish_reservations for delete to authenticated
  using ((select public.is_admin()));

-- ─── Hvilke ønsker er tatt? (bare ID-ene, aldri hvem) ──────────────────────────
create or replace function public.reserved_wishes()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(wish_id order by wish_id), '[]'::jsonb) from public.wish_reservations;
$$;

revoke all on function public.reserved_wishes() from public;
grant execute on function public.reserved_wishes() to anon, authenticated;

-- ─── Felles begrensning mot misbruk (samme prinsipp som for svar) ──────────────
create or replace function private.wish_rate_limit()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_headers json := nullif(current_setting('request.headers', true), '')::json;
  v_client  text;
  v_hash    text;
  v_recent  integer;
  v_burst   integer;
begin
  v_client := coalesce(
    nullif(btrim(v_headers ->> 'cf-connecting-ip'), ''),
    nullif(btrim(split_part(v_headers ->> 'x-forwarded-for', ',', 1)), ''),
    nullif(btrim(v_headers ->> 'x-real-ip'), ''),
    'ukjent'
  );
  v_hash := encode(sha256(convert_to(v_client || '|' || current_date::text || '|atlas-onsker', 'UTF8')), 'hex');

  delete from private.rsvp_attempts where created_at < now() - interval '1 day';
  select count(*) into v_recent from private.rsvp_attempts
   where client_hash = v_hash and created_at > now() - interval '10 minutes';
  select count(*) into v_burst from private.rsvp_attempts
   where created_at > now() - interval '1 minute';
  if v_recent >= 12 or v_burst >= 60 then
    raise exception 'rate_limited';
  end if;
  insert into private.rsvp_attempts (client_hash) values (v_hash);
end;
$$;

revoke all on function private.wish_rate_limit() from public, anon, authenticated;

-- ─── Reservere ─────────────────────────────────────────────────────────────────
create or replace function public.reserve_wish(p_wish_id text, p_token uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_existing text;
begin
  if p_wish_id is null or p_wish_id !~ '^[a-z0-9-]{1,60}$' then
    raise exception 'invalid_wish';
  end if;
  if p_token is null then
    raise exception 'invalid_token';
  end if;

  v_hash := encode(sha256(convert_to(p_token::text, 'UTF8')), 'hex');

  -- Samme gjest prøver igjen (f.eks. etter nettbrudd): bare bekreft.
  select token_hash into v_existing from public.wish_reservations where wish_id = p_wish_id;
  if v_existing is not null then
    return jsonb_build_object('status', case when v_existing = v_hash then 'reserved' else 'already_reserved' end);
  end if;

  perform private.wish_rate_limit();

  insert into public.wish_reservations (wish_id, token_hash) values (p_wish_id, v_hash)
  on conflict (wish_id) do nothing;

  if found then
    return jsonb_build_object('status', 'reserved');
  end if;
  return jsonb_build_object('status', 'already_reserved');
end;
$$;

revoke all on function public.reserve_wish(text, uuid) from public;
grant execute on function public.reserve_wish(text, uuid) to anon, authenticated;

-- ─── Angre (krever koden fra samme nettleser) ──────────────────────────────────
create or replace function public.unreserve_wish(p_wish_id text, p_token uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_wish_id is null or p_wish_id !~ '^[a-z0-9-]{1,60}$' or p_token is null then
    raise exception 'invalid_wish';
  end if;

  delete from public.wish_reservations
   where wish_id = p_wish_id
     and token_hash = encode(sha256(convert_to(p_token::text, 'UTF8')), 'hex');

  return jsonb_build_object('status', case when found then 'released' else 'not_yours' end);
end;
$$;

revoke all on function public.unreserve_wish(text, uuid) from public;
grant execute on function public.unreserve_wish(text, uuid) to anon, authenticated;
