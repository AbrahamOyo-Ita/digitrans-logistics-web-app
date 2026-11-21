import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {paystackRequest,refundPaystackPayment,verifyPaystackSignature} from './payments.js';

const originalFetch=globalThis.fetch;
const originalSecret=process.env.PAYSTACK_SECRET_KEY;

test.after(()=>{
  globalThis.fetch=originalFetch;
  if(originalSecret===undefined)delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY=originalSecret;
});

test('Paystack requests use the server secret and return only provider data',async()=>{
  process.env.PAYSTACK_SECRET_KEY='sk_test_payment_hardening';
  let request;
  globalThis.fetch=async(url,options)=>{
    request={url,options};
    return new Response(JSON.stringify({status:true,data:{status:'processed',id:77}}),{status:200,headers:{'content-type':'application/json'}});
  };
  const data=await refundPaystackPayment({providerReference:'PAY-1',amount:250,customerNote:'Customer refund'});
  assert.deepEqual(data,{status:'processed',id:77});
  assert.equal(request.url,'https://api.paystack.co/refund');
  assert.equal(request.options.headers.Authorization,'Bearer sk_test_payment_hardening');
  assert.deepEqual(JSON.parse(request.options.body),{transaction:'PAY-1',amount:25000,currency:'NGN',customer_note:'Customer refund'});
});

test('Paystack provider errors are normalized without exposing response payloads',async()=>{
  process.env.PAYSTACK_SECRET_KEY='sk_test_payment_hardening';
  globalThis.fetch=async()=>new Response(JSON.stringify({status:false,message:'provider internal detail'}),{status:400});
  await assert.rejects(paystackRequest('/transaction/verify/PAY-1'),error=>error.status===502&&error.message==='Paystack could not complete the request.');
});

test('Paystack webhook signatures require a complete SHA-512 hex digest',async()=>{
  process.env.PAYSTACK_SECRET_KEY='sk_test_payment_hardening';
  const body=Buffer.from('{"event":"charge.success"}');
  const signature=crypto.createHmac('sha512',process.env.PAYSTACK_SECRET_KEY).update(body).digest('hex');
  assert.equal(verifyPaystackSignature(body,signature),true);
  assert.equal(verifyPaystackSignature(body,signature.slice(0,-1)),false);
  assert.equal(verifyPaystackSignature(body,'z'.repeat(128)),false);
});
