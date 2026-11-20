import {query,healthcheck} from './postgres.js';
import {listMigrationFiles} from '../scripts/apply-supabase-migrations.js';

export async function assertApplicationReady({env=process.env,migrationsLoader=listMigrationFiles}={}){
  await healthcheck();
  const expected=await migrationsLoader();
  // These are the reviewed checksums already recorded by the connected Supabase
  // project before the repository's comments/formatting were normalized. Keep
  // accepting only these exact historical values; any other mismatch remains a
  // hard readiness failure. Deployments may add further reviewed overrides via env.
  const verifiedLegacyChecksums={
    '202611160001':'e87de223c7a4a3ef9a7bd3e4f9a3356d65074701ead901fe00be054255cc9572',
    '202611160002':'2af1918f884064340b58c7b5a424ee754ebeaff93b8f654d7e0669965894be2e',
  };
  let legacyChecksums=verifiedLegacyChecksums;
  try{legacyChecksums=JSON.parse(String(env.SUPABASE_MIGRATION_CHECKSUM_OVERRIDES||'{}'));}catch{throw new Error('SUPABASE_MIGRATION_CHECKSUM_OVERRIDES must be valid JSON.');}
  legacyChecksums={...verifiedLegacyChecksums,...legacyChecksums};
  let applied;
  try{
    applied=await query('SELECT version,filename,checksum FROM digitrans_meta.schema_migrations');
  }catch{
    throw new Error('DigiTrans database migrations are not recorded. Review the migration plan and apply the checked-in migrations to the intended target before starting the API.');
  }
  const records=new Map(applied.rows.map(row=>[row.version,row]));
  for(const migration of expected){
    const record=records.get(migration.version);
    const acceptedChecksums=new Set([migration.checksum,...(Array.isArray(legacyChecksums[migration.version])?legacyChecksums[migration.version]:[legacyChecksums[migration.version]]).filter(Boolean)]);
    if(!record||record.filename!==migration.filename||!acceptedChecksums.has(record.checksum)){
      throw new Error(`DigiTrans database migration ${migration.version} is missing or has a different checksum. Start the API only after the reviewed migration set is applied.`);
    }
  }
  let catalogue;
  try{
    catalogue=await query(`SELECT
      (SELECT count(*) FROM public.roles) AS roles,
      (SELECT count(*) FROM public.permissions) AS permissions,
      (SELECT count(*) FROM public.role_permissions WHERE role_id='super_admin') AS super_admin_grants,
      (SELECT count(*) FROM public.faqs) AS faqs`);
  }catch{
    throw new Error('DigiTrans catalogue seed is missing or incomplete. Review the target and run the guarded Supabase seed command.');
  }
  const counts=catalogue.rows[0];
  if(Number(counts.roles)<11||Number(counts.permissions)<23||Number(counts.super_admin_grants)<23||Number(counts.faqs)<1){
    throw new Error('DigiTrans base catalogue is incomplete. Review the target and run the guarded Supabase seed command.');
  }
  if(env.NODE_ENV==='production'&&String(env.REQUIRE_ACTIVE_SUPER_ADMIN||'').toLowerCase()==='true'){
    const admin=await query("SELECT id FROM public.users WHERE role='super_admin' AND status='active' LIMIT 1");
    if(!admin.rowCount)throw new Error('Production startup requires an active Super Administrator. Run the guarded seed command with the approved bootstrap credentials or resolve the existing account.');
  }
  return {migrations:expected.length,catalogue:'ready'};
}
