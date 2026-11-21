import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {PGlite} from '@electric-sql/pglite';

const migrationPaths=[
  fileURLToPath(new URL('../supabase/migrations/202611160001_initial_schema.sql',import.meta.url)),
  fileURLToPath(new URL('../supabase/migrations/202611160002_payment_atomicity.sql',import.meta.url)),
  fileURLToPath(new URL('../supabase/migrations/202611160003_transactional_email_outbox.sql',import.meta.url)),
];
const uid1='10000000-0000-4000-8000-000000000001';
const uid2='10000000-0000-4000-8000-000000000002';

async function newTestDatabase(){
  const db=new PGlite();
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(
      id text PRIMARY KEY,name text NOT NULL,public boolean NOT NULL DEFAULT false,
      file_size_limit bigint,allowed_mime_types text[]
    );
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text NOT NULL,name text NOT NULL);
    CREATE TABLE public.unrelated_migration_sentinel(id text PRIMARY KEY,detail text);
    INSERT INTO public.unrelated_migration_sentinel VALUES ('keep','pre-existing public data');
    GRANT SELECT ON public.unrelated_migration_sentinel TO authenticated;
  `);
  for(const migrationPath of migrationPaths)await db.exec(await readFile(migrationPath,'utf8'));
  return db;
}

test('Supabase migrations create 55 app tables with explicit RLS and preserve non-user text IDs',async t=>{
  const db=await newTestDatabase();t.after(()=>db.close());
  const tables=await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  assert.equal(tables.rows.length,56);
  assert.equal(tables.rows.filter(row=>row.tablename!=='unrelated_migration_sentinel').length,55);
  const withoutRls=await db.query(`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname<>'unrelated_migration_sentinel' AND NOT c.relrowsecurity`);
  assert.deepEqual(withoutRls.rows,[]);
  const authTableNames=tables.rows.map(row=>row.tablename);
  assert.ok(!authTableNames.includes('sessions'));
  assert.ok(!authTableNames.includes('password_resets'));
  const columns=await db.query(`SELECT table_name,column_name,data_type FROM information_schema.columns
    WHERE table_schema='public' AND ((table_name='users' AND column_name IN ('id','password_hash')) OR (table_name='profiles' AND column_name IN ('user_id','dob')) OR (table_name='payments' AND column_name='amount'))
    ORDER BY table_name,column_name`);
  assert.deepEqual(columns.rows,[
    {table_name:'payments',column_name:'amount',data_type:'bigint'},
    {table_name:'profiles',column_name:'dob',data_type:'text'},
    {table_name:'profiles',column_name:'user_id',data_type:'uuid'},
    {table_name:'users',column_name:'id',data_type:'uuid'},
  ]);
  const broadPolicies=await db.query("SELECT tablename,policyname FROM pg_policies WHERE schemaname='public' AND qual='true' ORDER BY tablename,policyname");
  assert.deepEqual(broadPolicies.rows.map(row=>row.tablename),['faqs','pricing_versions','waybill_pricing']);
  const unrelated=await db.query("SELECT has_table_privilege('authenticated','public.unrelated_migration_sentinel','SELECT') AS kept,(SELECT detail FROM public.unrelated_migration_sentinel WHERE id='keep') AS detail");
  assert.deepEqual(unrelated.rows,[{kept:true,detail:'pre-existing public data'}]);
  const privateBucket=await db.query("SELECT public FROM storage.buckets WHERE id='rider-documents'");
  assert.deepEqual(privateBucket.rows,[{public:false}]);
  const privatePolicies=await db.query("SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'digitrans_private_%'");
  assert.deepEqual(privatePolicies.rows,[]);
});

test('RLS limits direct client reads to the caller, staff permission, or public catalogue',async t=>{
  const db=await newTestDatabase();t.after(()=>db.close());
  await db.exec(`
    INSERT INTO auth.users(id) VALUES ('${uid1}'),('${uid2}');
    INSERT INTO public.users(id,email,phone,role,status) VALUES
      ('${uid1}','one@example.test','+2348000000001','customer','active'),
      ('${uid2}','two@example.test','+2348000000002','super_admin','active');
    INSERT INTO public.profiles(user_id,full_name) VALUES ('${uid1}','Customer One'),('${uid2}','Admin Two');
    INSERT INTO public.roles(id,name) VALUES ('super_admin','super_admin');
    INSERT INTO public.permissions(id,key) VALUES ('users.read','users.read');
    INSERT INTO public.role_permissions(role_id,permission_id) VALUES ('super_admin','users.read');
    INSERT INTO public.faqs(id,question,answer) VALUES ('faq-1','Public question','Public answer');
    INSERT INTO storage.objects(bucket_id,name) VALUES
      ('public-site-assets','banner-1/asset.png'),('rider-documents','${uid1}/rider-doc-1/file.pdf');
  `);
  await db.query('SET ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[uid1]);
  const selfProfiles=await db.query('SELECT user_id FROM public.profiles ORDER BY user_id');
  assert.deepEqual(selfProfiles.rows,[{user_id:uid1}]);
  const selfUsers=await db.query('SELECT id FROM public.users ORDER BY id');
  assert.deepEqual(selfUsers.rows,[{id:uid1}]);
  const privateObjects=await db.query('SELECT name FROM storage.objects ORDER BY name');
  assert.deepEqual(privateObjects.rows,[{name:'banner-1/asset.png'}]);
  await assert.rejects(db.query('SELECT id FROM public.transactional_email_outbox'),error=>error.code==='42501');
  const ownPrivateFileInsert=await db.query(`INSERT INTO storage.objects(bucket_id,name) VALUES ('rider-documents','${uid1}/new-file/file.pdf')`).then(()=>null,error=>error);
  assert.equal(ownPrivateFileInsert?.code,'42501');
  const directTableWrite=await db.query(`INSERT INTO public.addresses(user_id,address_line) VALUES ('${uid1}','Example address')`).then(()=>null,error=>error);
  assert.equal(directTableWrite?.code,'42501');

  await db.query('RESET ROLE');
  await db.query('SET ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[uid2]);
  const staffUsers=await db.query('SELECT id FROM public.users ORDER BY id');
  assert.deepEqual(staffUsers.rows,[{id:uid1},{id:uid2}]);
  await db.query('RESET ROLE');
  await db.query('SET ROLE anon');
  const publicFaqs=await db.query('SELECT id FROM public.faqs');
  assert.deepEqual(publicFaqs.rows,[{id:'faq-1'}]);
  const publicObjects=await db.query('SELECT name FROM storage.objects ORDER BY name');
  assert.deepEqual(publicObjects.rows,[{name:'banner-1/asset.png'}]);
  await assert.rejects(db.query('SELECT id FROM public.users'),error=>error.code==='42501');
});
