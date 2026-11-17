import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testDir=fs.mkdtempSync(path.join(os.tmpdir(),'digitrans-test-'));
process.env.DATABASE_PATH=path.join(testDir,'digitrans.db');
const {default:db}=await import('./db.js');
const {seedBase}=await import('./seed.js');
const {calculateDeliveryFee,calculateWaybillFee,calculateRiderEarnings}=await import('./pricing.js');
const {requirePermission,createSession,getSessionUser,revokeSession,revokeAllSessions}=await import('./auth.js');
seedBase({demo:true});

after(()=>{
  try{db.close();}finally{fs.rmSync(testDir,{recursive:true,force:true});}
});

test('staging seed creates role accounts and key-based permission grants',()=>{
  for(const email of ['admin@digitrans.test','ops@digitrans.test','customer@digitrans.test','rider@digitrans.test','vendor@digitrans.test','investor@digitrans.test','finance@digitrans.test','rider.manager@digitrans.test','vendor.manager@digitrans.test','investment.manager@digitrans.test','student@digitrans.test']){
    assert.ok(db.prepare('SELECT id FROM users WHERE email=?').get(email),`missing staging account ${email}`);
  }
  for(const role of ['ops_officer','rider_manager','vendor_manager','finance_officer','investment_manager']){
    assert.ok(db.prepare('SELECT 1 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id WHERE r.name=?').get(role),`permission role key not seeded for ${role}`);
  }
});

test('role middleware allows only explicitly granted permissions',()=>{
  const check=requirePermission('deliveries.read');
  const response=()=>({statusCode:200,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}});
  let called=false;check({user:{role:'ops_officer'}},response(),()=>{called=true;});assert.equal(called,true);
  called=false;const denied=response();check({user:{role:'customer'}},denied,()=>{called=true;});assert.equal(called,false);assert.equal(denied.statusCode,403);assert.equal(denied.body.error,'You do not have permission to perform this action.');
});

test('session tokens are stored hashed, resolve to a user, and revoke cleanly',()=>{
  const user=db.prepare("SELECT id FROM users WHERE email='customer@digitrans.test'").get();
  const session=createSession(user.id,{ip:'127.0.0.1',headers:{'user-agent':'domain-test'}});
  assert.ok(session.token);
  const record=db.prepare('SELECT token_hash FROM sessions WHERE id=?').get(session.sessionId);
  assert.notEqual(record.token_hash,session.token);
  assert.equal(getSessionUser(session.token).role,'customer');
  revokeSession(session.token);
  assert.equal(getSessionUser(session.token),null);
});

test('rejected accounts and revoked accounts cannot reuse existing sessions',()=>{
  const user=db.prepare("SELECT id FROM users WHERE email='customer@digitrans.test'").get();
  const session=createSession(user.id,{ip:'127.0.0.1',headers:{'user-agent':'revocation-test'}});
  db.prepare("UPDATE users SET status='rejected' WHERE id=?").run(user.id);
  assert.equal(getSessionUser(session.token),null);
  db.prepare("UPDATE users SET status='active' WHERE id=?").run(user.id);
  revokeAllSessions(user.id);
  assert.equal(getSessionUser(session.token),null);
});

test('server pricing applies service rules and validates configured Calabar routes',()=>{
  const regular=calculateDeliveryFee({zone:'Calabar Municipal'});
  assert.equal(regular.fee,1340);
  assert.equal(regular.breakdown.distance_method,'estimate_default_3km');
  const scheduled=calculateDeliveryFee({zone:'Marian',timing:'scheduled'});
  assert.equal(scheduled.fee,1540);
  const student=calculateDeliveryFee({zone:'UNICAL',isStudent:true});
  assert.equal(student.fee,800);
  const vendor=calculateDeliveryFee({zone:'Marian',isVendor:true});
  assert.equal(vendor.fee,1273);
  assert.throws(()=>calculateDeliveryFee({zone:'Unsupported area'}),/Unsupported service area/);
  assert.equal(calculateWaybillFee({origin:'Calabar',destination:'Lagos',weight:2}).fee,6500);
  assert.equal(calculateWaybillFee({origin:'Calabar',destination:'Lagos',weight:6}).band,'5_10kg');
  assert.throws(()=>calculateWaybillFee({origin:'Calabar',destination:'Unknown',weight:2}),/No waybill pricing/);
  assert.deepEqual(calculateRiderEarnings(1200,25),{riderEarnings:300,digitransShare:900});
});

test('PWA metadata targets the general app and the worker excludes private API data',()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
  const worker=fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
  assert.equal(manifest.id,'/');
  assert.equal(manifest.start_url,'/');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));
  assert.match(worker,/pathname\.startsWith\('\/api\/'\)/);
  assert.match(worker,/pathname\.startsWith\('\/uploads\/'\)/);
  const paymentColumns=db.prepare('PRAGMA table_info(payments)').all().map(column=>column.name);
  assert.ok(paymentColumns.includes('authorization_url'));
  assert.ok(paymentColumns.includes('access_code'));
});

test('database transactions roll back all writes on failure',()=>{
  const transaction=db.transaction(()=>{
    db.prepare('INSERT INTO system_settings (key,value) VALUES (?,?)').run('transaction-test','temporary');
    throw new Error('abort transaction');
  });
  assert.throws(()=>transaction(),/abort transaction/);
  assert.equal(db.prepare('SELECT key FROM system_settings WHERE key=?').get('transaction-test'),undefined);
});
