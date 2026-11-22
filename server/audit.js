import crypto from 'node:crypto';

export const AUDIT_CHAIN_GENESIS='0'.repeat(64);
const SECRET_FIELD=/password|token|secret|authorization|cookie|api[_-]?key|client[_-]?secret|verification[_-]?code|otp/i;
const SECRET_TEXT=/(password|token|secret|authorization|cookie|api[_-]?key|client[_-]?secret|verification[_-]?code|otp)(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi;

function cleanString(value,max=4000){
 return String(value).replace(/\bBearer\s+[^\s,;]+/gi,'Bearer [REDACTED]')
  .replace(SECRET_TEXT,(_match,label,separator)=>`${label}${separator}[REDACTED]`).slice(0,max);
}

export function auditText(value,max=2000){
 if(value===null||value===undefined)return null;
 return cleanString(value,max);
}
function normalizeValue(value,key=''){
 if(SECRET_FIELD.test(key))return '[REDACTED]';
 if(value===null||value===undefined)return null;
 if(typeof value==='string')return cleanString(value);
 if(typeof value==='number')return Number.isFinite(value)?value:String(value);
 if(typeof value==='boolean')return value;
 if(typeof value==='bigint')return String(value);
 if(Array.isArray(value))return value.slice(0,500).map(item=>normalizeValue(item));
 if(typeof value==='object'){
  if(value instanceof Date)return value.toISOString();
  const result={};
  for(const name of Object.keys(value).sort().slice(0,500))result[name]=normalizeValue(value[name],name);
  return result;
 }
 return cleanString(value);
}

export function auditJson(value){
 if(value===undefined)return null;
 return JSON.stringify(normalizeValue(value));
}

function sanitizeStoredJson(value){
 if(value===null||value===undefined)return null;
 try{
  const normalized=auditJson(JSON.parse(String(value)));
  if(normalized.length<=20000)return normalized;
  return JSON.stringify({truncated:true,preview:normalized.slice(0,19000)});
 }catch{return auditText(value,12000);}
}

export function sanitizeAuditRecord(row){
 return {
  ...row,
  prev_value:sanitizeStoredJson(row?.prev_value),
  new_value:sanitizeStoredJson(row?.new_value),
  reason:auditText(row?.reason,2000),
  user_agent:auditText(row?.user_agent,300),
 };
}

export function auditHashPayload(event){
 return {
  chain_sequence:Number(event.chain_sequence??event.sequence),
  id:String(event.id),
  actor_id:event.actor_id??null,
  actor_role:event.actor_role??null,
  actor_email:event.actor_email??null,
  actor_name:event.actor_name??null,
  action:String(event.action),
  record_type:event.record_type??null,
  record_id:event.record_id??null,
  prev_value:event.prev_value??null,
  new_value:event.new_value??null,
  reason:event.reason??null,
  ip:event.ip??null,
  request_id:event.request_id??null,
  user_agent:event.user_agent??null,
  created_at:new Date(event.created_at).toISOString(),
  previous_hash:String(event.previous_hash||AUDIT_CHAIN_GENESIS),
 };
}

export function calculateAuditHash(event){
 return crypto.createHash('sha256').update(JSON.stringify(auditHashPayload(event))).digest('hex');
}

export function createAuditChainVerifier({lastSequence=0,lastHash=AUDIT_CHAIN_GENESIS}={}){
 let previousHash=String(lastHash||AUDIT_CHAIN_GENESIS),nextSequence=Number(lastSequence)+1,failure=null;
 const append=rows=>{
  if(failure)return failure;
  for(const row of rows||[]){
   const sequence=Number(row.chain_sequence);
   if(sequence!==nextSequence){failure={valid:false,checked:nextSequence-1,reason:`Missing or out-of-order audit sequence ${nextSequence}.`};return failure;}
   if(String(row.previous_hash||'')!==previousHash){failure={valid:false,checked:nextSequence-1,reason:`Previous hash mismatch at sequence ${sequence}.`};return failure;}
   let expectedHash;
   try{expectedHash=calculateAuditHash(row);}catch{failure={valid:false,checked:nextSequence-1,reason:`Event hash could not be calculated at sequence ${sequence}.`};return failure;}
   if(expectedHash!==String(row.entry_hash||'')){failure={valid:false,checked:nextSequence-1,reason:`Event hash mismatch at sequence ${sequence}.`};return failure;}
   previousHash=expectedHash;nextSequence++;
  }
  return {valid:true,checked:nextSequence-1,headHash:previousHash};
 };
 const verify=head=>{
  if(failure)return failure;
  const checked=nextSequence-1;
  if(Number(head?.last_sequence)!==checked)return {valid:false,checked,reason:'Audit chain head sequence does not match the recorded events.'};
  if(String(head?.last_hash||AUDIT_CHAIN_GENESIS)!==previousHash)return {valid:false,checked,reason:'Audit chain head hash does not match the last event.'};
  return {valid:true,checked,headHash:previousHash};
 };
 return {append,verify};
}

export function verifyAuditChainRows(rows=[],head={last_sequence:0,last_hash:AUDIT_CHAIN_GENESIS}){
 const verifier=createAuditChainVerifier();
 verifier.append(rows);
 return verifier.verify(head);
}

export async function verifyAuditHistory(database,{batchSize=500}={}){
 if(!database?.prepare||!database?.transaction)throw new TypeError('A database adapter is required to verify audit history.');
 if(!Number.isInteger(batchSize)||batchSize<1||batchSize>5000)throw new RangeError('Audit verification batch size must be between 1 and 5000.');
 const run=database.transaction(async()=>{
  const [head,legacy]=await Promise.all([
   database.prepare('SELECT last_sequence,last_hash FROM public.audit_chain_heads WHERE id=1').get(),
   database.prepare('SELECT COUNT(*) total FROM public.audit_logs WHERE chain_sequence IS NULL').get(),
  ]);
  const verifier=createAuditChainVerifier();let after=0;
  while(true){
   const rows=await database.prepare(`SELECT id,chain_sequence,actor_id,actor_role,actor_email,actor_name,action,record_type,record_id,prev_value,new_value,reason,ip,request_id,user_agent,created_at,previous_hash,entry_hash
     FROM public.audit_logs WHERE chain_sequence>? ORDER BY chain_sequence LIMIT ?`).all(after,batchSize);
   if(!rows.length)break;
   const progress=verifier.append(rows);
   if(!progress.valid)break;
   after=Number(rows.at(-1).chain_sequence);
  }
  return {integrity:verifier.verify(head||{last_sequence:0,last_hash:AUDIT_CHAIN_GENESIS}),legacyEntries:Number(legacy?.total||0)};
 },{isolation:'repeatable read'});
 return run();
}
