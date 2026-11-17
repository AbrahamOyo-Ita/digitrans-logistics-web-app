import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {applyFailedPaystackPayment,applyVerifiedPaystackPayment} from './payment-rpc.js';

function fakeClient(result={duplicate:false,paymentId:'payment-1',underReview:false,status:'successful'}){
  const calls=[];
  return {calls,async rpc(name,params){calls.push({name,params});return {data:result,error:null};}};
}

test('verified payment adapter sends only a hash and verified provider fields to the atomic RPC',async()=>{
  const client=fakeClient();
  const raw=Buffer.from('{"event":"charge.success"}');
  const result=await applyVerifiedPaystackPayment({
    paymentId:'payment-1',providerData:{id:103,reference:'PAY-1',amount:12500,currency:'ngn',status:'success'},
    rawPayload:raw,actor:{id:'10000000-0000-4000-8000-000000000001',role:'finance_officer'},client,
  });
  assert.equal(result.paymentId,'payment-1');
  assert.equal(client.calls.length,1);
  assert.equal(client.calls[0].name,'apply_verified_paystack_payment');
  assert.deepEqual(client.calls[0].params,{
    p_payment_id:'payment-1',p_provider_reference:'PAY-1',p_amount_kobo:12500,p_currency:'NGN',
    p_provider_event_id:'103',p_payload_sha256:crypto.createHash('sha256').update(raw).digest('hex'),
    p_actor_id:'10000000-0000-4000-8000-000000000001',p_actor_role:'finance_officer',
  });
  assert.ok(!JSON.stringify(client.calls[0].params).includes(raw.toString()));
});

test('RPC adapter refuses unverified success or failed events before calling storage',async()=>{
  const client=fakeClient();
  await assert.rejects(applyVerifiedPaystackPayment({paymentId:'payment-1',providerData:{status:'pending'},client}),error=>error.status===400);
  await assert.rejects(applyFailedPaystackPayment({paymentId:'payment-1',providerData:{status:'success'},client}),error=>error.status===400);
  await assert.rejects(applyVerifiedPaystackPayment({paymentId:'payment-1',providerData:{id:'x'.repeat(201),reference:'PAY-1',amount:100,currency:'NGN',status:'success'},client}),error=>error.status===400);
  assert.equal(client.calls.length,0);
});

test('RPC adapter sanitizes database and transport errors',async()=>{
  const clients=[
    {async rpc(){return {data:null,error:{code:'22023',message:'provider secret and SQL details'}};}},
    {async rpc(){throw Object.assign(new Error('database host and password details'),{status:401,code:'ECONNRESET'});}},
  ];
  for(const client of clients){
    await assert.rejects(applyVerifiedPaystackPayment({
      paymentId:'payment-1',providerData:{reference:'PAY-1',amount:100,currency:'NGN',status:'success'},client,
    }),error=>error.status>=400&&!/secret|SQL details|host|password/.test(error.message));
  }
});

test('failed Paystack events use the dedicated retry-safe RPC',async()=>{
  const client=fakeClient({duplicate:false,paymentId:'payment-2',status:'failed'});
  const result=await applyFailedPaystackPayment({
    paymentId:'payment-2',providerData:{reference:'PAY-2',status:'abandoned',amount:8900,currency:'NGN'},
    rawPayload:'signed-provider-event',client,
  });
  assert.equal(result.status,'failed');
  assert.equal(client.calls[0].name,'apply_failed_paystack_payment');
  assert.equal(client.calls[0].params.p_provider_event_id,'PAY-2:charge.failed');
  assert.equal(client.calls[0].params.p_amount_kobo,8900);
});
