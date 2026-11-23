import db from './db.js';
import {logger} from './logger.js';
import {isEmailConfigured,sendEmail} from './email.js';
import {createTransactionalEmailTemplate} from './email-templates.js';

const MAX_ATTEMPTS=8;
const CLAIM_TTL_MINUTES=3;
const MAX_BATCH_SIZE=50;

function parsePayload(value){
 if(value&&typeof value==='object')return value;
 if(typeof value==='string'){try{return JSON.parse(value);}catch{}}
 return {};
}
function looksLikeEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());}

async function claimOutboxBatch(client,limit){
 return client.transaction(async()=>{
  const candidates=await client.prepare(`SELECT id,recipient_user_id,event_type,entity_type,entity_id,payload,attempts
    FROM public.transactional_email_outbox
    WHERE (status='pending' AND available_at<=now())
       OR (status='processing' AND locked_until<=now())
    ORDER BY created_at ASC,id ASC
    LIMIT ? FOR UPDATE SKIP LOCKED`).all(limit);
  const claimed=[];
  for(const candidate of candidates){
   const lock=await client.prepare(`UPDATE public.transactional_email_outbox
     SET status='processing',attempts=attempts+1,locked_until=now()+(? * interval '1 minute'),last_error=NULL
     WHERE id=? RETURNING attempts`).get(CLAIM_TTL_MINUTES,candidate.id);
   if(lock)claimed.push({...candidate,attempts:lock.attempts});
  }
  return claimed;
 })();
}

async function markSkipped(client,id,reason){
 await client.prepare(`UPDATE public.transactional_email_outbox
  SET status='skipped',locked_until=NULL,last_error=?,sent_at=NULL WHERE id=? AND status='processing'`).run(reason,id);
}
async function markSent(client,id,providerId){
 await client.prepare(`UPDATE public.transactional_email_outbox
  SET status='sent',provider_id=?,sent_at=now(),locked_until=NULL,last_error=NULL WHERE id=? AND status='processing'`).run(providerId,id);
}
async function markFailed(client,record,error){
 const exhausted=record.attempts>=MAX_ATTEMPTS;
 const delayMs=Math.min(60_000*(2**Math.max(0,record.attempts-1)),60*60*1000);
 const availableAt=new Date(Date.now()+delayMs);
 await client.prepare(`UPDATE public.transactional_email_outbox
  SET status=?,available_at=?,locked_until=NULL,last_error=? WHERE id=? AND status='processing'`)
  .run(exhausted?'failed':'pending',availableAt,exhausted?'Provider did not accept the message after retries.':'Provider delivery failed; retry scheduled.',record.id);
 logger.error('email.outbox_delivery_failed',{outboxId:record.id,eventType:record.event_type,attempt:record.attempts,retryScheduled:!exhausted,error});
}

async function sendRecord(record,{client,env,send}){
 if(!record.recipient_user_id){await markSkipped(client,record.id,'Recipient account is no longer available.');return 'skipped';}
 const recipient=await client.prepare(`SELECT u.email,p.full_name
  FROM public.users AS u LEFT JOIN public.profiles AS p ON p.user_id=u.id
  WHERE u.id=?`).get(record.recipient_user_id);
 const to=String(recipient?.email||'').trim();
 if(!recipient||!looksLikeEmail(to)){
  await markSkipped(client,record.id,'A valid recipient email address is not available.');
  return 'skipped';
 }
 try{
  const message=createTransactionalEmailTemplate({
   eventType:record.event_type,name:recipient.full_name,payload:parsePayload(record.payload),baseUrl:env.APP_URL,
  });
  const providerResult=await send({to,...message,idempotencyKey:record.id});
  if(typeof providerResult?.id!=='string'||!providerResult.id)throw new Error('The email provider did not return a message ID.');
  await markSent(client,record.id,providerResult.id);
  return 'sent';
 }catch(error){
  await markFailed(client,record,error);
  return record.attempts>=MAX_ATTEMPTS?'failed':'retrying';
 }
}

/**
 * Drain the database-backed transactional email outbox. Status-change triggers insert
 * events in the same transaction as their business change; this worker can safely retry
 * provider failures and concurrent cron invocations without sending a row twice in flight.
 */
export async function processTransactionalEmailOutbox({client=db,env=process.env,send=sendEmail,limit=8,concurrency=4}={}){
 if(!isEmailConfigured(env))return {configured:false,claimed:0,sent:0,retrying:0,failed:0,skipped:0};
 const batchSize=Math.min(MAX_BATCH_SIZE,Math.max(1,Math.floor(Number(limit)||20)));
 const workerCount=Math.min(batchSize,Math.max(1,Math.floor(Number(concurrency)||4)));
 const records=await claimOutboxBatch(client,batchSize);
 const counts={sent:0,retrying:0,failed:0,skipped:0};
 const queue=[...records];
 await Promise.all(Array.from({length:workerCount},async()=>{
  while(queue.length){
   const record=queue.shift();
   const result=await sendRecord(record,{client,env,send});
   counts[result]++;
  }
 }));
 return {configured:true,claimed:records.length,...counts};
}

/**
 * Best-effort bounded flush for request handlers in serverless environments where
 * background tasks cannot outlive the HTTP response. Never throws or blocks beyond timeoutMs.
 */
export async function flushTransactionalEmailOutboxBestEffort({limit=6,concurrency=3,timeoutMs=1800,env=process.env}={}){
 if(!isEmailConfigured(env))return null;
 let timer;
 try{
  const timeout=new Promise(resolve=>{timer=setTimeout(()=>resolve(null),timeoutMs);});
  return await Promise.race([
   processTransactionalEmailOutbox({limit,concurrency,env}).catch(error=>{
    logger.warn('email.outbox_inline_drain_failed',{error});
    return null;
   }),
   timeout,
  ]);
 }finally{clearTimeout(timer);}
}
