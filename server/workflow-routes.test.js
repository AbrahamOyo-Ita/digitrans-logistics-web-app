import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PGlite} from '@electric-sql/pglite';
import {createApp,bodyParser} from './native-http.js';
import {configurePostgresForTests,closePostgres} from './postgres.js';
import {resetSupabaseAdminForTests} from './supabase.js';
import customerRouter from './routes/customer.js';
import operationsRouter from './routes/operations.js';
import financeRouter from './routes/finance.js';
import investmentsRouter from './routes/investments.js';
import commonRouter from './routes/common.js';
import contentRouter from './routes/content.js';
import paymentsRouter from './routes/payments.js';

const root=fileURLToPath(new URL('..',import.meta.url));
const migrationFiles=[
  'supabase/migrations/202611160001_initial_schema.sql',
  'supabase/migrations/202611160002_payment_atomicity.sql',
  'supabase/migrations/202611160003_transactional_email_outbox.sql',
  'supabase/migrations/202611220001_admin_invites_rbac_audit.sql',
  'supabase/seed.sql',
];

function makeToken(userId){
  const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload=Buffer.from(JSON.stringify({
    sub:userId,
    exp:Math.floor(Date.now()/1000)+3600,
    app_metadata:{session_version:'v1'},
  })).toString('base64url');
  return `${header}.${payload}.sig`;
}

async function setupPgliteApp(){
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
    CREATE TABLE storage.buckets(
      id text PRIMARY KEY,name text NOT NULL,public boolean NOT NULL DEFAULT false,
      file_size_limit bigint,allowed_mime_types text[]
    );
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text NOT NULL,name text NOT NULL);
  `);
  for(const file of migrationFiles){
    await pg.exec(await fs.readFile(path.join(root,file),'utf8'));
  }
  const adapter={
    async query(text,values=[]){
      const res=await pg.query(text,values);
      return {rows:res.rows||[],rowCount:res.affectedRows??res.rows?.length??0};
    },
    async connect(){
      return {
        async query(text,values=[]){
          const res=await pg.query(text,values);
          return {rows:res.rows||[],rowCount:res.affectedRows??res.rows?.length??0};
        },
        release(){},
      };
    },
    async end(){await pg.close();},
  };
  configurePostgresForTests({client:adapter});

  const app=createApp();
  app.use(bodyParser());
  app.use('/api',customerRouter);
  app.use('/api',operationsRouter);
  app.use('/api',financeRouter);
  app.use('/api',investmentsRouter);
  app.use('/api',commonRouter);
  app.use('/api',contentRouter);
  app.use('/api',paymentsRouter);

  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const {port}=server.address();
  const baseUrl=`http://127.0.0.1:${port}`;
  return {pg,app,server,baseUrl};
}

async function apiCall(baseUrl,pathname,{method='GET',userId='',body}={}){
  const headers={};
  if(userId)headers.Cookie=`session=${makeToken(userId)}`;
  if(body!==undefined)headers['Content-Type']='application/json';
  const res=await fetch(`${baseUrl}${pathname}`,{
    method,
    headers,
    body:body!==undefined?JSON.stringify(body):undefined,
  });
  const data=await res.json().catch(()=>null);
  return {status:res.status,data};
}

