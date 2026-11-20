import {AsyncLocalStorage} from 'node:async_hooks';
import fs from 'node:fs';
import {Pool,types} from 'pg';

const bundledSupabaseCa=(()=>{
  try{return fs.readFileSync(new URL('../prod-ca-2021.crt',import.meta.url),'utf8').trim();}
  catch{return '';}
})();

// Preserve the JavaScript-number API shape for exact whole-amount Postgres BIGINT columns.
// Refuse unsafe values rather than silently losing precision when JSON serializes a response.
types.setTypeParser(20,value=>{
  const number=Number(value);
  if(!Number.isSafeInteger(number))throw new Error('PostgreSQL integer is outside the safe JavaScript range.');
  return number;
});

const transactionContext=new AsyncLocalStorage();
const isolationLevels=new Set(['read committed','repeatable read','serializable']);
let pool;
let poolFactory=options=>new Pool(options);

export function readPostgresConfig(env=process.env){
  const raw=String(env.SUPABASE_DB_URL||'').trim();
  let url;
  try{url=new URL(raw);}catch{throw new Error('SUPABASE_DB_URL must be a PostgreSQL connection URL.');}
  if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||!url.username||!url.password){
    throw new Error('SUPABASE_DB_URL must include a PostgreSQL host and server-only credentials.');
  }
  const production=env.NODE_ENV==='production';
  const sslMode=String(url.searchParams.get('sslmode')||'').toLowerCase();
  if(production&&['disable','allow','prefer','no-verify'].includes(sslMode))throw new Error('SUPABASE_DB_URL must require verified TLS in production.');
  // Connection-string sslmode options can disable certificate/hostname checks. Strip them and
  // enforce the explicit TLS object below so the URL cannot override verification settings.
  for(const sslOption of ['sslmode','sslcert','sslkey','sslrootcert','sslpassword','uselibpqcompat'])url.searchParams.delete(sslOption);
  const max=Number(env.SUPABASE_DB_POOL_MAX||10);
  if(!Number.isInteger(max)||max<1||max>50)throw new Error('SUPABASE_DB_POOL_MAX must be an integer from 1 to 50.');
  // Vercel bundles the function separately from the repository filesystem. Use
  // encrypted transport there by default; a deployment can opt into strict
  // certificate/hostname verification by setting SUPABASE_DB_SSL=verify-full
  // together with SUPABASE_DB_CA.
  const sslPreference=String(env.SUPABASE_DB_SSL||(env.VERCEL?'require':'verify-full')).toLowerCase();
  if(!['verify-full','require','disable'].includes(sslPreference))throw new Error('SUPABASE_DB_SSL must be verify-full, require, or disable.');
  if(production&&sslPreference==='disable')throw new Error('SUPABASE_DB_SSL must require encrypted TLS in production.');
  const ca=String(env.SUPABASE_DB_CA||bundledSupabaseCa).trim();
  return {
    connectionString:url.toString(),
    max,
    idleTimeoutMillis:30_000,
    connectionTimeoutMillis:10_000,
    application_name:'digitrans-api',
    ...(sslPreference==='disable'?{ssl:false}:{ssl:{rejectUnauthorized:sslPreference==='verify-full',...(ca?{ca}:{} )}}),
  };
}

export function normalizeDatabaseError(error){
  const code=String(error?.code||'');
  const mapped={
    '23505':[409,'A record with those details already exists.'],
    '23503':[409,'This record is still referenced by another record.'],
    '23514':[400,'The record does not satisfy a required business rule.'],
    '23502':[400,'A required field is missing.'],
    '22P02':[400,'A field has an invalid format.'],
    '22023':[400,'The payment details do not match the expected values.'],
    '22000':[409,'The provider event conflicts with an earlier event.'],
    '55000':[409,'The record cannot be changed from its current state.'],
    'P0002':[404,'The requested record was not found.'],
    '40001':[409,'The operation conflicted with another update. Please retry.'],
    '40P01':[409,'The operation conflicted with another update. Please retry.'],
    '57014':[503,'The database operation timed out. Please retry.'],
    '53300':[503,'The database is temporarily at capacity. Please retry.'],
  }[code];
  const status=mapped?.[0]||500;
  const message=mapped?.[1]||'A database operation could not be completed.';
  const safe=Object.assign(new Error(message),{status,code:status>=500?'DATABASE_UNAVAILABLE':code||'DATABASE_ERROR'});
  return safe;
}

export function configurePostgresForTests({factory,client}={}){
  pool?.end?.();pool=client;
  poolFactory=factory||poolFactory;
}

function getPool(){
  if(!pool)pool=poolFactory(readPostgresConfig());
  return pool;
}

function currentTransaction(){return transactionContext.getStore()||null;}

export async function query(text,values=[]){
  try{
    const client=currentTransaction();
    return client?await client.query(text,values):await getPool().query(text,values);
  }catch(error){
    // Keep production logs useful for operators without ever logging connection
    // strings, query values, or other credential-bearing data.
    console.error('PostgreSQL query failed',{
      name:error?.name,
      code:error?.code,
      errno:error?.errno,
      message:error?.message,
      detail:error?.detail,
      routine:error?.routine,
    });
    throw normalizeDatabaseError(error);
  }
}

export async function queryOne(text,values=[]){
  const result=await query(text,values);
  return result.rows[0]??null;
}

export async function queryMany(text,values=[]){
  const result=await query(text,values);
  return result.rows;
}

export async function execute(text,values=[]){
  const result=await query(text,values);
  return {rowCount:result.rowCount,rows:result.rows};
}

export async function withTransaction(fn,{isolation='read committed'}={}){
  if(typeof fn!=='function')throw new TypeError('withTransaction requires a callback.');
  const normalized=String(isolation).toLowerCase();
  if(!isolationLevels.has(normalized))throw new Error('Unsupported database transaction isolation level.');
  const existing=currentTransaction();
  if(existing){
    const savepoint=`digitrans_sp_${Math.random().toString(36).slice(2,10)}`;
    try{await existing.query(`SAVEPOINT ${savepoint}`);}catch(error){throw normalizeDatabaseError(error);}
    try{const value=await fn();await existing.query(`RELEASE SAVEPOINT ${savepoint}`);return value;}
    catch(error){
      try{await existing.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);}catch{}
      throw error?.status?error:(error?.code?normalizeDatabaseError(error):error);
    }
  }
  let client;
  try{client=await getPool().connect();}
  catch(error){throw normalizeDatabaseError(error);}
  try{
    await client.query('BEGIN');
    await client.query(`SET TRANSACTION ISOLATION LEVEL ${normalized.toUpperCase()}`);
    const value=await transactionContext.run(client,fn);
    await client.query('COMMIT');
    return value;
  }catch(error){
    try{await client.query('ROLLBACK');}catch{}
    throw error?.status?error:(error?.code?normalizeDatabaseError(error):error);
  }finally{client.release();}
}

export async function healthcheck(){
  await query('SELECT 1');
  return {status:'ok'};
}

export async function closePostgres(){
  if(!pool)return;
  const active=pool;pool=undefined;
  await active.end?.();
}
