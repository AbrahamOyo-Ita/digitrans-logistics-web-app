import crypto from 'node:crypto';
import db from './db.js';
import {applyFailedPaystackPayment,applyVerifiedPaystackPayment} from './payment-rpc.js';

export function reference(prefix='PAY'){return `${prefix}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;}

export async function settleVerifiedPayment(payment,providerData,actor=null,rawPayload){
  if(!payment?.id||!providerData)throw Object.assign(new Error('Payment details are required.'),{status:400});
  return applyVerifiedPaystackPayment({paymentId:payment.id,providerData,rawPayload,actor});
}

export async function initializePaystackPayment({payment,email,callbackUrl}){
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret)throw Object.assign(new Error('Online payments are not configured yet. Contact DigiTrans to complete payment.'),{status:503});
  const response=await fetch('https://api.paystack.co/transaction/initialize',{
    method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},
    body:JSON.stringify({email,amount:payment.amount*100,reference:payment.reference,callback_url:callbackUrl,metadata:{payment_id:payment.id,service_type:payment.service_type||'logistics'}}),
    signal:AbortSignal.timeout(10_000),
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.status||!data.data?.authorization_url||data.data.reference!==payment.reference){
    throw Object.assign(new Error(data.message||'Payment provider could not start checkout.'),{status:502});
  }
  await db.prepare("UPDATE public.payments SET status=CASE WHEN status='pending' THEN 'initiated' ELSE status END,provider_ref=COALESCE(provider_ref,?),authorization_url=?,access_code=?,updated_at=now() WHERE id=? AND status IN ('pending','initiated','successful','under_review')")
    .run(data.data.reference,data.data.authorization_url,data.data.access_code||null,payment.id);
  return data.data;
}

export async function verifyPaystackPayment(providerReference){
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret)throw Object.assign(new Error('Payment verification is not configured.'),{status:503});
  const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(providerReference)}`,{
    headers:{Authorization:`Bearer ${secret}`},signal:AbortSignal.timeout(10_000),
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok||!result.status)throw Object.assign(new Error(result.message||'Payment provider verification failed.'),{status:502});
  const actualReference=String(result.data?.reference||'');
  if(actualReference!==String(providerReference))throw Object.assign(new Error('Payment provider returned a different reference.'),{status:409});
  const payment=await db.prepare('SELECT * FROM public.payments WHERE reference=? OR provider_ref=?').get(providerReference,providerReference);
  if(!payment)throw Object.assign(new Error('Payment reference not found.'),{status:404});
  const status=String(result.data?.status||'').toLowerCase();
  if(status==='success'){
    const outcome=await settleVerifiedPayment(payment,result.data,null,JSON.stringify(result.data));
    return {paymentId:payment.id,status:outcome.status|| (outcome.underReview?'under_review':'successful'),duplicate:!!outcome.duplicate};
  }
  if(['failed','abandoned'].includes(status)){
    const outcome=await applyFailedPaystackPayment({paymentId:payment.id,providerData:result.data,rawPayload:JSON.stringify(result.data)});
    return {paymentId:payment.id,status:outcome.status||'failed',duplicate:!!outcome.duplicate};
  }
  return {paymentId:payment.id,status:payment.status};
}

export function verifyPaystackSignature(rawBody,signature){
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret||!signature||!Buffer.isBuffer(rawBody))return false;
  const supplied=Buffer.from(String(signature),'hex');
  if(supplied.length!==64)return false;
  const expected=crypto.createHmac('sha512',secret).update(rawBody).digest();
  return crypto.timingSafeEqual(expected,supplied);
}
