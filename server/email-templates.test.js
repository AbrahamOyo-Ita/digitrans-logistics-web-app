import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthEmailTemplate,createTransactionalEmailTemplate} from './email-templates.js';

const appUrl='https://www.digitransdelivery.com';

test('verification email includes branded original illustration and plain-text fallback',()=>{
  const message=createAuthEmailTemplate({kind:'verify',name:'Amina Example',actionUrl:'https://www.digitransdelivery.com/auth/verify?token=abc&email=amina%40example.test'});
  assert.equal(message.subject,'One quick step to get moving with DigiTrans');
  assert.match(message.html,/name="viewport"/);
  assert.match(message.html,/DigiTrans/);
  assert.match(message.html,/Verify my email/);
  assert.match(message.html,/email-verification\.jpg/);
  assert.match(message.html,/&amp;email=/);
  assert.match(message.text,/Amina Example/);
  assert.match(message.text,/https:\/\/www\.digitransdelivery\.com\/auth\/verify/);
});

test('recovery email keeps the action safe, illustrates password reset, and never renders supplied names as markup',()=>{
  const message=createAuthEmailTemplate({kind:'recovery',name:'<img src=x onerror=alert(1)>',actionUrl:'https://example.test/reset?token=a%22b'});
  assert.equal(message.subject,'A secure link to reset your DigiTrans password');
  assert.match(message.html,/Reset my password/);
  assert.match(message.html,/password-reset\.jpg/);
  assert.match(message.html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(message.html,/<img src=x onerror=/);
  assert.match(message.html,/token=a%22b/);
});

test('account email templates reject unsafe action schemes and unknown template kinds',()=>{
  assert.throws(()=>createAuthEmailTemplate({kind:'verify',actionUrl:'javascript:alert(1)'}),/HTTP or HTTPS/);
  assert.throws(()=>createAuthEmailTemplate({kind:'unknown',actionUrl:'https://example.test'}),/Unknown/);
  assert.throws(()=>createAuthEmailTemplate({kind:'verify',actionUrl:'not a URL'}),/valid account action URL/);
});

test('successful payment email uses its own illustration, safe tracking link, amount and text fallback',()=>{
  const message=createTransactionalEmailTemplate({
    eventType:'payment_confirmed',name:'Amina Example',baseUrl:appUrl,
    payload:{paymentReference:'PAY-TEST-1',serviceType:'delivery',serviceReference:'DT-20261116-ABC',amount:12500},
  });
  assert.match(message.subject,/Payment confirmed/);
  assert.match(message.html,/payment-confirmed\.jpg/);
  assert.match(message.html,/₦12,500/);
  assert.match(message.html,/track\?ref=DT-20261116-ABC/);
  assert.match(message.text,/Payment reference: PAY-TEST-1/);
  assert.match(message.text,/Amount: ₦12,500/);
});

test('delivery lifecycle email adapts its copy and illustration for completion and exceptions',()=>{
  const delivered=createTransactionalEmailTemplate({eventType:'delivery_status',baseUrl:appUrl,payload:{reference:'DT-123',status:'delivered'}});
  assert.match(delivered.subject,/delivery is complete/i);
  assert.match(delivered.html,/delivery-confirmation\.jpg/);
  assert.match(delivered.html,/Delivered/);
  const cancelled=createTransactionalEmailTemplate({eventType:'delivery_status',baseUrl:appUrl,payload:{reference:'DT-123',status:'cancelled'}});
  assert.match(cancelled.subject,/cancelled/i);
  assert.match(cancelled.html,/delivery-exception\.jpg/);
  assert.match(cancelled.html,/href="https:\/\/www\.digitransdelivery\.com\/contact"/);
  assert.match(cancelled.text,/Get help: https:\/\/www\.digitransdelivery\.com\/contact/);
});

test('market run estimate and waybill dispatch templates link to the relevant customer experience',()=>{
  const market=createTransactionalEmailTemplate({eventType:'market_run_status',baseUrl:appUrl,payload:{reference:'MR-1',status:'awaiting_customer_approval',finalTotal:18500}});
  assert.match(market.subject,/estimate is ready/i);
  assert.match(market.html,/market-run\.jpg/);
  assert.match(market.html,/₦18,500/);
  assert.match(market.html,/href="https:\/\/www\.digitransdelivery\.com\/customer\/market"/);
  const waybill=createTransactionalEmailTemplate({eventType:'waybill_status',baseUrl:appUrl,payload:{reference:'WB-1',waybillNumber:'DWB-555',status:'in_transit',origin:'Calabar',destinationCity:'Lagos'}});
  assert.match(waybill.subject,/in transit/i);
  assert.match(waybill.html,/waybill-dispatch\.jpg/);
  assert.match(waybill.html,/Calabar → Lagos/);
  assert.match(waybill.html,/track\?ref=DWB-555/);
});

test('rider assignment email is scoped to the secure workspace and escapes event values',()=>{
  const message=createTransactionalEmailTemplate({eventType:'rider_assignment',baseUrl:appUrl,name:'<script>alert(1)</script>',payload:{reference:'DT&1',assignmentReference:'ASG-1'}});
  assert.match(message.subject,/delivery is ready/i);
  assert.match(message.html,/delivery-progress\.jpg/);
  assert.match(message.html,/href="https:\/\/www\.digitransdelivery\.com\/rider\/jobs"/);
  assert.match(message.html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(message.html,/<script>alert\(1\)<\/script>/);
  assert.match(message.html,/DT&amp;1/);
  assert.match(message.text,/Delivery reference: DT&1/);
});

test('transactional email templates require a known event and a valid public app origin',()=>{
  assert.throws(()=>createTransactionalEmailTemplate({eventType:'unknown',baseUrl:appUrl}),/Unknown/);
  assert.throws(()=>createTransactionalEmailTemplate({eventType:'payment_confirmed',baseUrl:'javascript:alert(1)'}),/HTTP or HTTPS origin/);
  assert.throws(()=>createTransactionalEmailTemplate({eventType:'payment_confirmed',baseUrl:'https://user:pass@example.test'}),/origin/);
});
