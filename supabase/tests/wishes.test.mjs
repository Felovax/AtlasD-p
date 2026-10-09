/**
 * Tester reservasjon av ønsker (supabase/migrations/*_wish_reservations.sql) mot PostgreSQL (PGlite).
 *
 *   node supabase/tests/wishes.test.mjs
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, '..', 'migrations');
const db = new PGlite();

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
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
}

const ADMIN = '11111111-1111-4111-8111-111111111111';
await db.exec(`insert into auth.users (id, email) values ('${ADMIN}', 'forelder@example.com');
               insert into private.admins (user_id) values ('${ADMIN}');`);

let ip = 0;
async function as(role, sql, params = [], { user = '', clientIp } = {}) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user]);
  await db.query(`select set_config('request.headers', $1, false)`, [JSON.stringify({ 'x-forwarded-for': clientIp ?? `10.1.0.${++ip}` })]);
  await db.exec(`set role ${role}`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec('reset role');
  }
}
const reserve = (id, token, opts) => as('anon', 'select public.reserve_wish($1, $2) as r', [id, token], opts).then((r) => r.rows[0].r.status);
const unreserve = (id, token) => as('anon', 'select public.unreserve_wish($1, $2) as r', [id, token]).then((r) => r.rows[0].r.status);
const reserved = () => as('anon', 'select public.reserved_wishes() as r').then((r) => r.rows[0].r);
const uuid = () => crypto.randomUUID();

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
const rejects = (p, re) => assert.rejects(p, (e) => (assert.match(String(e.message), re), true));

console.log('Ønskeliste – reservasjoner:');

const mine = uuid();
await test('en gjest kan reservere et ønske', async () => {
  assert.equal(await reserve('gyngehest', mine), 'reserved');
  assert.deepEqual(await reserved(), ['gyngehest']);
});

await test('samme gjest kan sende på nytt uten feil (f.eks. etter nettbrudd)', async () => {
  assert.equal(await reserve('gyngehest', mine), 'reserved');
});

await test('en annen gjest får «allerede reservert»', async () => {
  assert.equal(await reserve('gyngehest', uuid()), 'already_reserved');
});

await test('bare den som reserverte kan angre', async () => {
  assert.equal(await unreserve('gyngehest', uuid()), 'not_yours');
  assert.deepEqual(await reserved(), ['gyngehest']);
  assert.equal(await unreserve('gyngehest', mine), 'released');
  assert.deepEqual(await reserved(), []);
});

await test('gjester kan ikke lese tabellen (og ser aldri hvem/koder)', async () => {
  await rejects(as('anon', 'select * from public.wish_reservations'), /permission denied/);
  await rejects(as('anon', `insert into public.wish_reservations values ('x', repeat('a', 64))`), /permission denied/);
  await rejects(as('anon', `delete from public.wish_reservations`), /permission denied/);
  await rejects(as('anon', 'select private.wish_rate_limit()'), /permission denied/);
});

await test('koden lagres bare som hash', async () => {
  const token = uuid();
  await reserve('minnebok', token);
  const row = (await db.query(`select token_hash from public.wish_reservations where wish_id = 'minnebok'`)).rows[0];
  assert.match(row.token_hash, /^[0-9a-f]{64}$/);
  assert.notEqual(row.token_hash, token);
});

await test('avviser ugyldige ønske-ID-er', async () => {
  await rejects(reserve('DROP TABLE', uuid()), /invalid_wish/);
  await rejects(reserve('a'.repeat(61), uuid()), /invalid_wish/);
  await rejects(reserve('vognpose', null), /invalid_token/);
});

await test('begrenser mange reservasjoner fra samme nettverk', async () => {
  const clientIp = '203.0.113.50';
  for (let i = 0; i < 12; i++) await reserve(`spam-${i}`, uuid(), { clientIp });
  await rejects(reserve('spam-12', uuid(), { clientIp }), /rate_limited/);
});

await test('administrator kan se og fjerne reservasjoner', async () => {
  const rows = await as('authenticated', 'select wish_id from public.wish_reservations', [], { user: ADMIN });
  assert.ok(rows.rows.length > 0);
  await as('authenticated', `delete from public.wish_reservations where wish_id like 'spam-%'`, [], { user: ADMIN });
  assert.deepEqual(await reserved(), ['minnebok']);
});

await test('vanlig innlogget bruker ser ingenting', async () => {
  const other = uuid();
  await db.exec(`insert into auth.users (id) values ('${other}')`);
  const rows = await as('authenticated', 'select * from public.wish_reservations', [], { user: other });
  assert.equal(rows.rows.length, 0);
});

console.log(`\n${passed} tester bestått${process.exitCode ? ' – men noen feilet!' : '.'}`);
await db.close();
