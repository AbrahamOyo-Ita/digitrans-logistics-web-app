import {createHash,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from 'pg';
import {readPostgresConfig} from '../server/postgres.js';
import {getSupabaseAdmin,readSupabaseConfig} from '../server/supabase.js';
import {validateMigrationTarget} from './apply-supabase-migrations.js';

const root=path.dirname(fileURLToPath(import.meta.url));
const seedPath=path.join(root,'..','supabase','seed.sql');
const approvalPhrase='I_REVIEWED_BACKUP_AND_CUTOVER_PLAN';
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validAdminPassword=value=>value.length>=12&&/[A-Z]/.test(value)&&/[a-z]/.test(value)&&/[0-9]/.test(value)&&/[!@#$%^&*]/.test(value);

export async function bootstrapProductionAdmin(client,{env=process.env,admin=getSupabaseAdmin()}={}){
  const existing=await client.query("SELECT id FROM public.users WHERE role='super_admin' AND status='active' LIMIT 1");
  if(existing.rowCount)return {created:false};
  const email=String(env.BOOTSTRAP_ADMIN_EMAIL||'').trim().toLowerCase();
  const phone=String(env.BOOTSTRAP_ADMIN_PHONE||'').trim();
  const fullName=String(env.BOOTSTRAP_ADMIN_NAME||'DigiTrans Administrator').trim();
  const password=String(env.BOOTSTRAP_ADMIN_PASSWORD||'');
  if(!emailPattern.test(email)||phone.length<8||fullName.length<2||!validAdminPassword(password)){
    throw new Error('Administrator bootstrap needs BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PHONE, BOOTSTRAP_ADMIN_NAME (optional), and a 12+ character BOOTSTRAP_ADMIN_PASSWORD with uppercase, lowercase, number, and symbol.');
  }
  let authUser;
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName},app_metadata:{role:'super_admin',status:'active',session_version:randomUUID()}});
  if(error)throw new Error('Supabase Auth could not create the initial administrator. Check for an existing Auth identity and retry after review.');
  authUser=data.user;
  try{
    await client.query('INSERT INTO public.users(id,email,phone,role,status,email_verified,phone_verified) VALUES($1,$2,$3,$4,$5,1,0)',[authUser.id,email,phone,'super_admin','active']);
    await client.query('INSERT INTO public.profiles(user_id,full_name) VALUES($1,$2)',[authUser.id,fullName]);
  }catch(error){
    try{await admin.auth.admin.deleteUser(authUser.id);}catch{}
    throw error;
  }
  return {created:true,email,authUserId:authUser.id};
}

export async function seedDatabase({argv=process.argv.slice(2),env=process.env,clientFactory=options=>new Client(options),adminProvider=getSupabaseAdmin}={}){
  const sql=await readFile(seedPath,'utf8'),checksum=createHash('sha256').update(sql).digest('hex');
  const apply=argv.includes('--apply');
  if(argv.includes('--help')){
    console.log('Usage: node scripts/seed-supabase.js [--dry-run | --apply] [--allow-staging | --approve-production]');
    return {applied:false,checksum};
  }
  if(!apply){
    console.log(`supabase/seed.sql  sha256:${checksum}`);
    console.log('Dry run only: no database connection was opened.');
    return {applied:false,checksum};
  }
  const target=validateMigrationTarget({target:env.SUPABASE_DB_TARGET,url:env.SUPABASE_DB_URL,argv,env});
  if(target==='production'&&env.SUPABASE_PRODUCTION_MIGRATION_APPROVAL!==approvalPhrase)throw new Error('Production seed requires explicit backup and cutover approval.');
  readSupabaseConfig(env,{production:target!=='local'});
  const connectionEnv=target==='local'?env:{...env,NODE_ENV:'production'};
  const client=clientFactory(readPostgresConfig(connectionEnv));
  let connected=false,createdAdmin=null;
  try{
    await client.connect();connected=true;
    await client.query('BEGIN');
    await client.query(sql);
    if(target==='production'||argv.includes('--bootstrap-admin'))createdAdmin=await bootstrapProductionAdmin(client,{env,admin:adminProvider()});
    await client.query('COMMIT');
    console.log(`Authorization catalogue seed applied to the declared ${target} target.${createdAdmin?.created?` Initial administrator created: ${createdAdmin.email}.`:''}`);
    return {applied:true,target,checksum,createdAdmin};
  }catch(error){
    try{await client.query('ROLLBACK');}catch{}
    if(createdAdmin?.authUserId)try{await adminProvider().auth.admin.deleteUser(createdAdmin.authUserId);}catch{}
    throw error?.code?new Error('Database seed failed and its transaction was rolled back. Database diagnostics are withheld.'):error;
  }finally{if(connected)await client.end();}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  seedDatabase().catch(error=>{
    console.error(`Supabase seed stopped: ${error?.message||'unknown error'}`);
    process.exitCode=1;
  });
}
