/**
 * Tester databaseoppsettet (supabase/migrations) mot en ekte PostgreSQL som kjører
 * lokalt i Node (PGlite) – uten Docker og uten å røre det ekte Supabase-prosjektet.
 *
 *   npm run test:db
 *
 * Vi etterligner de delene av Supabase migrasjonen bruker: rollene anon/authenticated,
 * auth.users, auth.uid(), request.headers og Supabase sine standardrettigheter.
 * Det gir høy tillit til at reglene virker, men erstatter ikke en siste prøve mot ekte Supabase.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, '..', 'migrations');

const db = new PGlite();

// ─── Etterligning av Supabase ─────────────────────────────────────────────────
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  -- Supabase sine standardrettigheter: nye tabeller/funksjoner i public blir åpne for alle roller.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;

  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text unique);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated;
`);

for (const file of (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(await readFile(path.join(migrationsDir, file), 'utf8'));
  console.log(`Migrering kjørt: ${file}`);
}

// ─── Hjelpere ─────────────────────────────────────────────────────────────────
const ADMIN = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
await db.exec(`
  insert into auth.users (id, email) values ('${ADMIN}', 'forelder@example.com'), ('${OTHER}', 'fremmed@example.com');
  insert into private.admins (user_id, note) values ('${ADMIN}', 'Forelder');
`);

let ipCounter = 0;
/** Kjører SQL som en bestemt rolle (som om det kom via Supabase sitt API). */
async function as(role, sql, params = [], { user = null, ip } = {}) {
  const clientIp = ip ?? `10.0.0.${++ipCounter}`;
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ?? '']);
  await db.query(`select set_config('request.headers', $1, false)`, [JSON.stringify({ 'x-forwarded-for': `${clientIp}, 172.16.0.1` })]);
  await db.exec(`set role ${role}`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec('reset role');
  }
}

const uuid = () => crypto.randomUUID();
const submit = (args, opts) =>
  as(
    'anon',
    'select public.submit_rsvp($1, $2, $3, $4, $5, $6) as result',
    [args.id ?? uuid(), args.attending, args.count, args.primary, args.secondary ?? null, args.website ?? null],
    opts,
  );
const count = async () => Number((await db.query('select count(*)::int as n from public.rsvps')).rows[0].n);

async function rejects(promise, pattern, label) {
  await assert.rejects(promise, (err) => {
    assert.match(String(err.message), pattern, label);
    return true;
  });
}

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

// ─── Tester ───────────────────────────────────────────────────────────────────
console.log('\nGjester (anon):');

await test('kan sende et ja-svar for én person', async () => {
  const id = uuid();
  const res = await submit({ id, attending: true, count: 1, primary: 'Kari Nordmann' });
  assert.equal(res.rows[0].result.id, id);
  const row = (await db.query('select * from public.rsvps where id = $1', [id])).rows[0];
  assert.equal(row.primary_guest_name, 'Kari Nordmann');
  assert.equal(row.guest_count, 1);
  assert.equal(row.attending, true);
});

await test('trimmer mellomrom og slår sammen doble mellomrom', async () => {
  const id = uuid();
  await submit({ id, attending: true, count: 2, primary: '  Åse    Ødegård ', secondary: ' Ola  Nordmann  ' });
  const row = (await db.query('select * from public.rsvps where id = $1', [id])).rows[0];
  assert.equal(row.primary_guest_name, 'Åse Ødegård');
  assert.equal(row.secondary_guest_name, 'Ola Nordmann');
  assert.equal(row.guest_count, 2);
});

await test('kan sende et nei-svar (0 personer, ett navn)', async () => {
  const id = uuid();
  await submit({ id, attending: false, count: 0, primary: 'Per', secondary: 'ignoreres' });
  const row = (await db.query('select * from public.rsvps where id = $1', [id])).rows[0];
  assert.equal(row.attending, false);
  assert.equal(row.guest_count, 0);
  assert.equal(row.secondary_guest_name, null);
});

await test('lagrer ikke samme svar to ganger (samme ID ved nytt forsøk)', async () => {
  const id = uuid();
  const before = await count();
  await submit({ id, attending: true, count: 1, primary: 'Dobbel Klikk' });
  await submit({ id, attending: true, count: 1, primary: 'Dobbel Klikk' });
  assert.equal(await count(), before + 1);
});

await test('avviser ugyldige svar', async () => {
  await rejects(submit({ attending: true, count: 3, primary: 'Kari' }), /invalid_guest_count/, 'mer enn 2');
  await rejects(submit({ attending: true, count: 0, primary: 'Kari' }), /invalid_guest_count/, 'ja med 0');
  await rejects(submit({ attending: false, count: 1, primary: 'Kari' }), /invalid_guest_count/, 'nei med 1');
  await rejects(submit({ attending: true, count: 2, primary: 'Kari' }), /invalid_secondary_name/, 'mangler nr. 2');
  await rejects(submit({ attending: true, count: 2, primary: 'Kari', secondary: 'kari' }), /invalid_secondary_name/, 'samme navn');
  await rejects(submit({ attending: true, count: 1, primary: '   ' }), /invalid_primary_name/, 'tomt navn');
  await rejects(submit({ attending: true, count: 1, primary: 'x'.repeat(81) }), /invalid_primary_name/, 'for langt');
  await rejects(submit({ attending: true, count: 1, primary: '1234' }), /invalid_primary_name/, 'ingen bokstaver');
  await rejects(submit({ attending: null, count: 1, primary: 'Kari' }), /invalid_attending/, 'mangler ja/nei');
});

