import test from 'node:test';
import assert from 'node:assert/strict';
import {AUDIT_CHAIN_GENESIS,auditJson,auditText,calculateAuditHash,createAuditChainVerifier,sanitizeAuditRecord,verifyAuditChainRows,verifyAuditHistory} from './audit.js';

function event(sequence,previousHash,extra={}){
 const row={
  chain_sequence:sequence,id:`00000000-0000-4000-8000-${String(sequence).padStart(12,'0')}`,
  actor_id:'10000000-0000-4000-8000-000000000001',actor_role:'finance_officer',
  actor_email:'finance@example.test',actor_name:'Finance Officer',action:'payment.reviewed',
  record_type:'payment',record_id:`PAY-${sequence}`,prev_value:null,new_value:'{"status":"successful"}',
  reason:null,ip:'203.0.113.5',request_id:`req-${sequence}`,user_agent:'Test client',
  created_at:new Date(Date.UTC(2026,10,16,12,0,sequence)).toISOString(),previous_hash:previousHash,
  ...extra,
 };
 row.entry_hash=calculateAuditHash(row);
 return row;
}

test('audit snapshots redact secret fields and token-like free-text before storage',()=>{
 const normalized=JSON.parse(auditJson({email:'person@example.test',password:'open-sesame',nested:{api_key:'secret-key',message:'Bearer abc.def token=leaked'}}));
 assert.deepEqual(normalized,{email:'person@example.test',nested:{api_key:'[REDACTED]',message:'Bearer [REDACTED] token=[REDACTED]'},password:'[REDACTED]'});
 assert.equal(auditText('recovery token: super-secret-value'), 'recovery token: [REDACTED]');
 assert.equal(auditText(null),null);
});

test('audit reads redact sensitive values already present in legacy rows',()=>{
 const row=sanitizeAuditRecord({
  prev_value:'{"status":"pending","password":"legacy-password"}',
  new_value:'{"recovery_token":"legacy-token","message":"Bearer abc.def"}',
  reason:'Legacy reason included api_key=old-secret',user_agent:'session_token=old-session',
 });
 assert.deepEqual(JSON.parse(row.prev_value),{status:'pending',password:'[REDACTED]'});
 assert.deepEqual(JSON.parse(row.new_value),{message:'Bearer [REDACTED]',recovery_token:'[REDACTED]'});
 assert.equal(row.reason,'Legacy reason included api_key=[REDACTED]');
 assert.equal(row.user_agent,'session_token=[REDACTED]');
});

test('audit hashes are canonical, sequential, and detect changes or broken links',()=>{
 const first=event(1,AUDIT_CHAIN_GENESIS),second=event(2,first.entry_hash);
 const head={last_sequence:2,last_hash:second.entry_hash};
 assert.deepEqual(verifyAuditChainRows([first,second],head),{valid:true,checked:2,headHash:second.entry_hash});
 const changed={...second,reason:'silently changed'};
 assert.equal(verifyAuditChainRows([first,changed],head).valid,false);
 const skipped=event(3,first.entry_hash);
 assert.match(verifyAuditChainRows([first,skipped],{last_sequence:3,last_hash:skipped.entry_hash}).reason,/sequence 2/);
 assert.match(verifyAuditChainRows([first,second],{last_sequence:2,last_hash:'f'.repeat(64)}).reason,/head hash/);
});

test('audit verifier can validate bounded pages without loading the full history at once',()=>{
 const first=event(1,AUDIT_CHAIN_GENESIS),second=event(2,first.entry_hash),third=event(3,second.entry_hash);
 const verifier=createAuditChainVerifier();
 assert.equal(verifier.append([first,second]).checked,2);
 assert.equal(verifier.append([third]).checked,3);
 assert.equal(verifier.verify({last_sequence:3,last_hash:third.entry_hash}).valid,true);
});

test('database audit verification uses a repeatable-read transaction and streams fixed-size batches',async()=>{
 const rows=[];let previousHash=AUDIT_CHAIN_GENESIS;
 for(let sequence=1;sequence<=501;sequence++){const row=event(sequence,previousHash);rows.push(row);previousHash=row.entry_hash;}
 const calls=[],transactionOptions=[];
 const database={
  transaction(callback,options){transactionOptions.push(options);return async()=>callback();},
  prepare(sql){return {
   async get(){return sql.includes('audit_chain_heads')?{last_sequence:501,last_hash:previousHash}:{total:2};},
   async all(after,batchSize){const page=rows.filter(row=>row.chain_sequence>after).slice(0,batchSize);calls.push({after,batchSize,count:page.length});return page;},
  };},
 };
 const result=await verifyAuditHistory(database);
 assert.deepEqual(result,{integrity:{valid:true,checked:501,headHash:previousHash},legacyEntries:2});
 assert.deepEqual(transactionOptions,[{isolation:'repeatable read'}]);
 assert.deepEqual(calls,[{after:0,batchSize:500,count:500},{after:500,batchSize:500,count:1},{after:501,batchSize:500,count:0}]);
});

test('database audit verification reports tampering and validates batch-size bounds',async()=>{
 const first=event(1,AUDIT_CHAIN_GENESIS),changed={...event(2,first.entry_hash),reason:'tampered'};
 const rows=[first,changed];
 const database={
  transaction(callback){return async()=>callback();},
  prepare(sql){return {
   async get(){return sql.includes('audit_chain_heads')?{last_sequence:2,last_hash:changed.entry_hash}:{total:0};},
   async all(){return rows;},
  };},
 };
 const result=await verifyAuditHistory(database);
 assert.equal(result.integrity.valid,false);
 assert.match(result.integrity.reason,/Event hash mismatch at sequence 2/);
 await assert.rejects(()=>verifyAuditHistory(database,{batchSize:0}),RangeError);
});
