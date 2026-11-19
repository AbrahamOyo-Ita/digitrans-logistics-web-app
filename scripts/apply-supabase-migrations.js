import {createHash} from 'node:crypto';
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from 'pg';
import {readPostgresConfig} from '../server/postgres.js';

const root=path.dirname(fileURLToPath(import.meta.url));
const migrationsDir=path.join(root,'..','supabase','migrations');
const productionApproval='I_REVIEWED_BACKUP_AND_CUTOVER_PLAN';
const dangerousSql=/\b(?:DROP\b|TRUNCATE\b|DELETE\s+FROM\b)/i;

export function validateMigrationTarget({target,url,argv=[],env=process.env}={}){
  const normalized=String(target||'').toLowerCase();
  if(!['local','staging','production'].includes(normalized))throw new Error('Set SUPABASE_DB_TARGET to local, staging, or production before applying migrations.');
  let parsed;
  try{parsed=new URL(String(url||''));}catch{throw new Error('SUPABASE_DB_URL must be configured before applying migrations.');}
  if(!['postgres:','postgresql:'].includes(parsed.protocol))throw new Error('SUPABASE_DB_URL must be a PostgreSQL URL.');
  const hostname=parsed.hostname.replace(/^\[|\]$/g,'').toLowerCase();
  const loopback=['localhost','127.0.0.1','::1'].includes(hostname);
  if(normalized==='local'&&!loopback)throw new Error('A local migration target must use a loopback PostgreSQL host.');
  if(normalized!=='local'&&loopback)throw new Error('A staging or production target cannot use a loopback PostgreSQL host.');
  if(normalized!=='local'){
    const targetPrefix=`SUPABASE_${normalized.toUpperCase()}_DB`;
    const expectedHost=String(env[`${targetPrefix}_HOST`]||'').trim().replace(/^\[|\]$/g,'').toLowerCase();
    const expectedUser=String(env[`${targetPrefix}_USER`]||'').trim();
    if(!expectedHost||expectedHost!==hostname||!expectedUser||expectedUser!==parsed.username){
      throw new Error(`Set ${targetPrefix}_HOST and ${targetPrefix}_USER to the exact database endpoint identity for this isolated target.`);
    }
  }
  if(normalized==='staging'&&!argv.includes('--allow-staging'))throw new Error('Staging writes require the explicit --allow-staging flag.');
  if(normalized==='production'){
    if(!argv.includes('--approve-production')||env.SUPABASE_PRODUCTION_MIGRATION_APPROVAL!==productionApproval){
      throw new Error('Production writes require --approve-production and the exact SUPABASE_PRODUCTION_MIGRATION_APPROVAL confirmation value.');
    }
  }
  return normalized;
}

export async function listMigrationFiles(directory=migrationsDir){
  const names=(await readdir(directory)).filter(name=>/^\d{12}_[a-z0-9_]+\.sql$/.test(name)).sort();
  if(!names.length)throw new Error('No timestamped SQL migrations were found.');
  const migrations=[];
  for(const filename of names){
    const sql=await readFile(path.join(directory,filename),'utf8');
    migrations.push({filename,version:filename.slice(0,12),sql,checksum:createHash('sha256').update(sql).digest('hex')});
  }
  return migrations;
}

export function assertSafeMigration(migration,argv=[]){
  if(dangerousSql.test(migration.sql)&&!argv.includes('--allow-destructive')){
    throw new Error(`${migration.filename} contains destructive SQL; review it and pass --allow-destructive explicitly.`);
  }
}

export function readMigrationPostgresConfig(env,target){
  const connectionEnv=target==='local'?env:{...env,NODE_ENV:'production',SUPABASE_DB_SSL:env.SUPABASE_DB_SSL==='require'?'require':'verify-full'};
  return readPostgresConfig(connectionEnv);
}

async function dryRun(migrations,argv){
  for(const migration of migrations){
    assertSafeMigration(migration,argv);
    console.log(`${migration.filename}  sha256:${migration.checksum}`);
  }
  console.log(`Dry run only: ${migrations.length} migration(s) listed; no database connection was opened.`);
}

