import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {PGlite} from '@electric-sql/pglite';
import {translateSql} from './db.js';
import {processTransactionalEmailOutbox} from './email-outbox.js';

const migrations=[
 fileURLToPath(new URL('../supabase/migrations/202611160001_initial_schema.sql',import.meta.url)),
 fileURLToPath(new URL('../supabase/migrations/202611160002_payment_atomicity.sql',import.meta.url)),
 fileURLToPath(new URL('../supabase/migrations/202611160003_transactional_email_outbox.sql',import.meta.url)),
];
const customerId='30000000-0000-4000-8000-000000000001';
const riderId='30000000-0000-4000-8000-000000000002';
const appUrl='https://www.digitransdelivery.com';
const configuredEnv={RESEND_API_KEY:'re_test_key',RESEND_FROM_EMAIL:'DigiTrans <no-reply@example.test>',APP_URL:appUrl};

function createAdapter(pg){
 return {
  prepare(sql){
   const statement=translateSql(sql);
   return {
    get:async(...values)=>(await pg.query(statement,values)).rows[0]||null,
    all:async(...values)=>(await pg.query(statement,values)).rows,
    run:async(...values)=>{const result=await pg.query(statement,values);return {changes:result.rowCount,rows:result.rows};},
   };
  },
  transaction(callback){
   return async(...args)=>{
    await pg.query('BEGIN');
    try{const result=await callback(...args);await pg.query('COMMIT');return result;}
    catch(error){await pg.query('ROLLBACK');throw error;}
   };
  },
 };
}

async function createDatabase(){
 const pg=new PGlite();
 await pg.exec(`
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users(id uuid PRIMARY KEY);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
    AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  CREATE SCHEMA storage;
  CREATE TABLE storage.buckets(id text PRIMARY KEY,name text NOT NULL,public boolean NOT NULL DEFAULT false,file_size_limit bigint,allowed_mime_types text[]);
  CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text NOT NULL,name text NOT NULL);
 `);
 for(const path of migrations)await pg.exec(await readFile(path,'utf8'));
 await pg.exec(`
  INSERT INTO auth.users(id) VALUES ('${customerId}'),('${riderId}');
  INSERT INTO public.users(id,email,phone,role,status) VALUES
    ('${customerId}','customer@example.test','+2348000000031','customer','active'),
    ('${riderId}','rider@example.test','+2348000000032','rider','active');
  INSERT INTO public.profiles(user_id,full_name) VALUES ('${customerId}','Ada Customer'),('${riderId}','Tomi Rider');
  INSERT INTO public.riders(user_id,approval_status) VALUES ('${riderId}','approved');
  INSERT INTO public.deliveries(id,reference,customer_id,pickup_address,dropoff_address,recipient_name,recipient_phone,fee)
    VALUES ('delivery-email-1','DT-EMAIL-1','${customerId}','Private pickup address','Private dropoff address','Parcel recipient','+2348000000033',2500);
  INSERT INTO public.delivery_assignments(id,delivery_id,rider_id,status,reference)
    VALUES ('assignment-email-1','delivery-email-1','${riderId}','assigned','ASG-EMAIL-1');
  UPDATE public.deliveries SET status='assigned' WHERE id='delivery-email-1';
  UPDATE public.delivery_assignments SET status='reassigned' WHERE id='assignment-email-1';
  INSERT INTO public.delivery_assignments(id,delivery_id,rider_id,status,reference)
    VALUES ('assignment-email-2','delivery-email-1','${riderId}','assigned','ASG-EMAIL-2');
  INSERT INTO public.payments(id,reference,user_id,delivery_id,amount,provider,status)
    VALUES ('payment-email-1','PAY-EMAIL-1','${customerId}','delivery-email-1',2500,'paystack','initiated');
  UPDATE public.payments SET status='successful' WHERE id='payment-email-1';
  INSERT INTO public.market_runs(id,reference,customer_id,contact_name,contact_phone,delivery_location,status,service_fee)
    VALUES ('market-email-1','MR-EMAIL-1','${customerId}','Ada Customer','+2348000000031','Private market delivery address','submitted',1500);
  UPDATE public.market_runs SET status='awaiting_customer_approval',final_total=18500 WHERE id='market-email-1';
  INSERT INTO public.waybills(id,reference,customer_id,sender_name,sender_phone,recipient_name,recipient_phone,destination_city,destination_address,origin,destination,status,fee)
    VALUES ('waybill-email-1','WB-EMAIL-1','${customerId}','Ada Customer','+2348000000031','Parcel recipient','+2348000000033','Lagos','Private parcel address','Calabar','Lagos','submitted',7000);
  UPDATE public.waybills SET waybill_number='DWB-EMAIL-1',status='in_transit',payment_status='successful' WHERE id='waybill-email-1';
  INSERT INTO public.payments(id,reference,user_id,waybill_id,amount,provider,status)
    VALUES ('payment-email-2','PAY-WAYBILL-1','${customerId}','waybill-email-1',7000,'manual_reconciliation','successful');
 `);
 return {pg,client:createAdapter(pg)};
}

