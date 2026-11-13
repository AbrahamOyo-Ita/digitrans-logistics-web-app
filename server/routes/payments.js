import {asyncRouter} from '../async-router.js';
import express from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import {initializePaystackPayment,settleVerifiedPayment,verifyPaystackPayment,verifyPaystackSignature,reference} from '../payments.js';
import {applyFailedPaystackPayment} from '../payment-rpc.js';
import {logger} from '../logger.js';

const router=asyncRouter();
const id=()=>crypto.randomUUID();

router.post('/payments/initiate',requireAuth,requireRole('customer','student','vendor','investor'),async(req,res)=>{
  const type=String(req.body?.serviceType||''),recordId=String(req.body?.recordId||'');
  let owner=null,amount=0,relation={};
  if(type==='delivery'){
    const d=await db.prepare('SELECT * FROM deliveries WHERE id=?').get(recordId);if(!d)return res.status(404).json({error:'Delivery not found.'});
    if(d.customer_id!==req.user.id&&d.vendor_id!==req.user.id)return res.status(404).json({error:'Delivery not found.'});
    if(!['pending_confirmation','awaiting_assignment'].includes(d.status))return res.status(409).json({error:'This delivery is not awaiting payment.'});
    owner=d.customer_id||d.vendor_id;amount=d.fee;relation={delivery_id:d.id};
  }else if(type==='waybill'){
    const w=await db.prepare('SELECT * FROM waybills WHERE id=?').get(recordId);if(!w||w.customer_id!==req.user.id)return res.status(404).json({error:'Waybill not found.'});
    if(w.payment_status==='successful')return res.status(409).json({error:'This waybill has already been paid.'});
    if(!['parcel_received','awaiting_payment'].includes(w.status))return res.status(409).json({error:'Payment becomes available after operations confirms parcel intake.'});
    owner=w.customer_id;amount=w.fee;relation={waybill_id:w.id};
  }else if(type==='market_run'){
    const m=await db.prepare('SELECT * FROM market_runs WHERE id=?').get(recordId);if(!m||m.customer_id!==req.user.id)return res.status(404).json({error:'Market Run not found.'});
    if(!['approved','agent_assigned'].includes(m.status)||!m.final_total)return res.status(409).json({error:'Approve the final Market Run estimate before payment.'});
    owner=m.customer_id;amount=m.final_total;relation={market_run_id:m.id};
  }else if(type==='investment'){
    const a=await db.prepare('SELECT * FROM investment_applications WHERE id=?').get(recordId);if(!a||a.investor_id!==req.user.id)return res.status(404).json({error:'Investment application not found.'});
    if(a.status!=='approved')return res.status(409).json({error:'Only approved investment applications can be funded.'});
    owner=a.investor_id;amount=a.amount;relation={investment_application_id:a.id};
  }else return res.status(400).json({error:'Unsupported payment service.'});
  if(!Number.isSafeInteger(amount)||amount<=0)return res.status(400).json({error:'This record has no payable amount.'});
  const active=await db.prepare(`SELECT * FROM payments WHERE user_id=? AND status IN ('pending','initiated','successful','under_review') AND (delivery_id=? OR waybill_id=? OR market_run_id=? OR investment_application_id=?) ORDER BY created_at DESC LIMIT 1`).get(owner,relation.delivery_id||'',relation.waybill_id||'',relation.market_run_id||'',relation.investment_application_id||'');
  if(active?.status==='successful')return res.status(409).json({error:'Payment has already been verified.',reference:active.reference});
  if(active?.status==='under_review')return res.status(409).json({error:'This payment requires finance review. Contact DigiTrans support before trying again.',reference:active.reference});
  if(active?.status==='initiated'&&active.authorization_url)return res.json({reference:active.reference,authorizationUrl:active.authorization_url,accessCode:active.access_code,amount:active.amount,currency:'NGN',reused:true});
  if(active?.status==='initiated'||active?.status==='pending')return res.status(409).json({error:'A payment attempt is already in progress. Wait a moment and try again.',reference:active.reference});
  const paymentId=id(),paymentRef=reference(),idempotency=String(req.get('Idempotency-Key')||req.body?.idempotencyKey||crypto.randomUUID()).slice(0,120);
  let payment={id:paymentId,reference:paymentRef,user_id:owner,amount,provider:'paystack',...relation};
  try{
    await db.prepare(`INSERT INTO payments (id,reference,user_id,delivery_id,waybill_id,market_run_id,investment_application_id,amount,provider,status,idempotency_key)
      VALUES (?,?,?,?,?,?,?,?,?,'pending',?)`).run(paymentId,paymentRef,owner,relation.delivery_id||null,relation.waybill_id||null,relation.market_run_id||null,relation.investment_application_id||null,amount,'paystack',idempotency);
  }catch(e){if(String(e.message).includes('UNIQUE'))return res.status(409).json({error:'This payment request has already been submitted.'});throw e;}
  const email=(await db.prepare('SELECT email FROM users WHERE id=?').get(owner))?.email;
  const callbackUrl=process.env.PAYMENT_CALLBACK_URL||`${process.env.APP_URL||`${req.protocol}://${req.get('host')}`}/payment/return`;
  try{
    const checkout=await initializePaystackPayment({payment,email,callbackUrl});
    res.status(201).json({reference:paymentRef,authorizationUrl:checkout.authorization_url,accessCode:checkout.access_code,amount,currency:'NGN'});
  }catch(e){
    const localStatus=e.status?'failed':'under_review';
    await db.prepare("UPDATE payments SET status=?,updated_at=now() WHERE id=? AND status='pending'").run(localStatus,paymentId);
    res.status(e.status||502).json({error:e.status?e.message:'Payment provider could not be reached. This attempt is paused for reconciliation; contact DigiTrans support before retrying.'});
  }
});

