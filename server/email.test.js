import test from 'node:test';
import assert from 'node:assert/strict';
import {isEmailConfigured,sendEmail} from './email.js';

const names=['RESEND_API_KEY','RESEND_FROM_EMAIL','APP_URL'];
const original=Object.fromEntries(names.map(name=>[name,process.env[name]]));
function restore(){for(const name of names){if(original[name]===undefined)delete process.env[name];else process.env[name]=original[name];}}

test('Resend configuration is reported only when all required values are present',()=>{
  process.env.RESEND_API_KEY='re_test_key';process.env.RESEND_FROM_EMAIL='DigiTrans <no-reply@example.test>';process.env.APP_URL='https://app.example.test';
  assert.equal(isEmailConfigured(),true);
  delete process.env.APP_URL;
  assert.equal(isEmailConfigured(),false);
  restore();
});

test('email helper posts authenticated transactional email and returns provider id',async()=>{
  process.env.RESEND_API_KEY='re_test_key';process.env.RESEND_FROM_EMAIL='DigiTrans <no-reply@example.test>';
  let captured;
  const result=await sendEmail({to:'customer@example.test',subject:'Account recovery',text:'A secure link',html:'<p>A secure link</p>',replyTo:'supporter@example.test'},async(url,options)=>{
    captured={url,options};
    return new Response(JSON.stringify({id:'re_test_123'}),{status:200,headers:{'content-type':'application/json'}});
  });
  assert.deepEqual(result,{id:'re_test_123'});
  assert.equal(captured.url,'https://api.resend.com/emails');
  assert.equal(captured.options.headers.Authorization,'Bearer re_test_key');
  assert.equal(captured.options.signal.aborted,false);
  assert.deepEqual(JSON.parse(captured.options.body),{
    from:'DigiTrans <no-reply@example.test>',to:'customer@example.test',subject:'Account recovery',
    html:'<p>A secure link</p>',text:'A secure link',reply_to:'supporter@example.test',
  });
  restore();
});

test('email helper forwards a stable optional idempotency key to Resend',async()=>{
  process.env.RESEND_API_KEY='re_test_key';process.env.RESEND_FROM_EMAIL='DigiTrans <no-reply@example.test>';
  let captured;
  await sendEmail({to:'customer@example.test',subject:'Delivery update',text:'On the move',idempotencyKey:'outbox-event-1'},async(_url,options)=>{
    captured=options;
    return new Response(JSON.stringify({id:'re_test_idempotent'}),{status:200,headers:{'content-type':'application/json'}});
  });
  assert.equal(captured.headers['Idempotency-Key'],'outbox-event-1');
  restore();
});

test('email helper fails closed when provider credentials are absent or provider rejects the request',async()=>{
  delete process.env.RESEND_API_KEY;delete process.env.RESEND_FROM_EMAIL;
  await assert.rejects(()=>sendEmail({to:'customer@example.test',subject:'Test',text:'Test'},async()=>{throw new Error('Must not call provider');}),/not configured/);
  process.env.RESEND_API_KEY='re_test_key';process.env.RESEND_FROM_EMAIL='DigiTrans <no-reply@example.test>';
  await assert.rejects(()=>sendEmail({to:'customer@example.test',subject:'Test',text:'Test'},async()=>new Response(JSON.stringify({message:'invalid sender'}),{status:422})),/invalid sender/);
  restore();
});