test('committed delivery, rider assignment, payment, Market Run and waybill events create durable, private outbox mail',async t=>{
 const {pg,client}=await createDatabase();t.after(()=>pg.close());
 const queued=await pg.query(`SELECT event_type,entity_type,entity_id,recipient_user_id,payload FROM public.transactional_email_outbox ORDER BY created_at,id`);
 assert.equal(queued.rows.length,11);
 assert.deepEqual(queued.rows.reduce((counts,row)=>(counts[row.event_type]=(counts[row.event_type]||0)+1,counts),{}),{
  delivery_order_placed:1,delivery_status:2,rider_assignment:2,payment_confirmed:2,market_run_status:2,waybill_status:2,
 });
 assert.ok(queued.rows.every(row=>!JSON.stringify(row.payload).includes('Private')),'outbox payloads do not copy addresses or other recipient details');
 assert.equal(queued.rows.find(row=>row.event_type==='rider_assignment').recipient_user_id,riderId);

 const messages=[];
 const sent=await processTransactionalEmailOutbox({
  client,env:configuredEnv,limit:20,concurrency:3,
  send:async message=>{messages.push(message);return {id:`resend-${message.idempotencyKey}`};},
 });
 assert.deepEqual(sent,{configured:true,claimed:11,sent:11,retrying:0,failed:0,skipped:0});
 assert.equal(messages.length,11);
 assert.equal(messages.filter(message=>message.to==='rider@example.test').length,2);
 assert.equal(messages.find(message=>message.subject.includes('Market Run estimate')).to,'customer@example.test');
 assert.ok(messages.every(message=>message.html.includes('<img')&&message.text.includes('DigiTrans Logistics')));
 assert.ok(messages.every(message=>!message.html.includes('Private pickup address')&&!message.html.includes('Private dropoff address')));
 const sentRows=await pg.query("SELECT status,count(*)::int AS count FROM public.transactional_email_outbox GROUP BY status ORDER BY status");
 assert.deepEqual(sentRows.rows,[{status:'sent',count:11}]);
 const retry=await processTransactionalEmailOutbox({client,env:configuredEnv,send:async()=>{throw new Error('Unexpected duplicate send');}});
 assert.equal(retry.claimed,0);
});

test('outbox remains pending without provider configuration, then retries safely with a stable idempotency key',async t=>{
 const {pg,client}=await createDatabase();t.after(()=>pg.close());
 const unconfigured=await processTransactionalEmailOutbox({client,env:{},send:async()=>{throw new Error('Must not call provider');}});
 assert.deepEqual(unconfigured,{configured:false,claimed:0,sent:0,retrying:0,failed:0,skipped:0});
 const idempotencyKeys=[];
 const first=await processTransactionalEmailOutbox({client,env:configuredEnv,limit:1,concurrency:1,send:async message=>{
  idempotencyKeys.push(message.idempotencyKey);throw new Error('Temporary provider failure');
 }});
 assert.deepEqual(first,{configured:true,claimed:1,sent:0,retrying:1,failed:0,skipped:0});
 const failedRow=(await pg.query("SELECT id,status,attempts,available_at,locked_until FROM public.transactional_email_outbox ORDER BY created_at,id LIMIT 1")).rows[0];
 assert.equal(failedRow.status,'pending');assert.equal(failedRow.attempts,1);assert.equal(failedRow.locked_until,null);
 await pg.query('UPDATE public.transactional_email_outbox SET available_at=now()-interval \'1 minute\' WHERE id=$1',[failedRow.id]);
 const second=await processTransactionalEmailOutbox({client,env:configuredEnv,limit:1,concurrency:1,send:async message=>{
  idempotencyKeys.push(message.idempotencyKey);return {id:'resend-after-retry'};
 }});
 assert.deepEqual(second,{configured:true,claimed:1,sent:1,retrying:0,failed:0,skipped:0});
 assert.deepEqual(idempotencyKeys,[failedRow.id,failedRow.id]);
 const persisted=(await pg.query('SELECT status,provider_id,attempts FROM public.transactional_email_outbox WHERE id=$1',[failedRow.id])).rows[0];
 assert.deepEqual(persisted,{status:'sent',provider_id:'resend-after-retry',attempts:2});
});