router.get('/payments/verify/:reference',requireAuth,async(req,res)=>{
  const p=await db.prepare('SELECT * FROM payments WHERE reference=? OR provider_ref=?').get(req.params.reference,req.params.reference);
  if(!p||p.user_id!==req.user.id&&!['super_admin','finance_officer'].includes(req.user.role))return res.status(404).json({error:'Payment not found.'});
  try{const result=await verifyPaystackPayment(req.params.reference);res.json(result);}catch(e){res.status(e.status||502).json({error:e.status?e.message:'Payment verification could not be completed. Please retry shortly.'});}
});
router.get('/payments',requireAuth,async (req, res) => {
  const rows=['super_admin','finance_officer'].includes(req.user.role)?await db.prepare('SELECT id,reference,amount,provider,status,created_at,updated_at FROM payments ORDER BY created_at DESC LIMIT 100').all():await db.prepare('SELECT id,reference,amount,provider,status,created_at,updated_at FROM payments WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  res.json({payments:rows});
});

router.post('/payments/paystack/webhook',express.raw({type:'application/json'}),async(req,res)=>{
  const raw=Buffer.isBuffer(req.body)?req.body:Buffer.from('');
  if(!verifyPaystackSignature(raw,req.get('x-paystack-signature')))return res.status(401).send('Invalid signature');
  let event;try{event=JSON.parse(raw.toString('utf8'));}catch{return res.status(400).send('Invalid event');}
  const data=event?.data,providerStatus=String(data?.status||'').toLowerCase();
  if(!data?.reference||!['charge.success','charge.failed','charge.abandoned'].includes(String(event.event||'')))return res.status(200).json({received:true});
  const payment=await db.prepare('SELECT * FROM public.payments WHERE reference=? OR provider_ref=?').get(data.reference,data.reference);
  if(!payment)return res.status(200).json({received:true});
  try{
    if(event.event==='charge.success'&&providerStatus==='success')await settleVerifiedPayment(payment,data,null,raw);
    else if(['failed','abandoned'].includes(providerStatus))await applyFailedPaystackPayment({paymentId:payment.id,providerData:data,rawPayload:raw});
    else return res.status(200).json({received:true});
    res.status(200).json({received:true});
  }catch(error){
    logger.error('payments.paystack_webhook_reconciliation_failed',{requestId:req.requestId,error});
    const status=Number(error?.status)||503;
    res.status(status>=500?503:status).json({received:true,reconciled:false});
  }
});

export default router;