test('workflow routes filter safely, scope /ops/attention by permissions, and enrich support context across roles',async t=>{
  const prevEnv={
    SUPABASE_URL:process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY,
    ORIGINAL_FETCH:globalThis.fetch,
  };
  process.env.SUPABASE_URL='http://127.0.0.1:54321';
  process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test_workflow_key_12345';
  resetSupabaseAdminForTests();

  const originalFetch=globalThis.fetch;
  globalThis.fetch=async(url,options={})=>{
    const href=String(url);
    if(href.startsWith('http://127.0.0.1:54321/auth/v1/user')){
      const authHeader=String(options?.headers?.Authorization||options?.headers?.authorization||'');
      const token=authHeader.replace(/^Bearer\s+/i,'');
      const payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));
      return new Response(JSON.stringify({
        id:payload.sub,
        email:`${payload.sub}@digitrans.test`,
        app_metadata:{session_version:'v1'},
      }),{status:200,headers:{'content-type':'application/json'}});
    }
    return originalFetch(url,options);
  };

  const {pg,server,baseUrl}=await setupPgliteApp();
  t.after(async()=>{
    globalThis.fetch=prevEnv.ORIGINAL_FETCH;
    if(prevEnv.SUPABASE_URL===undefined)delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL=prevEnv.SUPABASE_URL;
    if(prevEnv.SUPABASE_SERVICE_ROLE_KEY===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY=prevEnv.SUPABASE_SERVICE_ROLE_KEY;
    resetSupabaseAdminForTests();
    await new Promise(resolve=>server.close(resolve));
    await closePostgres();
  });

  const ids={
    customerA:'11111111-1111-4111-8111-111111111111',
    customerB:'22222222-2222-4222-8222-222222222222',
    student:'33333333-3333-4333-8333-333333333333',
    rider:'44444444-4444-4444-8444-444444444444',
    investor:'55555555-5555-4555-8555-555555555555',
    superAdmin:'66666666-6666-4666-8666-666666666666',
    opsOfficer:'77777777-7777-4777-8777-777777777777',
    financeOfficer:'88888888-4888-4888-8888-888888888888',
    investmentManager:'99999999-4999-4999-8999-999999999999',
  };

  const users=[
    [ids.customerA,'custA@test.local','customer','Customer Alpha'],
    [ids.customerB,'custB@test.local','customer','Customer Beta'],
    [ids.student,'stud@test.local','student','Student One'],
    [ids.rider,'rider@test.local','rider','Rider One'],
    [ids.investor,'inv@test.local','investor','Investor One'],
    [ids.superAdmin,'super@test.local','super_admin','Super Admin'],
    [ids.opsOfficer,'ops@test.local','ops_officer','Operations Officer'],
    [ids.financeOfficer,'fin@test.local','finance_officer','Finance Officer'],
    [ids.investmentManager,'invmgr@test.local','investment_manager','Investment Manager'],
  ];
  for(const [id,email,role,name] of users){
    await pg.query('INSERT INTO auth.users(id) VALUES($1)',[id]);
    await pg.query('INSERT INTO public.users(id,email,role,status) VALUES($1,$2,$3,$4)',[id,email,role,'active']);
    await pg.query('INSERT INTO public.profiles(user_id,full_name) VALUES($1,$2)',[id,name]);
  }
  await pg.query("INSERT INTO public.riders(user_id,approval_status) VALUES($1,'pending')",[ids.rider]);
  await pg.query("INSERT INTO public.investors(user_id,verification_status) VALUES($1,'approved')",[ids.investor]);

  await pg.query(`INSERT INTO public.deliveries(id,reference,customer_id,channel,pickup_address,dropoff_address,recipient_name,recipient_phone,timing,scheduled_at,status,fee,payment_status,created_at)
    VALUES
    ('del-a1','DEL-A1',$1,'app','Marian Road','UNICAL Gate','Ada','08030000001','now',NULL,'awaiting_assignment',2500,'pending','2026-11-10T10:00:00Z'),
    ('del-a2','DEL-A2',$1,'app','Etta Agbor','State Housing','Bola','08030000002','scheduled','2026-11-18T09:00:00Z','assigned',4200,'successful','2026-11-12T10:00:00Z'),
    ('del-s1','DEL-S1',$2,'app','Malabor Hall','Library','Chidi','08030000003','now',NULL,'pending_confirmation',1800,'pending','2026-11-13T10:00:00Z')`,
    [ids.customerA,ids.student]);
  await pg.query(`INSERT INTO public.delivery_assignments(id,delivery_id,rider_id,status,reference) VALUES('asn-1','del-a2',$1,'assigned','ASN-1')`,[ids.rider]);
  await pg.query(`INSERT INTO public.waybills(id,reference,waybill_number,customer_id,sender_name,sender_phone,recipient_name,recipient_phone,destination_city,destination_address,origin,destination,item_desc,weight,status,fee,payment_status,created_at)
    VALUES('wb-1','WB-REF-1','WB-0001',$1,'Customer Alpha','08030000001','Receiver','08030000009','Lagos','12 Broad St','Calabar','Lagos','Documents',2.5,'submitted',8500,'pending','2026-11-11T10:00:00Z')`,[ids.customerA]);
  await pg.query(`INSERT INTO public.market_runs(id,reference,customer_id,contact_name,contact_phone,delivery_location,budget_estimate,status,created_at)
    VALUES('mr-1','MR-REF-1',$1,'Customer Alpha','08030000001','Marian Road',15000,'submitted','2026-11-11T12:00:00Z')`,[ids.customerA]);
  await pg.query(`INSERT INTO public.market_run_items(id,market_run_id,item_name,quantity,unit)
    VALUES('mri-1','mr-1','Tomatoes',2,'basket')`);
  await pg.query(`INSERT INTO public.payments(id,reference,provider_ref,user_id,delivery_id,waybill_id,amount,status,created_at)
    VALUES
    ('pay-1','PAY-OK-1','PSK-OK-1',$1,'del-a2',NULL,4200,'successful','2026-11-12T10:05:00Z'),
    ('pay-2','PAY-REV-2','PSK-REV-2',$1,NULL,'wb-1',8500,'reversed','2026-11-12T11:05:00Z'),
    ('pay-3','PAY-CAN-3','PSK-CAN-3',$1,'del-a1',NULL,2500,'cancelled','2026-11-12T12:05:00Z'),
    ('pay-4','PAY-REVW-4','PSK-REVW-4',$2,'del-s1',NULL,1800,'under_review','2026-11-12T13:05:00Z')`,
    [ids.customerA,ids.student]);
  await pg.query(`INSERT INTO public.opportunities(id,title,category,min_investment,duration_months,projected_return_pct,risk_disclosure,status)
    VALUES('opp-1','Calabar Van Expansion','Logistics',50000,12,18,'Capital is at risk.','published')`);
  await pg.query(`INSERT INTO public.investment_applications(id,reference,opportunity_id,investor_id,amount,status,created_at)
    VALUES('invapp-1','INVAPP-1','opp-1',$1,100000,'submitted','2026-11-10T09:00:00Z')`,[ids.investor]);
  await pg.query(`INSERT INTO public.investments(id,application_id,opportunity_id,investor_id,principal,status)
    VALUES('inv-1','invapp-1','opp-1',$1,100000,'active')`,[ids.investor]);
  await pg.query(`INSERT INTO public.investment_withdrawals(id,reference,investment_id,investor_id,amount,status,created_at)
    VALUES('invwd-1','INVWD-1','inv-1',$1,25000,'requested','2026-11-14T09:00:00Z')`,[ids.investor]);
  await pg.query(`INSERT INTO public.rider_earnings(id,rider_id,delivery_id,eligible_fee,commission_pct,rider_earnings,digitrans_share,settlement_status,reference)
    VALUES('earn-1',$1,'del-a2',4200,25,3150,1050,'pending','ERN-1')`,[ids.rider]);
  await pg.query(`INSERT INTO public.withdrawal_requests(id,reference,rider_id,amount,destination_account,status,created_at)
    VALUES('wd-1','WD-R1',$1,3150,'GTBank 0123456789','requested','2026-11-14T10:00:00Z')`,[ids.rider]);
  await pg.query(`INSERT INTO public.rider_settlements(id,settlement_date,total_payable,status,created_at)
    VALUES('set-1','2026-11-14',3150,'pending','2026-11-14T11:00:00Z')`);
  await pg.query(`INSERT INTO public.rider_settlement_items(settlement_id,rider_id,earnings_id,amount)
    VALUES('set-1',$1,'earn-1',3150)`,[ids.rider]);

  // 1. Payments filters, focus, date validation, and role isolation
  const payReversed=await apiCall(baseUrl,'/api/payments?status=reversed',{userId:ids.customerA});
  assert.equal(payReversed.status,200);
  assert.equal(payReversed.data.payments.length,1);
  assert.equal(payReversed.data.payments[0].reference,'PAY-REV-2');

  const payCancelled=await apiCall(baseUrl,'/api/payments?status=cancelled',{userId:ids.customerA});
  assert.equal(payCancelled.status,200);
  assert.equal(payCancelled.data.payments[0].reference,'PAY-CAN-3');

  const payFocus=await apiCall(baseUrl,'/api/payments?focus=pay-2',{userId:ids.customerA});
  assert.equal(payFocus.status,200);
  assert.equal(payFocus.data.payments.length,1);
  assert.equal(payFocus.data.payments[0].id,'pay-2');

  const payIsolation=await apiCall(baseUrl,'/api/payments?focus=pay-2',{userId:ids.customerB});
  assert.equal(payIsolation.status,200);
  assert.equal(payIsolation.data.payments.length,0,'customer B must not see customer A payments via focus');

  const badDate=await apiCall(baseUrl,'/api/payments?from=2026-02-30',{userId:ids.customerA});
  assert.equal(badDate.status,400);

  const reversedRange=await apiCall(baseUrl,'/api/payments?from=2026-11-15&to=2026-11-01',{userId:ids.customerA});
  assert.equal(reversedRange.status,400);

  // 2. Deliveries filters + pagination
  const delScheduled=await apiCall(baseUrl,'/api/deliveries?timing=scheduled&search=Housing',{userId:ids.customerA});
  assert.equal(delScheduled.status,200);
  assert.equal(delScheduled.data.deliveries.length,1);
  assert.equal(delScheduled.data.deliveries[0].reference,'DEL-A2');
  assert.equal(delScheduled.data.total,1);
  assert.equal(delScheduled.data.countOnPage,1);

  const delDateFilter=await apiCall(baseUrl,'/api/deliveries?from=2026-11-11&to=2026-11-13',{userId:ids.customerA});
  assert.equal(delDateFilter.status,200);
  assert.equal(delDateFilter.data.deliveries.length,1);
  assert.equal(delDateFilter.data.deliveries[0].id,'del-a2');

  // 3. Support related_context resolution, role-scoped links, and ownership isolation
  const custCreate=await apiCall(baseUrl,'/api/support',{
    method:'POST',
    userId:ids.customerA,
    body:{category:'delivery',relatedId:'DEL-A2',description:'Checking arrival ETA for my scheduled dropoff.'},
  });
  assert.equal(custCreate.status,201);
  assert.equal(custCreate.data.relatedId,'del-a2');
  const custTicket=await apiCall(baseUrl,`/api/support/${custCreate.data.id}`,{userId:ids.customerA});
  assert.equal(custTicket.status,200);
  assert.equal(custTicket.data.ticket.related_id,'del-a2');
  assert.equal(custTicket.data.ticket.related_context.href,'/customer/history?focus=del-a2');

  const studCreate=await apiCall(baseUrl,'/api/support',{
    method:'POST',
    userId:ids.student,
    body:{category:'delivery',relatedId:'DEL-S1',description:'Student parcel needs pickup confirmation.'},
  });
  assert.equal(studCreate.status,201);
  const studTicket=await apiCall(baseUrl,`/api/support/${studCreate.data.id}`,{userId:ids.student});
  assert.equal(studTicket.status,200);
  assert.equal(studTicket.data.ticket.related_context.href,'/customer/history?focus=del-s1');

  const riderCreate=await apiCall(baseUrl,'/api/support',{
    method:'POST',
    userId:ids.rider,
    body:{category:'delivery',relatedId:'DEL-A2',description:'Gate access delay at State Housing.'},
  });
  assert.equal(riderCreate.status,201);
  const riderTicket=await apiCall(baseUrl,`/api/support/${riderCreate.data.id}`,{userId:ids.rider});
  assert.equal(riderTicket.status,200);
  assert.equal(riderTicket.data.ticket.related_context.href,'/rider/jobs?focus=del-a2');

  const waybillCreate=await apiCall(baseUrl,'/api/support',{
    method:'POST',
    userId:ids.customerA,
    body:{category:'waybill',relatedId:'WB-0001',description:'Confirming dropoff desk for intercity parcel.'},
  });
  assert.equal(waybillCreate.status,201);
  assert.equal(waybillCreate.data.relatedId,'wb-1');
  const waybillTicket=await apiCall(baseUrl,`/api/support/${waybillCreate.data.id}`,{userId:ids.customerA});
  assert.equal(waybillTicket.status,200);
  assert.equal(waybillTicket.data.ticket.related_id,'wb-1');
  assert.equal(waybillTicket.data.ticket.related_context.href,'/customer/waybills?focus=wb-1');

  const forbiddenCrossRef=await apiCall(baseUrl,'/api/support',{
    method:'POST',
    userId:ids.customerB,
    body:{category:'delivery',relatedId:'DEL-A2',description:'Trying to reference another customer delivery.'},
  });
  assert.equal(forbiddenCrossRef.status,404,'unrelated user cannot attach another customer delivery');

  const supportListAsOps=await apiCall(baseUrl,'/api/support?search=wb-1',{userId:ids.opsOfficer});
  assert.equal(supportListAsOps.status,200);
  assert.equal(supportListAsOps.data.tickets.length,1);
  assert.equal(supportListAsOps.data.tickets[0].related_context.href,'/ops/waybills?focus=wb-1');

  const supportDetailAsOps=await apiCall(baseUrl,`/api/support/${custCreate.data.id}`,{userId:ids.opsOfficer});
  assert.equal(supportDetailAsOps.status,200);
  assert.equal(supportDetailAsOps.data.ticket.related_context.href,'/ops/deliveries?focus=del-a2');

  // 4. Ops Needs Attention permission scoping
  const customerAttention=await apiCall(baseUrl,'/api/ops/attention',{userId:ids.customerA});
  assert.equal(customerAttention.status,403);

  const superAttention=await apiCall(baseUrl,'/api/ops/attention',{userId:ids.superAdmin});
  assert.equal(superAttention.status,200);
  assert.ok(superAttention.data.summary.total>=8);
  assert.ok(superAttention.data.summary.deliveries>=1);
  assert.ok(superAttention.data.summary.marketRuns>=1);
  assert.ok(superAttention.data.summary.waybills>=1);
  assert.ok(superAttention.data.summary.verifications>=1);
  assert.ok(superAttention.data.summary.finance>=3);
  assert.ok(superAttention.data.summary.investments>=2);
  assert.ok(superAttention.data.summary.support>=1);

  const opsAttention=await apiCall(baseUrl,'/api/ops/attention',{userId:ids.opsOfficer});
  assert.equal(opsAttention.status,200);
  assert.ok(opsAttention.data.items.length>=4);
  assert.ok(opsAttention.data.items.every(item=>!['finance','investments'].includes(item.category)),'ops_officer does not see finance or investment queues');

  const financeAttention=await apiCall(baseUrl,'/api/ops/attention',{userId:ids.financeOfficer});
  assert.equal(financeAttention.status,200);
  assert.ok(financeAttention.data.items.length>=3);
  assert.ok(financeAttention.data.items.every(item=>['deliveries','finance','investments'].includes(item.category)),'finance_officer only sees deliveries/finance/investments queues');
  assert.equal(financeAttention.data.summary.verifications,0);
  assert.equal(financeAttention.data.summary.support,0);

  const invManagerAttention=await apiCall(baseUrl,'/api/ops/attention',{userId:ids.investmentManager});
  assert.equal(invManagerAttention.status,200);
  assert.ok(invManagerAttention.data.summary.investments>=2);
  assert.equal(invManagerAttention.data.summary.deliveries,0);
  assert.equal(invManagerAttention.data.summary.support,0);

  // 5. Ops filtered endpoints (waybills, market runs, finance, investments)
  const opsWb=await apiCall(baseUrl,'/api/ops/waybills?paymentStatus=pending&search=WB-0001',{userId:ids.superAdmin});
  assert.equal(opsWb.status,200);
  assert.equal(opsWb.data.waybills.length,1);
  assert.equal(opsWb.data.total,1);

  const opsMr=await apiCall(baseUrl,'/api/ops/market-runs?status=submitted&search=Tomatoes',{userId:ids.superAdmin});
  assert.equal(opsMr.status,200);
  assert.equal(opsMr.data.marketRuns.length,1);

  const opsInvApps=await apiCall(baseUrl,'/api/ops/investment-applications?status=submitted&search=INVAPP-1',{userId:ids.superAdmin});
  assert.equal(opsInvApps.status,200);
  assert.equal(opsInvApps.data.applications.length,1);

  const opsInvWd=await apiCall(baseUrl,'/api/ops/investor-withdrawals?status=requested&search=INVWD-1',{userId:ids.superAdmin});
  assert.equal(opsInvWd.status,200);
  assert.equal(opsInvWd.data.withdrawals.length,1);

  const finWd=await apiCall(baseUrl,'/api/finance/withdrawals?status=requested&search=WD-R1',{userId:ids.financeOfficer});
  assert.equal(finWd.status,200);
  assert.equal(finWd.data.withdrawals.length,1);

  const finSet=await apiCall(baseUrl,'/api/finance/settlements?status=pending',{userId:ids.financeOfficer});
  assert.equal(finSet.status,200);
  assert.equal(finSet.data.settlements.length,1);

  // 6. Public contact enquiry delivers to admin dashboard notifications, contact list, and Needs Attention
  const publicContent=await apiCall(baseUrl,'/api/public/content');
  assert.equal(publicContent.status,200);
  assert.equal(publicContent.data.settings.public_email,'digitransdeliveryandlogistics@gmail.com');
  assert.match(publicContent.data.settings.public_address,/No 2, Ituebange Street/);

  const contactSubmit=await apiCall(baseUrl,'/api/public/contact',{
    method:'POST',
    body:{
      name:'Adaeze Okon',
      email:'adaeze@example.test',
      phone:'+2348000000001',
      category:'Business partnership',
      message:'We run a Calabar store and want regular parcel dispatch.',
    },
  });
  assert.equal(contactSubmit.status,201);
  assert.ok(contactSubmit.data.id);

  const opsContactList=await apiCall(baseUrl,'/api/ops/contact-messages',{userId:ids.opsOfficer});
  assert.equal(opsContactList.status,200);
  assert.equal(opsContactList.data.messages.length,1);
  assert.equal(opsContactList.data.messages[0].id,contactSubmit.data.id);

  const opsNotices=await apiCall(baseUrl,'/api/notifications',{userId:ids.opsOfficer});
  assert.equal(opsNotices.status,200);
  assert.ok(opsNotices.data.notifications.some(n=>n.type==='contact_message'&&n.related_id===contactSubmit.data.id));
  assert.ok(opsNotices.data.notifications.some(n=>n.type==='support'&&n.related_id===custCreate.data.id));

  const opsAttentionAfterContact=await apiCall(baseUrl,'/api/ops/attention',{userId:ids.opsOfficer});
  assert.equal(opsAttentionAfterContact.status,200);
  assert.ok(opsAttentionAfterContact.data.items.some(i=>i.key===`contact:${contactSubmit.data.id}`&&i.href===`/ops/contact?focus=${contactSubmit.data.id}`));
});
