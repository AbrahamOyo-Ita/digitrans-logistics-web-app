import test from 'node:test';
import assert from 'node:assert/strict';
import {configurePostgresForTests,closePostgres,execute,healthcheck,normalizeDatabaseError,query,queryMany,queryOne,readPostgresConfig,withTransaction} from './postgres.js';

const originalEnv={
  SUPABASE_DB_URL:process.env.SUPABASE_DB_URL,
  SUPABASE_DB_POOL_MAX:process.env.SUPABASE_DB_POOL_MAX,
  SUPABASE_DB_SSL:process.env.SUPABASE_DB_SSL,
  NODE_ENV:process.env.NODE_ENV,
};
function restoreEnv(){for(const [key,value] of Object.entries(originalEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}

function fakePool(){
  const calls=[];
  const client={
    async query(text,values){calls.push({scope:'client',text,values});return {rows:text.includes('SELECT')?[{value:7}]:[],rowCount:1};},
    release(){calls.push({scope:'client',text:'RELEASE'});},
  };
  const pool={
    async query(text,values){calls.push({scope:'pool',text,values});return {rows:text.includes('SELECT')?[{value:7}]:[],rowCount:1};},
    async connect(){calls.push({scope:'pool',text:'CONNECT'});return client;},
    async end(){calls.push({scope:'pool',text:'END'});},
    calls,
  };
  return pool;
}

test('Postgres config requires an explicit secure server connection and validates the pool size',()=>{
  assert.throws(()=>readPostgresConfig({}),/connection URL/);
  assert.throws(()=>readPostgresConfig({SUPABASE_DB_URL:'https://not-postgres.example'}),/PostgreSQL/);
  assert.throws(()=>readPostgresConfig({SUPABASE_DB_URL:'postgres://user:password@db.example/app?sslmode=disable',NODE_ENV:'production'}),/verified TLS/);
  assert.throws(()=>readPostgresConfig({SUPABASE_DB_URL:'postgres://user:password@db.example/app?sslmode=no-verify',NODE_ENV:'production'}),/verified TLS/);
  const remote=readPostgresConfig({SUPABASE_DB_URL:'postgres://user:password@db.example/app?sslmode=require&application_name=custom',NODE_ENV:'production'});
  assert.equal(remote.ssl.rejectUnauthorized,true);
  const pooled=readPostgresConfig({SUPABASE_DB_URL:'postgres://user:password@pooler.example/app',SUPABASE_DB_SSL:'require',NODE_ENV:'production'});
  assert.equal(pooled.ssl.rejectUnauthorized,false);
  assert.ok(!remote.connectionString.includes('sslmode'));
  assert.ok(remote.connectionString.includes('application_name=custom'));
  assert.throws(()=>readPostgresConfig({SUPABASE_DB_URL:'postgres://user:password@localhost/app',SUPABASE_DB_POOL_MAX:'51'}),/from 1 to 50/);
  const config=readPostgresConfig({SUPABASE_DB_URL:'postgres://user:password@localhost/app',SUPABASE_DB_SSL:'disable',SUPABASE_DB_POOL_MAX:'4',NODE_ENV:'development'});
  assert.equal(config.max,4);
  assert.equal(config.ssl,false);
  assert.equal(config.application_name,'digitrans-api');
});

test('query helpers use Postgres results without logging SQL errors',async()=>{
  process.env.SUPABASE_DB_URL='postgres://user:password@localhost/app';
  process.env.SUPABASE_DB_SSL='disable';
  const pool=fakePool();
  configurePostgresForTests({factory:()=>pool});
  assert.deepEqual(await queryOne('SELECT $1 AS value',[7]),{value:7});
  assert.deepEqual(await queryMany('SELECT 1 AS value'),[{value:7}]);
  assert.deepEqual(await execute('UPDATE example SET value=$1',[3]),{rowCount:1,rows:[]});
  assert.deepEqual(await healthcheck(),{status:'ok'});
  assert.equal(pool.calls.filter(call=>call.scope==='pool'&&!['CONNECT','END'].includes(call.text)).length,4);
  await closePostgres();
  restoreEnv();
});

test('nested transaction scopes use savepoints and outer failures roll back',async()=>{
  process.env.SUPABASE_DB_URL='postgres://user:password@localhost/app';
  process.env.SUPABASE_DB_SSL='disable';
  const pool=fakePool();
  configurePostgresForTests({factory:()=>pool});
  const value=await withTransaction(async()=>{
    await query('UPDATE one SET value=1');
    await withTransaction(async()=>{await query('UPDATE two SET value=2');});
    return 'committed';
  },{isolation:'serializable'});
  assert.equal(value,'committed');
  assert.ok(pool.calls.some(call=>call.text==='BEGIN'));
  assert.ok(pool.calls.some(call=>call.text==='SET TRANSACTION ISOLATION LEVEL SERIALIZABLE'));
  assert.ok(pool.calls.some(call=>call.text.startsWith('SAVEPOINT digitrans_sp_')));
  assert.ok(pool.calls.some(call=>call.text==='COMMIT'));
  await assert.rejects(withTransaction(async()=>{await query('UPDATE bad SET value=1');throw new Error('business failure');}),/business failure/);
  assert.ok(pool.calls.filter(call=>call.text==='ROLLBACK').length>=1);
  await closePostgres();
  restoreEnv();
});

test('database errors are mapped to safe public messages',()=>{
  const unique=normalizeDatabaseError({code:'23505',detail:'secret table details'});
  assert.equal(unique.status,409);
  assert.equal(unique.message,'A record with those details already exists.');
  assert.ok(!unique.message.includes('secret'));
  const invalidPayment=normalizeDatabaseError({code:'22023',detail:'provider secret'});
  assert.equal(invalidPayment.status,400);
  assert.ok(!invalidPayment.message.includes('provider secret'));
  assert.equal(normalizeDatabaseError({code:'55000'}).status,409);
  assert.equal(normalizeDatabaseError({code:'P0002'}).status,404);
  const unknown=normalizeDatabaseError({code:'XX000',detail:'connection string'});
  assert.equal(unknown.status,500);
  assert.equal(unknown.message,'A database operation could not be completed.');
});
