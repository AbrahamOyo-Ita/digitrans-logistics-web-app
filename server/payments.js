import crypto from 'crypto';
import db from './db.js';
import { notify, audit } from './auth.js';

const id=()=>crypto.randomUUID();
export function reference(prefix='PAY'){return `${prefix}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;}

export function settleVerifiedPayment(payment,providerData,actor=null){
  if(!payment||!providerData)throw new Error('Payment details are required.');
  const amountKobo=Number(providerData.amount),currency=String(providerData.currency||'').toUpperCase();
  if(providerData.status!=='success'||currency!=='NGN'||amountKobo!==payment.amount*100)throw new Error('Provider transaction does not match the expected amount and currency.');
  if(payment.status==='successful')return {duplicate:true,paymentId:payment.id};
  if(payment.status==='under_review')return {duplicate:true,underReview:true,paymentId:payment.id};
  if(!['pending','initiated'].includes(payment.status))throw new Error('Payment cannot be completed from its current state.');
  const changed=db.transaction(()=>{
    db.prepare("UPDATE payments SET status='successful',provider_ref=COALESCE(?,provider_ref),updated_at=datetime('now') WHERE id=?").run(String(providerData.reference||payment.provider_ref||''),payment.id);
    if(payment.delivery_id){
      db.prepare("UPDATE deliveries SET payment_status='successful',updated_at=datetime('now') WHERE id=?").run(payment.delivery_id);
    }
    if(payment.waybill_id){
      const w=db.prepare('SELECT * FROM waybills WHERE id=?').get(payment.waybill_id);
      if(w){
        db.prepare("UPDATE waybills SET payment_status='successful',status=CASE WHEN status IN ('awaiting_payment','parcel_received') THEN 'paid' ELSE status END,updated_at=datetime('now') WHERE id=?").run(w.id);
        if(['awaiting_payment','parcel_received'].includes(w.status))db.prepare('INSERT INTO waybill_tracking_events (id,waybill_id,status,location,notes) VALUES (?,?,?,?,?)').run(id(),w.id,'paid',w.destination_city,'Payment verified by provider');
      }
    }
    if(payment.market_run_id){
      const m=db.prepare('SELECT * FROM market_runs WHERE id=?').get(payment.market_run_id);
      if(m&&m.status==='approved')db.prepare("UPDATE market_runs SET status='agent_assigned',updated_at=datetime('now') WHERE id=? AND agent_id IS NOT NULL").run(m.id);
    }
    if(payment.investment_application_id){
      const a=db.prepare('SELECT * FROM investment_applications WHERE id=?').get(payment.investment_application_id);
      if(!a||a.status!=='approved')throw new Error('Investment application is not approved for funding.');
      const opportunity=db.prepare('SELECT * FROM opportunities WHERE id=?').get(a.opportunity_id);
      if(opportunity.capacity&&opportunity.subscribed+a.amount>opportunity.capacity){
        db.prepare("UPDATE payments SET status='under_review' WHERE id=?").run(payment.id);
        db.prepare("UPDATE investment_applications SET status='under_review' WHERE id=?").run(a.id);
        db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`LED-PAY-${payment.reference}`,'investment_funding_review',payment.amount,payment.id,'payment','Verified funds pending capacity review');
        notify(a.investor_id,'Investment payment review',`Your payment for ${a.reference} was received, but capacity requires an operations review.`,'investment',a.id);
        return {underReview:true,paymentId:payment.id};
      }
      const start=new Date(),maturity=new Date(start);maturity.setMonth(maturity.getMonth()+Number(opportunity.duration_months||6));
      const investmentId=id();
      db.prepare(`INSERT INTO investments (id,application_id,investor_id,opportunity_id,principal,start_date,maturity_date,status) VALUES (?,?,?,?,?,?,?,'active')`)
        .run(investmentId,a.id,a.investor_id,a.opportunity_id,a.amount,start.toISOString(),maturity.toISOString());
      const projected=Math.round(a.amount*Number(opportunity.projected_return_pct||0)/100);
      db.prepare("INSERT INTO investment_earnings (id,investment_id,projected_amount,actual_amount,type,reference) VALUES (?,?,?,0,'projected',?)").run(id(),investmentId,projected,`PROJ-${a.reference}`);
      db.prepare("UPDATE investment_applications SET status='funded' WHERE id=?").run(a.id);
      db.prepare('UPDATE opportunities SET subscribed=subscribed+? WHERE id=?').run(a.amount,opportunity.id);
      if(opportunity.capacity&&opportunity.subscribed+a.amount>=opportunity.capacity)db.prepare("UPDATE opportunities SET status='fully_subscribed' WHERE id=? AND status='published'").run(opportunity.id);
      db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`LED-${payment.reference}`,'investment_funding',a.amount,investmentId,'investment',`Verified investment funding ${payment.reference}`);
      notify(a.investor_id,'Investment funded',`Investment ${a.reference} is active. Projected earnings are estimates, not guaranteed returns.`,'investment',investmentId);
    }
    db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`LED-PAY-${payment.reference}`,'customer_payment',payment.amount,payment.id,'payment',`Provider-verified payment ${payment.reference}`);
  });
  const outcome=changed();
  if(!outcome?.duplicate){
    if(payment.user_id)notify(payment.user_id,outcome?.underReview?'Payment received — review in progress':'Payment confirmed',`Payment reference ${payment.reference} was ${outcome?.underReview?'received and requires review':'verified'}.`,'payment',payment.id);
    audit(actor,'payment.verified','payment',payment.id,{status:payment.status},{status:outcome?.underReview?'under_review':'successful',provider:payment.provider},outcome?.underReview?'Capacity review required':'Verified against payment provider',null);
  }
  return {duplicate:!!outcome?.duplicate,paymentId:payment.id,underReview:!!outcome?.underReview};
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
  if(!response.ok||!data.status)throw Object.assign(new Error(data.message||'Payment provider could not start checkout.'),{status:502});
  db.prepare("UPDATE payments SET status=CASE WHEN status='pending' THEN 'initiated' ELSE status END,provider_ref=COALESCE(provider_ref,?),authorization_url=?,access_code=?,updated_at=datetime('now') WHERE id=? AND status IN ('pending','initiated','successful','under_review')").run(data.data.reference||payment.reference,data.data.authorization_url||null,data.data.access_code||null,payment.id);
  return data.data;
}
export async function verifyPaystackPayment(reference){
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret)throw Object.assign(new Error('Payment verification is not configured.'),{status:503});
  const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`},signal:AbortSignal.timeout(10_000)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||!result.status)throw Object.assign(new Error(result.message||'Payment provider verification failed.'),{status:502});
  const payment=db.prepare('SELECT * FROM payments WHERE reference=? OR provider_ref=?').get(reference,reference);
  if(!payment)throw Object.assign(new Error('Payment reference not found.'),{status:404});
  if(['failed','abandoned'].includes(String(result.data?.status||'').toLowerCase())){
    const markFailed=db.transaction(()=>{
      const changed=db.prepare("UPDATE payments SET status='failed',provider_ref=COALESCE(?,provider_ref),updated_at=datetime('now') WHERE id=? AND status IN ('pending','initiated')").run(String(result.data.reference||''),payment.id);
      if(changed.changes&&payment.delivery_id)db.prepare("UPDATE deliveries SET payment_status='failed',updated_at=datetime('now') WHERE id=? AND payment_status<>'successful'").run(payment.delivery_id);
      if(changed.changes&&payment.waybill_id)db.prepare("UPDATE waybills SET payment_status='failed',updated_at=datetime('now') WHERE id=? AND payment_status<>'successful'").run(payment.waybill_id);
      return changed.changes;
    });
    if(markFailed()&&payment.user_id)notify(payment.user_id,'Payment not completed',`Payment ${payment.reference} was not completed. You may retry from your DigiTrans workspace.`,'payment',payment.id);
    const finalStatus=db.prepare('SELECT status FROM payments WHERE id=?').get(payment.id)?.status||'failed';
    return {paymentId:payment.id,status:finalStatus};
  }
  const outcome=settleVerifiedPayment(payment,result.data,null);
  return {paymentId:payment.id,status:outcome.underReview?'under_review':'successful'};
}
export function verifyPaystackSignature(rawBody,signature){
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret||!signature)return false;
  const expected=crypto.createHmac('sha512',secret).update(rawBody).digest('hex');
  const a=Buffer.from(expected,'hex'),b=Buffer.from(signature,'hex');
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
