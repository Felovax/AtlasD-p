/**
 * Tester supabase/rydd-opp-feil-prosjekt.sql mot ulike utgangspunkter, med PGlite:
 * at det fjerner dåpsoppsettet, og at det aldri rører ting som tilhører et annet prosjekt.
 *
 *   node supabase/tests/cleanup.test.mjs
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

const here = path.dirname(fileURLToPath(import.meta.url));
const migration = await readFile(path.join(here, '..', 'migrations', '20261008120000_rsvp.sql'), 'utf8');
const cleanup = await readFile(path.join(here, '..', 'rydd-opp-feil-prosjekt.sql'), 'utf8');

const SUPABASE = `
  create role anon nologin; create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text unique);
  create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
`;

async function fresh(setup = '') {
  const db = new PGlite();
  await db.exec(SUPABASE);
  if (setup) await db.exec(setup);
  return db;
}

const exists = async (db, sql) => (await db.query(`select (${sql}) is not null as ok`)).rows[0].ok;
const leftovers = async (db) => (await db.query(cleanup.slice(cleanup.indexOf('-- Kontroll')))).rows;

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.stack ?? err}`);
    process.exitCode = 1;
  }
}

console.log('Opprydding etter dåpsoppsett i feil prosjekt:');

await test('fjerner alt fra dåpsoppsettet i et prosjekt som ellers ikke hadde noe av dette', async () => {
  const db = await fresh(`create table public.campsites (id serial primary key, name text);`);
  await db.exec(migration);
  await db.exec(`insert into public.rsvps (primary_guest_name, attending, guest_count) values ('Test', true, 1)`);
  await db.exec(cleanup);
  assert.deepEqual(await leftovers(db), []);
  assert.equal(await exists(db, `to_regprocedure('public.is_admin()')`), false);
  assert.equal(await exists(db, `to_regnamespace('private')`), false);
  assert.equal(await exists(db, `to_regclass('public.campsites')`), true, 'CampingAI-tabellen må stå');
});

await test('beholder et «private»-skjema som fantes fra før, med innholdet', async () => {
  const db = await fresh(`create schema private; create table private.secrets (id int);`);
  await db.exec(migration);
  await db.exec(cleanup);
  assert.deepEqual(await leftovers(db), []);
  assert.equal(await exists(db, `to_regclass('private.secrets')`), true);
});

await test('stopper uten å endre noe hvis CampingAI sine regler bruker is_admin()', async () => {
  const db = await fresh(`
    create table public.bookings (id int);
    alter table public.bookings enable row level security;
    create function public.is_admin() returns boolean language sql stable as $$ select false $$;
    create policy campers on public.bookings for select using (public.is_admin());
  `);
  await db.exec(migration); // overskriver is_admin() – akkurat det som kan ha skjedd
  await assert.rejects(db.exec(cleanup), /STOPP: public\.is_admin\(\) brukes av andre regler/);
  await db.exec('rollback').catch(() => {});
  assert.equal(await exists(db, `to_regclass('public.rsvps')`), true, 'ingenting skal være slettet');
  assert.equal(await exists(db, `to_regclass('private.admins')`), true);
});

await test('rører ikke en annen tabell som heter private.admins (oppsettet feilet da)', async () => {
  const db = await fresh(`create schema private; create table private.admins (user_id uuid primary key);`);
  await assert.rejects(db.exec(migration)); // migreringen feiler, og ingenting fra den blir laget
  await db.exec('rollback').catch(() => {});
  await assert.rejects(db.exec(cleanup), /STOPP: private\.admins finnes, men er ikke fra dåpsinvitasjonen/);
  await db.exec('rollback').catch(() => {});
  assert.equal(await exists(db, `to_regclass('private.admins')`), true);
});

await test('gjør ingenting (og feiler ikke) hvis dåpsoppsettet aldri ble kjørt', async () => {
  const db = await fresh(`create function public.is_admin() returns boolean language sql stable as $$ select true $$;`);
  await db.exec(cleanup);
  assert.equal(await exists(db, `to_regprocedure('public.is_admin()')`), true, 'CampingAI sin is_admin må stå');
});

console.log(`\n${passed} av 5 tester bestått.`);
