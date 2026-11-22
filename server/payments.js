import crypto from 'node:crypto';
import db from './db.js';
import {applyFailedPaystackPayment,applyVerifiedPaystackPayment} from './payment-rpc.js';

export function reference(prefix='PAY'){return `${prefix}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;}

const PAYSTACK_API='https://api.paystack.co';
const PAYSTACK_TIMEOUT_MS=10_000;

function paystackSecret(){
  const secret=String(process.env.PAYSTACK_SECRET_KEY||'').trim();
  if(!secret)throw Object.assign(new Error('Online payments are not configured yet. Contact DigiTrans to complete payment.'),{status:503});
  return secret;
}

export async function paystackRequest(path,{method='GET',body}={}){
  const response=await fetch(`${PAYSTACK_API}${path}`,{
    method,
    headers:{Authorization:`Bearer ${paystackSecret()}`,'Content-Type':'application/json'},
    ...(body===undefined?{}:{body:JSON.stringify(body)}),
    signal:AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok||payload.status!==true){
    const error=Object.assign(new Error(response.status>=500?'Paystack is temporarily unavailable.':'Paystack could not complete the request.'),{status:502});
    error.providerStatus=response.status;
    throw error;
  }
  return payload.data;
}

export async function settleVerifiedPayment(payment,providerData,actor=null,rawPayload){
  if(!payment?.id||!providerData)throw Object.assign(new Error('Payment details are required.'),{status:400});
  return applyVerifiedPaystackPayment({paymentId:payment.id,providerData,rawPayload,actor});
}

export async function initializePaystackPayment({payment,email,callbackUrl}){
  const amount=Number(payment?.amount);
  const address=String(email||'').trim().toLowerCase();
  if(!payment?.id||!payment?.reference||!Number.isSafeInteger(amount)||amount<=0)throw Object.assign(new Error('The payment amount is invalid.'),{status:400});
  if(!/^\S+@\S+\.\S+$/.test(address))throw Object.assign(new Error('A valid customer email is required for online payment.'),{status:400});
  const data=await paystackRequest('/transaction/initialize',{method:'POST',body:{email:address,amount:amount*100,reference:payment.reference,callback_url:callbackUrl,metadata:{payment_id:payment.id,service_type:payment.service_type||'logistics'}}});
  if(!data?.authorization_url||data.reference!==payment.reference)throw Object.assign(new Error('Payment provider returned an invalid checkout response.'),{status:502});
  await db.prepare("UPDATE public.payments SET status=CASE WHEN status='pending' THEN 'initiated' ELSE status END,provider_ref=COALESCE(provider_ref,?),authorization_url=?,access_code=?,updated_at=now() WHERE id=? AND status IN ('pending','initiated','successful','under_review')")
    .run(data.reference,data.authorization_url,data.access_code||null,payment.id);
  return data;
}

export async function verifyPaystackPayment(providerReference){
  const result=await paystackRequest(`/transaction/verify/${encodeURIComponent(String(providerReference||''))}`);
  const actualReference=String(result?.reference||'');
  if(actualReference!==String(providerReference))throw Object.assign(new Error('Payment provider returned a different reference.'),{status:409});
  const payment=await db.prepare('SELECT * FROM public.payments WHERE reference=? OR provider_ref=?').get(providerReference,providerReference);
  if(!payment)throw Object.assign(new Error('Payment reference not found.'),{status:404});
  const status=String(result?.status||'').toLowerCase();
  if(status==='success'){
    const outcome=await settleVerifiedPayment(payment,result,null,JSON.stringify(result));
    return {paymentId:payment.id,status:outcome.status|| (outcome.underReview?'under_review':'successful'),duplicate:!!outcome.duplicate};
  }
  if(['failed','abandoned'].includes(status)){
    const outcome=await applyFailedPaystackPayment({paymentId:payment.id,providerData:result,rawPayload:JSON.stringify(result)});
    return {paymentId:payment.id,status:outcome.status||'failed',duplicate:!!outcome.duplicate};
  }
  return {paymentId:payment.id,status:payment.status};
}

export async function refundPaystackPayment({providerReference,amount,customerNote,merchantNote}={}){
  const referenceValue=String(providerReference||'').trim();
  const refundAmount=Number(amount);
  if(!referenceValue||referenceValue.length>200||!Number.isSafeInteger(refundAmount)||refundAmount<=0){
    throw Object.assign(new Error('The refund details are invalid.'),{status:400});
  }
  return paystackRequest('/refund',{method:'POST',body:{transaction:referenceValue,amount:refundAmount*100,currency:'NGN',...(customerNote?{customer_note:String(customerNote).slice(0,200)}:{}),...(merchantNote?{merchant_note:String(merchantNote).slice(0,200)}:{})}});
}

export function verifyPaystackSignature(rawBody,signature){
  const secret=String(process.env.PAYSTACK_SECRET_KEY||'').trim();
  const value=String(signature||'').trim();
  if(!secret||!value||!/^[a-f0-9]{128}$/i.test(value)||!Buffer.isBuffer(rawBody))return false;
  const supplied=Buffer.from(value,'hex');
  const expected=crypto.createHmac('sha512',secret).update(rawBody).digest();
  return crypto.timingSafeEqual(expected,supplied);
}
