import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSafeMigration,listMigrationFiles,readMigrationPostgresConfig,validateMigrationTarget} from '../scripts/apply-supabase-migrations.js';

const productionPhrase='I_REVIEWED_BACKUP_AND_CUTOVER_PLAN';

test('migration runner targets local databases only on loopback and requires explicit staging approval',()=>{
  assert.equal(validateMigrationTarget({target:'local',url:'postgres://u:p@127.0.0.1:54322/postgres'}),'local');
  assert.throws(()=>validateMigrationTarget({target:'local',url:'postgres://u:p@db.example/postgres'}),/loopback/);
  const unapprovedStaging={target:'staging',url:'postgres://u:p@db.example/postgres',env:{SUPABASE_STAGING_DB_HOST:'db.example',SUPABASE_STAGING_DB_USER:'u'}};
  assert.throws(()=>validateMigrationTarget(unapprovedStaging),/--allow-staging/);
  assert.throws(()=>validateMigrationTarget({...unapprovedStaging,argv:['--allow-staging'],env:{SUPABASE_STAGING_DB_HOST:'db.example'}}),/SUPABASE_STAGING_DB_USER/);
  const staging={...unapprovedStaging,argv:['--allow-staging']};
  assert.equal(validateMigrationTarget(staging),'staging');
  assert.throws(()=>validateMigrationTarget({...staging,env:{SUPABASE_STAGING_DB_HOST:'other.example',SUPABASE_STAGING_DB_USER:'u'}}),/exact database endpoint identity/);
  assert.throws(()=>validateMigrationTarget({...staging,env:{SUPABASE_STAGING_DB_HOST:'db.example',SUPABASE_STAGING_DB_USER:'another-user'}}),/exact database endpoint identity/);
});

test('production migration requires both command-line and environment confirmation',()=>{
  const options={target:'production',url:'postgres://u:p@db.example/postgres',argv:['--approve-production'],env:{SUPABASE_PRODUCTION_DB_HOST:'db.example',SUPABASE_PRODUCTION_DB_USER:'u'}};
  assert.throws(()=>validateMigrationTarget(options),/SUPABASE_PRODUCTION_MIGRATION_APPROVAL/);
  assert.throws(()=>validateMigrationTarget({...options,argv:[],env:{SUPABASE_PRODUCTION_DB_HOST:'db.example',SUPABASE_PRODUCTION_DB_USER:'u',SUPABASE_PRODUCTION_MIGRATION_APPROVAL:productionPhrase}}),/--approve-production/);
  assert.equal(validateMigrationTarget({...options,env:{SUPABASE_PRODUCTION_DB_HOST:'db.example',SUPABASE_PRODUCTION_DB_USER:'u',SUPABASE_PRODUCTION_MIGRATION_APPROVAL:productionPhrase}}),'production');
  assert.throws(()=>validateMigrationTarget({...options,env:{SUPABASE_PRODUCTION_DB_HOST:'other.example',SUPABASE_PRODUCTION_DB_USER:'u',SUPABASE_PRODUCTION_MIGRATION_APPROVAL:productionPhrase}}),/exact database endpoint identity/);
  assert.throws(()=>validateMigrationTarget({...options,target:'staging',argv:['--allow-staging']}),/SUPABASE_STAGING_DB_HOST/);
  assert.throws(()=>validateMigrationTarget({target:'production',url:'postgres://u:p@localhost/db',argv:['--approve-production'],env:{SUPABASE_PRODUCTION_DB_HOST:'localhost',SUPABASE_PRODUCTION_DB_USER:'u',SUPABASE_PRODUCTION_MIGRATION_APPROVAL:productionPhrase}}),/loopback/);
});

test('remote migration targets enforce verified TLS regardless of the invoking shell environment',()=>{
  const base={SUPABASE_DB_URL:'postgres://u:p@db.example/postgres?sslmode=disable',SUPABASE_DB_SSL:'disable',NODE_ENV:'development'};
  assert.throws(()=>readMigrationPostgresConfig(base,'staging'),/verified TLS/);
  const remote=readMigrationPostgresConfig({...base,SUPABASE_DB_URL:'postgres://u:p@db.example/postgres?sslmode=require'},'production');
  assert.equal(remote.ssl.rejectUnauthorized,true);
  const pooled=readMigrationPostgresConfig({...base,SUPABASE_DB_SSL:'require',SUPABASE_DB_URL:'postgres://u:p@pooler.example/postgres'},'production');
  assert.equal(pooled.ssl.rejectUnauthorized,false);
  assert.equal(readMigrationPostgresConfig({...base,SUPABASE_DB_URL:'postgres://u:p@localhost/postgres'},'local').ssl,false);
});

test('destructive migrations require a separate explicit confirmation',()=>{
  for(const sql of ['DROP POLICY old_policy ON public.users;','ALTER TABLE public.users DROP COLUMN phone;','TRUNCATE public.users;','DELETE FROM public.users;']){
    const migration={filename:'202611160003_test.sql',sql};
    assert.throws(()=>assertSafeMigration(migration),/--allow-destructive/);
    assert.doesNotThrow(()=>assertSafeMigration(migration,['--allow-destructive']));
  }
  assert.doesNotThrow(()=>assertSafeMigration({filename:'safe.sql',sql:'CREATE TABLE public.example(id text);'}));
});

test('migration plan is deterministic, checksum-addressed, and does not require a database URL',async()=>{
  const migrations=await listMigrationFiles();
  assert.equal(migrations.length,4);
  assert.deepEqual(migrations.map(item=>item.version),['202611160001','202611160002','202611160003','202611210001']);
  for(const migration of migrations){assert.match(migration.checksum,/^[0-9a-f]{64}$/);assert.ok(migration.sql.length>100);}
});
