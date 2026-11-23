import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {PGlite} from '@electric-sql/pglite';
import {seedDatabase} from '../scripts/seed-supabase.js';

const files=[
  fileURLToPath(new URL('../supabase/migrations/202611160001_initial_schema.sql',import.meta.url)),
  fileURLToPath(new URL('../supabase/migrations/202611160002_payment_atomicity.sql',import.meta.url)),
  fileURLToPath(new URL('../supabase/migrations/202611160003_transactional_email_outbox.sql',import.meta.url)),
  fileURLToPath(new URL('../supabase/migrations/202611220001_admin_invites_rbac_audit.sql',import.meta.url)),
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
  const roleMatrix=await db.query(`SELECT role_id,p.key FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id`);
  const keys=new Set(roleMatrix.rows.map(row=>`${row.role_id}:${row.key}`));
  assert.ok(keys.has('ops_officer:deliveries.assign'));
  assert.ok(keys.has('rider_manager:riders.review'));
  assert.ok(keys.has('vendor_manager:vendors.review'));
  assert.ok(keys.has('finance_officer:finance.manage'));
  assert.ok(keys.has('investment_manager:investments.manage'));
  assert.equal(keys.has('finance_officer:admin.manage'),false);
  const adminManagementGrant=await db.query(`SELECT role_id FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id WHERE p.key='admin.manage'`);
  assert.deepEqual(adminManagementGrant.rows,[{role_id:'super_admin'}]);
  const zoneStats=await db.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE active=1)::int AS active_count FROM public.service_zones`);
  assert.deepEqual(zoneStats.rows,[{total:12,active_count:12}]);
  const pricingRow=await db.query(`SELECT version,base_fee,per_km,min_fee,student_flat,vendor_discount_pct,market_runs_fee FROM public.pricing_versions`);
  assert.deepEqual(pricingRow.rows,[{version:'Calabar Standard v1.0',base_fee:500,per_km:250,min_fee:1000,student_flat:500,vendor_discount_pct:10,market_runs_fee:1500}]);
  const wbCount=await db.query(`SELECT count(*)::int AS total FROM public.waybill_pricing`);
  assert.equal(wbCount.rows[0].total,12);
  const settingsRows=await db.query(`SELECT key,value FROM public.system_settings`);
  const settingsMap=Object.fromEntries(settingsRows.rows.map(r=>[r.key,r.value]));
  assert.equal(settingsMap.support_phone,undefined);
  assert.equal(settingsMap.current_rider_agreement_version,'1.0');
  assert.ok(settingsMap.current_rider_agreement_text?.length>40);
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
