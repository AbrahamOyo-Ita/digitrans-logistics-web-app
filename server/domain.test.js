import test from 'node:test';
import assert from 'node:assert/strict';
import db,{translateSql} from './db.js';
import {configurePostgresForTests,closePostgres} from './postgres.js';

const calls=[];
const transactionClient={
  async query(text,values=[]){calls.push({text,values});return {rows:text.startsWith('SELECT')?[{ok:1}]:[],rowCount:1};},
  release(){},
};
const fakePool={
  async query(text,values=[]){calls.push({text,values});return {rows:text.startsWith('SELECT')?[{ok:1}]:[],rowCount:1};},
  async connect(){return transactionClient;},
  async end(){},
};
configurePostgresForTests({client:fakePool});

test('PostgreSQL query adapter numbers placeholders without rewriting native SQL, strings, or comments',()=>{
  assert.equal(translateSql("SELECT now(),(current_date - interval '13 days')::date,created_at::date FROM public.deliveries WHERE id=?"),"SELECT now(),(current_date - interval '13 days')::date,created_at::date FROM public.deliveries WHERE id=$1");
  assert.equal(translateSql("SELECT * FROM public.users WHERE (CAST(? AS text) IS NULL OR role=?) AND email='a?b' -- ?\nAND id=?"),"SELECT * FROM public.users WHERE (CAST($1 AS text) IS NULL OR role=$2) AND email='a?b' -- ?\nAND id=$3");
});

test('database adapter is asynchronous PostgreSQL only and normalizes boolean flags to smallints',async()=>{
  calls.length=0;
  const row=await db.prepare('SELECT * FROM public.users WHERE status=? AND id=?').get(true,'user-1');
  assert.deepEqual(row,{ok:1});
  assert.deepEqual(calls.at(-1),{text:'SELECT * FROM public.users WHERE status=$1 AND id=$2',values:[1,'user-1']});
  const rows=await db.prepare('SELECT * FROM public.roles').all();
  assert.deepEqual(rows,[{ok:1}]);
  const write=await db.prepare('UPDATE public.banners SET active=? WHERE id=?').run(false,'banner-1');
  assert.equal(write.changes,1);
  assert.deepEqual(calls.at(-1).values,[0,'banner-1']);
});

test('async transaction awaits callbacks and commits or rolls back atomically',async()=>{
  calls.length=0;
  const transaction=db.transaction(async()=>{
    await db.prepare('UPDATE public.users SET status=? WHERE id=?').run(true,'user-1');
    return 'committed';
  });
  assert.equal(await transaction(),'committed');
  assert.deepEqual(calls.map(call=>call.text),['BEGIN','SET TRANSACTION ISOLATION LEVEL READ COMMITTED','UPDATE public.users SET status=$1 WHERE id=$2','COMMIT']);
  calls.length=0;
  const rollback=db.transaction(async()=>{
    await db.prepare('DELETE FROM public.users WHERE id=?').run('user-1');
    throw new Error('rollback test');
  });
  await assert.rejects(rollback(),/rollback test/);
  assert.equal(calls.at(-1).text,'ROLLBACK');
});

test('close ends the PostgreSQL pool without writing a local database file',async()=>{
  await closePostgres();
  assert.equal(calls.some(call=>/CREATE TABLE|INSERT INTO.*sessions/i.test(call.text)),false);
});
