-- ═══════════════════════════════════════════════════════════════════════════════
--  Fjerner dåpsoppsettet fra et Supabase-prosjekt (f.eks. hvis det ble kjørt i feil prosjekt)
--
--  Fjerner KUN det supabase/migrations/20261008120000_rsvp.sql opprettet:
--    public.rsvps, public.submit_rsvp(), public.is_admin(),
--    private.admins, private.rsvp_attempts, og skjemaet «private» hvis det er tomt.
--
--  Sikkerhet: skriptet sjekker først at hvert objekt faktisk er fra dåpsinvitasjonen.
--  Finner det noe med samme navn som ser ut til å tilhøre noe annet, STOPPER det,
--  og ingenting blir endret (alt kjører i én transaksjon).
-- ═══════════════════════════════════════════════════════════════════════════════

begin;

do $$
declare
  v_is_admin regprocedure := to_regprocedure('public.is_admin()');
  v_rsvps    regclass     := to_regclass('public.rsvps');
  v_admins   regclass     := to_regclass('private.admins');
  v_attempts regclass     := to_regclass('private.rsvp_attempts');
  v_other_deps integer;
  v_drop_is_admin boolean := false;
begin
  -- 1. Er tabellene våre? (sjekkes på unike kjennetegn fra dåpsoppsettet)
  if v_rsvps is not null and not exists (
    select 1 from pg_constraint where conrelid = v_rsvps and conname = 'rsvps_attendance_consistent'
  ) then
    raise exception 'STOPP: public.rsvps finnes, men er ikke fra dåpsinvitasjonen. Ingenting er endret.';
  end if;

  if v_admins is not null
     and coalesce(obj_description(v_admins, 'pg_class'), '') <> 'Brukere (Supabase Auth) som får se svarene i oversikten.' then
    raise exception 'STOPP: private.admins finnes, men er ikke fra dåpsinvitasjonen. Ingenting er endret.';
  end if;

  if v_attempts is not null and to_regclass('private.rsvp_attempts_client_idx') is null then
    raise exception 'STOPP: private.rsvp_attempts finnes, men er ikke fra dåpsinvitasjonen. Ingenting er endret.';
  end if;

  -- 2. is_admin(): fjernes bare hvis det er vår versjon, og ingenting annet i databasen bruker den.
  if v_is_admin is not null and pg_get_functiondef(v_is_admin) ilike '%private.admins%' then
    select count(*) into v_other_deps
      from pg_depend d
     where d.refclassid = 'pg_proc'::regclass
       and d.refobjid = v_is_admin
       and not (
         d.classid = 'pg_policy'::regclass
         and exists (select 1 from pg_policy p where p.oid = d.objid and p.polrelid = v_rsvps)
       );
    if v_other_deps > 0 then
      raise exception 'STOPP: public.is_admin() brukes av andre regler i dette prosjektet (CampingAI hadde trolig sin egen is_admin). Ingenting er endret – ta kontakt før du går videre.';
    end if;
    v_drop_is_admin := true;
  elsif v_is_admin is not null then
    raise notice 'Beholdt public.is_admin() – den er ikke fra dåpsinvitasjonen.';
  end if;

  -- 3. Fjern resten (rekkefølgen tar hensyn til avhengigheter)
  if to_regprocedure('public.submit_rsvp(uuid, boolean, integer, text, text, text)') is not null then
    drop function public.submit_rsvp(uuid, boolean, integer, text, text, text);
    raise notice 'Fjernet public.submit_rsvp()';
  end if;
  if v_rsvps is not null then
    drop table public.rsvps;          -- regler (policies) og indekser forsvinner sammen med tabellen
    raise notice 'Fjernet public.rsvps';
  end if;
  if v_attempts is not null then
    drop table private.rsvp_attempts;
    raise notice 'Fjernet private.rsvp_attempts';
  end if;
  if v_admins is not null then
    drop table private.admins;
    raise notice 'Fjernet private.admins';
  end if;
  if v_drop_is_admin then
    drop function public.is_admin();  -- etter tabellen, siden reglene på rsvps brukte den
    raise notice 'Fjernet public.is_admin()';
  end if;

  -- 4. Skjemaet «private» fjernes bare hvis det nå er tomt (fantes det fra før, beholdes det).
  if to_regnamespace('private') is not null then
    begin
      drop schema private;            -- uten CASCADE: virker bare hvis skjemaet er tomt
      raise notice 'Fjernet skjemaet private';
    exception when dependent_objects_still_exist then
      raise notice 'Beholdt skjemaet private – det inneholder andre ting.';
    end;
  end if;
end $$;

commit;

-- Kontroll: skal gi 0 rader hvis alt fra dåpsoppsettet er borte.
select 'gjenstår: ' || x as status
from unnest(array[
  case when to_regclass('public.rsvps') is not null then 'public.rsvps' end,
  case when to_regprocedure('public.submit_rsvp(uuid, boolean, integer, text, text, text)') is not null then 'public.submit_rsvp' end,
  case when to_regclass('private.admins') is not null then 'private.admins' end,
  case when to_regclass('private.rsvp_attempts') is not null then 'private.rsvp_attempts' end
]) as x
where x is not null;