await test('honningkrukke-feltet: roboter får «ok», men ingenting lagres', async () => {
  const before = await count();
  const res = await submit({ attending: true, count: 1, primary: 'Spam Bot', website: 'http://spam.example' });
  assert.ok(res.rows[0].result.id);
  assert.equal(await count(), before);
});

await test('begrenser antall innsendinger fra samme nettverk', async () => {
  const ip = '203.0.113.7';
  for (let i = 0; i < 8; i++) await submit({ attending: true, count: 1, primary: `Gjest ${'abcdefgh'[i]}` }, { ip });
  await rejects(submit({ attending: true, count: 1, primary: 'Gjest ni' }, { ip }), /rate_limited/);
  // Andre nettverk påvirkes ikke
  await submit({ attending: true, count: 1, primary: 'Annen Gjest' }, { ip: '198.51.100.4' });
});

await test('lagrer ikke IP-adresser, bare en hash', async () => {
  const rows = (await db.query('select client_hash from private.rsvp_attempts')).rows;
  assert.ok(rows.length > 0);
  for (const r of rows) assert.match(r.client_hash, /^[0-9a-f]{64}$/);
  assert.ok(!rows.some((r) => r.client_hash.includes('203.0.113.7')));
});

await test('kan IKKE lese svar', async () => {
  await rejects(as('anon', 'select * from public.rsvps'), /permission denied/);
});

await test('kan IKKE skrive, endre eller slette direkte', async () => {
  await rejects(
    as('anon', `insert into public.rsvps (primary_guest_name, attending, guest_count) values ('Hacker', true, 1)`),
    /permission denied/,
  );
  await rejects(as('anon', `update public.rsvps set guest_count = 2`), /permission denied/);
  await rejects(as('anon', `delete from public.rsvps`), /permission denied/);
});

await test('kan IKKE se administratorlista eller sjekke admin-status', async () => {
  await rejects(as('anon', 'select * from private.admins'), /permission denied/);
  await rejects(as('anon', 'select * from private.rsvp_attempts'), /permission denied/);
  await rejects(as('anon', 'select public.is_admin()'), /permission denied/);
});

console.log('\nInnlogget, men ikke administrator:');

await test('ser ingen svar og kan ikke slette noe', async () => {
  const before = await count();
  const read = await as('authenticated', 'select * from public.rsvps', [], { user: OTHER });
  assert.equal(read.rows.length, 0);
  await as('authenticated', 'delete from public.rsvps', [], { user: OTHER });
  assert.equal(await count(), before);
  const admin = await as('authenticated', 'select public.is_admin() as ok', [], { user: OTHER });
  assert.equal(admin.rows[0].ok, false);
});

await test('kan ikke endre svar eller gjøre seg selv til administrator', async () => {
  await rejects(as('authenticated', `update public.rsvps set guest_count = 2`, [], { user: OTHER }), /permission denied/);
  await rejects(
    as('authenticated', `insert into private.admins (user_id) values ('${OTHER}')`, [], { user: OTHER }),
    /permission denied/,
  );
});

console.log('\nAdministrator:');

await test('ser alle svar', async () => {
  const read = await as('authenticated', 'select * from public.rsvps', [], { user: ADMIN });
  assert.equal(read.rows.length, await count());
  const admin = await as('authenticated', 'select public.is_admin() as ok', [], { user: ADMIN });
  assert.equal(admin.rows[0].ok, true);
});

await test('kan slette et svar, men ikke endre', async () => {
  const id = (await db.query('select id from public.rsvps limit 1')).rows[0].id;
  const before = await count();
  await as('authenticated', 'delete from public.rsvps where id = $1', [id], { user: ADMIN });
  assert.equal(await count(), before - 1);
  await rejects(as('authenticated', `update public.rsvps set guest_count = 2`, [], { user: ADMIN }), /permission denied/);
});

console.log('\nTabellregler (gjelder uansett hvem som skriver):');

await test('databasen avviser inkonsistente rader direkte', async () => {
  const bad = [
    `insert into public.rsvps (primary_guest_name, attending, guest_count) values ('Kari', true, 3)`,
    `insert into public.rsvps (primary_guest_name, attending, guest_count) values ('Kari', false, 1)`,
    `insert into public.rsvps (primary_guest_name, attending, guest_count) values ('Kari', true, 2)`,
    `insert into public.rsvps (primary_guest_name, secondary_guest_name, attending, guest_count) values ('Kari', 'Ola', true, 1)`,
    `insert into public.rsvps (primary_guest_name, attending, guest_count) values (' Kari', true, 1)`,
    `insert into public.rsvps (primary_guest_name, attending, guest_count) values ('K', true, 1)`,
  ];
  for (const sql of bad) await rejects(db.query(sql), /violates check constraint/, sql);
});

console.log(`\n${passed} tester bestått${process.exitCode ? ' – men noen feilet!' : '.'}`);
await db.close();
