import crypto from 'node:crypto';
import {getSupabaseAdmin} from './supabase.js';
import {normalizeDatabaseError} from './postgres.js';

function eventHash(providerData,rawPayload){
  const bytes=Buffer.isBuffer(rawPayload)?rawPayload:Buffer.from(typeof rawPayload==='string'?rawPayload:JSON.stringify(providerData));
  return crypto.createHash('sha256').update(bytes).digest('hex');
}
function providerEventId(providerData,suffix){
  const id=providerData?.id;
  if(typeof id==='string'&&id.trim()){
    const value=id.trim();
    if(value.length>200)throw Object.assign(new Error('Payment provider event ID is invalid.'),{status:400});
    return value;
  }
  if(Number.isSafeInteger(id)&&id>=0)return String(id);
  const reference=String(providerData?.reference||'').trim();
  if(!reference)throw Object.assign(new Error('Payment provider reference is missing.'),{status:400});
  const value=`${reference}:${suffix}`;
  if(value.length>200)throw Object.assign(new Error('Payment provider event ID is invalid.'),{status:400});
  return value;
}
function providerReference(providerData){
  const reference=String(providerData?.reference||'').trim();
  if(!reference||reference.length>200)throw Object.assign(new Error('Payment provider reference is invalid.'),{status:400});
  return reference;
}
function amountKobo(providerData){
  const amount=Number(providerData?.amount);
  if(!Number.isSafeInteger(amount)||amount<0)throw Object.assign(new Error('Payment provider amount is invalid.'),{status:400});
  return amount;
}
async function callRpc(client,name,params){
  try{
    const {data,error}=await client.rpc(name,params);
    if(error)throw normalizeDatabaseError(error);
    if(!data||typeof data!=='object')throw Object.assign(new Error('Payment settlement did not return a result.'),{status:503});
    return data;
  }catch(error){throw normalizeDatabaseError(error);}
}

/**
 * The caller must verify Paystack's signature for webhook deliveries or call Paystack's
 * verification API first. Database row locking, event idempotency, ledger updates, and
 * related business changes are committed by one Postgres function call.
 */
export async function applyVerifiedPaystackPayment({paymentId,providerData,rawPayload,actor=null,client=getSupabaseAdmin()}={}){
  if(!paymentId||providerData?.status!=='success'||String(providerData?.currency||'').toUpperCase()!=='NGN'){
    throw Object.assign(new Error('Verified Paystack payment details are required.'),{status:400});
  }
  const params={
    p_payment_id:String(paymentId),
    p_provider_reference:providerReference(providerData),
    p_amount_kobo:amountKobo(providerData),
    p_currency:'NGN',
    p_provider_event_id:providerEventId(providerData,'charge.success'),
    p_payload_sha256:eventHash(providerData,rawPayload),
    p_actor_id:actor?.id||null,
    p_actor_role:actor?.role||null,
  };
  return callRpc(client,'apply_verified_paystack_payment',params);
}

export async function applyFailedPaystackPayment({paymentId,providerData,rawPayload,client=getSupabaseAdmin()}={}){
  const status=String(providerData?.status||'').toLowerCase();
  if(!paymentId||!['failed','abandoned'].includes(status))throw Object.assign(new Error('Failed Paystack payment details are required.'),{status:400});
  const currency=providerData?.currency===undefined?null:String(providerData.currency).toUpperCase();
  const amount=providerData?.amount===undefined||providerData?.amount===null?null:amountKobo(providerData);
  const params={
    p_payment_id:String(paymentId),
    p_provider_reference:providerReference(providerData),
    p_amount_kobo:amount,
    p_currency:currency,
    p_provider_event_id:providerEventId(providerData,'charge.failed'),
    p_payload_sha256:eventHash(providerData,rawPayload),
  };
  return callRpc(client,'apply_failed_paystack_payment',params);
}