async function applyMigrations(migrations,{url,target,argv,env}){
  validateMigrationTarget({target,url,argv,env});
  for(const migration of migrations)assertSafeMigration(migration,argv);
  const client=new Client(readMigrationPostgresConfig(env,target));
  let connected=false;
  try{
    await client.connect();connected=true;
    for(const migration of migrations){
      await client.query('BEGIN');
      try{
        await client.query(`CREATE SCHEMA IF NOT EXISTS digitrans_meta`);
        await client.query(`REVOKE ALL ON SCHEMA digitrans_meta FROM PUBLIC, anon, authenticated`);
        await client.query(`CREATE TABLE IF NOT EXISTS digitrans_meta.schema_migrations (
          version text PRIMARY KEY,
          filename text NOT NULL,
          checksum text NOT NULL,
          applied_at timestamptz NOT NULL DEFAULT now()
        )`);
        await client.query(`CREATE SCHEMA IF NOT EXISTS supabase_migrations`);
        await client.query(`CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
          version text PRIMARY KEY,
          statements text[],
          name text
        )`);
        await client.query('ALTER TABLE supabase_migrations.schema_migrations ADD COLUMN IF NOT EXISTS statements text[]');
        await client.query('ALTER TABLE supabase_migrations.schema_migrations ADD COLUMN IF NOT EXISTS name text');
        const applied=await client.query('SELECT filename,checksum FROM digitrans_meta.schema_migrations WHERE version=$1',[migration.version]);
        const supabaseHistory=await client.query('SELECT version FROM supabase_migrations.schema_migrations WHERE version=$1',[migration.version]);
        if(applied.rowCount){
          if(applied.rows[0].checksum!==migration.checksum||applied.rows[0].filename!==migration.filename){
            throw new Error(`Applied migration ${migration.version} differs from the checked-in file. Restore the original file; do not edit an applied migration.`);
          }
          if(!supabaseHistory.rowCount)throw new Error(`Migration ${migration.version} is missing from Supabase CLI history; review the migration ledger before proceeding.`);
          await client.query('COMMIT');
          console.log(`${migration.filename} already applied; checksum matches.`);
          continue;
        }
        if(supabaseHistory.rowCount)throw new Error(`Migration ${migration.version} already appears in Supabase history without a matching checksum record; review it manually.`);
        await client.query(migration.sql);
        const migrationName=migration.filename.slice(13,-4);
        await client.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ($1,$2,$3)',[
          migration.version,migrationName,[migration.sql],
        ]);
        await client.query('INSERT INTO digitrans_meta.schema_migrations(version,filename,checksum) VALUES ($1,$2,$3)',[
          migration.version,migration.filename,migration.checksum,
        ]);
        await client.query('COMMIT');
        console.log(`${migration.filename} applied to the declared ${target} target.`);
      }catch(error){
        try{await client.query('ROLLBACK');}catch{}
        throw error;
      }
    }
  }catch(error){
    if(error?.code){
      console.error('Migration database error',{code:error.code,message:error.message,detail:error.detail,routine:error.routine});
      throw new Error('The database connection or migration failed. The active migration transaction was rolled back; diagnostics are withheld to avoid exposing connection details.');
    }
    throw error;
  }finally{if(connected)await client.end();}
}

async function main(argv=process.argv.slice(2),env=process.env){
  if(argv.includes('--help')){
    console.log('Usage: node scripts/apply-supabase-migrations.js [--dry-run | --apply] [--allow-staging | --approve-production] [--allow-destructive]');
    return;
  }
  const apply=argv.includes('--apply');
  if(apply&&argv.includes('--dry-run'))throw new Error('Choose either --apply or --dry-run, not both.');
  const migrations=await listMigrationFiles();
  if(!apply){await dryRun(migrations,argv);return;}
  const target=validateMigrationTarget({target:env.SUPABASE_DB_TARGET,url:env.SUPABASE_DB_URL,argv,env});
  await applyMigrations(migrations,{url:env.SUPABASE_DB_URL,target,argv,env});
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{
    console.error(`Migration stopped: ${error?.message||'unknown error'}`);
    process.exitCode=1;
  });
}
