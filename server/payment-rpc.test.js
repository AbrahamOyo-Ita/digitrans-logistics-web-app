import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {PGlite} from '@electric-sql/pglite';

const migrations=[
  fileURLToPath(new URL('../supabase/migrations/202611160001_initial_schema.sql',import.meta.url)),
  fileURLToPath(new URL('../supabase/migrations/202611160002_payment_atomicity.sql',import.meta.url)),
];
const userId='20000000-0000-4000-8000-000000000001';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const parsed=value=>typeof value==='string'?JSON.parse(value):value;

async function database(){
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
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text NOT NULL,public boolean NOT NULL DEFAULT false,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text NOT NULL,name text NOT NULL);
  `);
  for(const path of migrations)await db.exec(await readFile(path,'utf8'));
  await db.exec(`
    INSERT INTO auth.users(id) VALUES ('${userId}');
    INSERT INTO public.users(id,email,phone,role,status) VALUES ('${userId}','payee@example.test','+2348000000010','customer','active');
    INSERT INTO public.deliveries(id,reference,customer_id,pickup_address,dropoff_address,recipient_name,recipient_phone,fee)
      VALUES ('delivery-1','DLV-1','${userId}','Pickup','Dropoff','Recipient','+2348000000020',2500);
    INSERT INTO public.payments(id,reference,user_id,delivery_id,amount,provider,status)
      VALUES ('payment-1','PAY-ONE','${userId}','delivery-1',2500,'paystack','initiated');
    INSERT INTO public.payments(id,reference,user_id,amount,provider,status)
      VALUES ('payment-2','PAY-TWO','${userId}',900,'paystack','initiated');
    INSERT INTO public.investors(user_id) VALUES ('${userId}');
    INSERT INTO public.opportunities(id,title,min_investment,capacity,subscribed,duration_months,projected_return_pct,status)
      VALUES ('opportunity-1','Limited opportunity',100,1000,950,6,12,'published');
    INSERT INTO public.investment_applications(id,investor_id,opportunity_id,amount,status,reference)
      VALUES ('application-1','${userId}','opportunity-1',100,'approved','APP-ONE');
    INSERT INTO public.payments(id,reference,user_id,investment_application_id,amount,provider,status)
      VALUES ('payment-3','PAY-INVEST','${userId}','application-1',100,'paystack','initiated');
  `);
  return db;
}

test('verified Paystack settlement is atomic, capacity-aware, and idempotent under retry',async t=>{
  const db=await database();t.after(()=>db.close());
  await db.query('SET ROLE authenticated');
  const privateRpc=await db.query(`SELECT public.apply_verified_paystack_payment(NULL::text,NULL::text,NULL::bigint,NULL::text,NULL::text,NULL::text,NULL::uuid,NULL::text)`).then(()=>null,error=>error);
  assert.equal(privateRpc?.code,'42501');
  const privateEvents=await db.query('SELECT * FROM public.payment_provider_events').then(()=>null,error=>error);
  assert.equal(privateEvents?.code,'42501');
  await db.query('RESET ROLE');
  await db.query('SET ROLE service_role');
  const args=['payment-1','PAY-ONE',250000,'NGN','paystack-tx-1',hash('success-event')];
  const first=parsed((await db.query(`SELECT public.apply_verified_paystack_payment($1,$2,$3,$4,$5,$6,NULL,NULL) AS result`,args)).rows[0].result);
  assert.deepEqual(first,{duplicate:false,paymentId:'payment-1',underReview:false,status:'successful'});
  const duplicate=parsed((await db.query(`SELECT public.apply_verified_paystack_payment($1,$2,$3,$4,$5,$6,NULL,NULL) AS result`,args)).rows[0].result);
  assert.deepEqual(duplicate,{...first,duplicate:true});
  await assert.rejects(db.query(`SELECT public.apply_verified_paystack_payment($1,$2,$3,$4,$5,$6,NULL,NULL)`,[
    'payment-2',...args.slice(1),
  ]),error=>error.code==='22000');
  await db.query('RESET ROLE');
  assert.equal((await db.query("SELECT status FROM public.payments WHERE id='payment-1'")).rows[0].status,'successful');
  assert.equal((await db.query("SELECT payment_status FROM public.deliveries WHERE id='delivery-1'")).rows[0].payment_status,'successful');
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM public.financial_ledger WHERE reference='LED-PAY-PAY-ONE'")).rows[0].n),1);
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM public.notifications WHERE related_id='payment-1'")).rows[0].n),1);

  await assert.rejects(db.query(`SELECT public.apply_verified_paystack_payment($1,$2,$3,$4,$5,$6,NULL,NULL)`,[
    'payment-2','PAY-TWO',12345,'NGN','bad-amount',hash('bad-amount-event'),
  ]),error=>error.code==='22023');
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM public.payment_provider_events WHERE event_id='bad-amount'")).rows[0].n),0);
  await assert.rejects(db.query(`SELECT public.apply_verified_paystack_payment($1,$2,$3,$4,$5,$6,NULL,NULL)`,[
    'payment-2','OTHER-PAYMENT',90000,'NGN','wrong-reference',hash('wrong-reference-event'),
  ]),error=>error.code==='22023');
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM public.payment_provider_events WHERE event_id='wrong-reference'")).rows[0].n),0);
});

test('capacity overflow enters review without creating an investment and failed webhooks cannot overwrite success',async t=>{
  const db=await database();t.after(()=>db.close());
  await db.query('SET ROLE service_role');
  const eventArgs=['payment-3','PAY-INVEST',10000,'NGN','paystack-tx-invest',hash('investment-event')];
  const outcome=parsed((await db.query(`SELECT public.apply_verified_paystack_payment($1,$2,$3,$4,$5,$6,NULL,NULL) AS result`,eventArgs)).rows[0].result);
  assert.deepEqual(outcome,{duplicate:false,paymentId:'payment-3',underReview:true,status:'under_review'});
  await db.query('RESET ROLE');
  assert.equal((await db.query("SELECT status FROM public.payments WHERE id='payment-3'")).rows[0].status,'under_review');
  assert.equal((await db.query("SELECT status FROM public.investment_applications WHERE id='application-1'")).rows[0].status,'under_review');
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM public.investments WHERE application_id='application-1'")).rows[0].n),0);
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM public.financial_ledger WHERE reference='LED-PAY-PAY-INVEST'")).rows[0].n),1);

  await db.query('SET ROLE service_role');
  const successfulArgs=['payment-1','PAY-ONE',250000,'NGN','paystack-tx-before-failure',hash('success-before-failure')];
  await db.query(`SELECT public.apply_verified_paystack_payment($1,$2,$3,$4,$5,$6,NULL,NULL)`,successfulArgs);
  const failArgs=['payment-1','PAY-ONE',250000,'NGN','paystack-tx-fail',hash('failure-after-success')];
  const failureResult=parsed((await db.query(`SELECT public.apply_failed_paystack_payment($1,$2,$3,$4,$5,$6) AS result`,failArgs)).rows[0].result);
  assert.deepEqual(failureResult,{duplicate:true,paymentId:'payment-1',status:'successful'});
  await db.query('RESET ROLE');
  assert.equal((await db.query("SELECT status FROM public.payments WHERE id='payment-1'")).rows[0].status,'successful');
});

test('ordinary investment funding creates one investment, one projected earnings row, and exact ledger entries',async t=>{
  const db=await database();t.after(()=>db.close());
  await db.query("UPDATE public.opportunities SET subscribed=0 WHERE id='opportunity-1'");
  await db.query("UPDATE public.investment_applications SET status='approved' WHERE id='application-1'");
  await db.query('SET ROLE service_role');
  const args=['payment-3','PAY-INVEST',10000,'NGN','paystack-tx-invest-ok',hash('investment-success')];
  const result=parsed((await db.query(`SELECT public.apply_verified_paystack_payment($1,$2,$3,$4,$5,$6,NULL,NULL) AS result`,args)).rows[0].result);
  assert.equal(result.status,'successful');
  assert.equal(result.underReview,false);
  await db.query('RESET ROLE');
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM public.investments WHERE application_id='application-1'")).rows[0].n),1);
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM public.investment_earnings WHERE reference='PROJ-APP-ONE'")).rows[0].n),1);
  assert.equal(Number((await db.query("SELECT subscribed FROM public.opportunities WHERE id='opportunity-1'")).rows[0].subscribed),100);
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM public.financial_ledger WHERE reference IN ('LED-PAY-PAY-INVEST','LED-PAY-INVEST')")).rows[0].n),2);
});
