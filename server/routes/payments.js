import {asyncRouter} from '../async-router.js';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requireRole, requirePermission, userHasPermission, audit } from '../auth.js';
import {initializePaystackPayment,settleVerifiedPayment,verifyPaystackPayment,verifyPaystackSignature,refundPaystackPayment,reference} from '../payments.js';
import {applyFailedPaystackPayment} from '../payment-rpc.js';
import {parseDateRange,parsePagination,parseSearchQuery} from '../query-filters.js';
import {flushTransactionalEmailOutboxBestEffort} from '../email-outbox.js';
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
  const canReadAll=await userHasPermission(req.user,'finance.read');
  if(!p||p.user_id!==req.user.id&&!canReadAll)return res.status(404).json({error:'Payment not found.'});
  try{
    const result=await verifyPaystackPayment(req.params.reference);
    await flushTransactionalEmailOutboxBestEffort();
    res.json(result);
  }catch(e){res.status(e.status||502).json({error:e.status?e.message:'Payment verification could not be completed. Please retry shortly.'});}
});
router.get('/payments',requireAuth,async (req, res) => {
  const canReadAll=await userHasPermission(req.user,'finance.read');
  const status=String(req.query.status||'').trim(),search=parseSearchQuery(req.query.search);
  const focus=String(req.query.focus||'').trim().slice(0,120)||null;
  let from=null,to=null;
  try{({from,to}=parseDateRange(req.query));}catch(error){return res.status(error.status||400).json({error:error.message});}
  if(status&&!['pending','initiated','successful','under_review','failed','cancelled','reversed','refunded'].includes(status))return res.status(400).json({error:'Choose a supported payment status.'});
  const statusFilter=status||null,scopeAll=canReadAll?1:0;
  const {page,limit,offset}=parsePagination(req.query,{defaultLimit:50,maxLimit:100});
  const total=Number((await db.prepare(`SELECT COUNT(*) total FROM public.payments
    WHERE (? = 1 OR user_id = ?)
      AND (CAST(? AS text) IS NULL OR status = ?)
      AND (CAST(? AS text) IS NULL OR reference ILIKE ? OR provider_ref ILIKE ?)
      AND (CAST(? AS date) IS NULL OR created_at >= CAST(? AS date))
      AND (CAST(? AS date) IS NULL OR created_at < (CAST(? AS date) + INTERVAL '1 day'))
      AND (CAST(? AS text) IS NULL OR id = ? OR reference = ?)`).get(scopeAll,req.user.id,statusFilter,statusFilter,search,search,search,from,from,to,to,focus,focus,focus))?.total||0);
  const rows=await db.prepare(`SELECT id,reference,amount,provider,status,created_at,updated_at FROM public.payments
    WHERE (? = 1 OR user_id = ?)
      AND (CAST(? AS text) IS NULL OR status = ?)
      AND (CAST(? AS text) IS NULL OR reference ILIKE ? OR provider_ref ILIKE ?)
      AND (CAST(? AS date) IS NULL OR created_at >= CAST(? AS date))
      AND (CAST(? AS date) IS NULL OR created_at < (CAST(? AS date) + INTERVAL '1 day'))
      AND (CAST(? AS text) IS NULL OR id = ? OR reference = ?)
    ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(scopeAll,req.user.id,statusFilter,statusFilter,search,search,search,from,from,to,to,focus,focus,focus,limit,offset);
  res.json({payments:rows,page,pages:Math.ceil(total/limit),total,countOnPage:rows.length});
});

router.post('/payments/:id/refund',requireAuth,requirePermission('finance.manage'),async(req,res)=>{
  const payment=await db.prepare("SELECT * FROM public.payments WHERE id=? AND provider='paystack'").get(req.params.id);
  if(!payment)return res.status(404).json({error:'Payment not found.'});
  if(payment.status!=='successful')return res.status(409).json({error:'Only successfully verified Paystack payments can be refunded.'});
  const requested=Number(req.body?.amount??payment.amount);
  if(!Number.isSafeInteger(requested)||requested<=0)return res.status(400).json({error:'Refund amount must be a positive whole naira amount.'});
  const already=Number((await db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM public.refunds WHERE payment_id=? AND status IN ('pending','processing','processed','successful')").get(payment.id)).total||0);
  if(requested+already>payment.amount)return res.status(409).json({error:'The requested refund exceeds the remaining refundable amount.'});
  const providerReference=payment.provider_ref||payment.reference;
  let providerRefund;
  try{providerRefund=await refundPaystackPayment({providerReference,amount:requested,customerNote:req.body?.customerNote,merchantNote:req.body?.merchantNote});}
  catch(error){return res.status(error.status||502).json({error:error.status?error.message:'Paystack refund could not be completed. No local refund was recorded.'});}
  const refundStatus=String(providerRefund?.status||'pending').toLowerCase();
  const refundReference=String(providerRefund?.reference||providerRefund?.id||reference('REF')).slice(0,200);
  try{
    await db.transaction(async()=>{
      await db.prepare('INSERT INTO public.refunds (id,payment_id,reference,amount,reason,status) VALUES (?,?,?,?,?,?)')
        .run(id(),payment.id,refundReference,requested,String(req.body?.reason||'').trim().slice(0,500)||null,refundStatus);
      if(refundStatus==='processed'&&requested+already===payment.amount){
        await db.prepare("UPDATE public.payments SET status='refunded',updated_at=now() WHERE id=? AND status='successful'").run(payment.id);
      }
    });
  }catch(error){
    logger.error('payments.paystack_refund_record_failed',{requestId:req.requestId,error});
    return res.status(503).json({error:'Paystack accepted the refund, but DigiTrans could not record it. Contact finance with the provider refund reference.',providerReference:refundReference});
  }
  await audit(req.user,'payment.refunded','payment',payment.id,{status:payment.status},{status:refundStatus,amount:requested,providerReference:refundReference},String(req.body?.reason||'Paystack refund'),req.ip);
  res.status(201).json({paymentId:payment.id,reference:refundReference,amount:requested,status:refundStatus});
});

router.post('/payments/paystack/webhook',async(req,res)=>{
  const raw=Buffer.isBuffer(req.rawBody)?req.rawBody:Buffer.from('');
  if(!verifyPaystackSignature(raw,req.get('x-paystack-signature')))return res.status(401).send('Invalid signature');
  let event;try{event=JSON.parse(raw.toString('utf8'));}catch{return res.status(400).send('Invalid event');}
  const data=event?.data,providerStatus=String(data?.status||'').toLowerCase();
  if(!data?.reference||!['charge.success','charge.failed','charge.abandoned'].includes(String(event.event||'')))return res.status(200).json({received:true});
  const payment=await db.prepare('SELECT * FROM public.payments WHERE reference=? OR provider_ref=?').get(data.reference,data.reference);
  if(!payment)return res.status(200).json({received:true});
  try{
    if(event.event==='charge.success'&&providerStatus==='success'){
      await settleVerifiedPayment(payment,data,null,raw);
      await flushTransactionalEmailOutboxBestEffort();
    }else if(['failed','abandoned'].includes(providerStatus)){
      await applyFailedPaystackPayment({paymentId:payment.id,providerData:data,rawPayload:raw});
    }else return res.status(200).json({received:true});
    res.status(200).json({received:true});
  }catch(error){
    logger.error('payments.paystack_webhook_reconciliation_failed',{requestId:req.requestId,error});
    const status=Number(error?.status)||503;
    res.status(status>=500?503:status).json({received:true,reconciled:false});
  }
});

export default router;
