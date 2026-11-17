import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {PGlite} from '@electric-sql/pglite';
import {seedDatabase} from '../scripts/seed-supabase.js';

const files=[
  fileURLToPath(new URL('../supabase/migrations/202611160001_initial_schema.sql',import.meta.url)),
  fileURLToPath(new URL('../supabase/migrations/202611160002_payment_atomicity.sql',import.meta.url)),
];
const seedPath=fileURLToPath(new URL('../supabase/seed.sql',import.meta.url));

test('Supabase seed is idempotent and creates authorization catalogues without demo users',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text NOT NULL,public boolean NOT NULL DEFAULT false,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text NOT NULL,name text NOT NULL);
  `);
  for(const file of files)await db.exec(await readFile(file,'utf8'));
  const seed=await readFile(seedPath,'utf8');
  await db.exec(seed);await db.exec(seed);
  const counts=await db.query(`SELECT
    (SELECT count(*)::int FROM public.roles) AS roles,
    (SELECT count(*)::int FROM public.permissions) AS permissions,
    (SELECT count(*)::int FROM public.role_permissions) AS grants,
    (SELECT count(*)::int FROM public.users) AS users`);
  assert.deepEqual(counts.rows,[{roles:11,permissions:23,grants:50,users:0}]);
  const grants=await db.query(`SELECT count(*)::int AS count FROM public.role_permissions rp
    JOIN public.roles r ON r.id=rp.role_id JOIN public.permissions p ON p.id=rp.permission_id
    WHERE r.name='customer'`);
  assert.equal(grants.rows[0].count,0);
  const superAdmin=await db.query(`SELECT count(*)::int AS count FROM public.role_permissions WHERE role_id='super_admin'`);
  assert.equal(superAdmin.rows[0].count,23);
});

test('remote staging seed requires HTTPS Supabase Auth even from a development shell',async()=>{
  const env={
    SUPABASE_DB_TARGET:'staging',
    SUPABASE_DB_URL:'postgresql://seed_user:secret@staging-db.example/postgres',
    SUPABASE_STAGING_DB_HOST:'staging-db.example',
    SUPABASE_STAGING_DB_USER:'seed_user',
    SUPABASE_URL:'http://staging-auth.example',
    SUPABASE_SERVICE_ROLE_KEY:'sb_secret_abcdefghij',
    NODE_ENV:'development',
  };
  await assert.rejects(seedDatabase({argv:['--apply','--allow-staging'],env,clientFactory:()=>{throw new Error('Database client must not be created.');}}),/SUPABASE_URL must use HTTPS in production/);
});
