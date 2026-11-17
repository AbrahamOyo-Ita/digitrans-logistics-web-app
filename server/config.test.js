import test from 'node:test';
import assert from 'node:assert/strict';
import {getAllowedOrigins,getSessionCookieOptions,normalizeOrigin,validateRuntimeConfig} from './config.js';

test('production origins are HTTPS origins without path components',()=>{
  assert.equal(normalizeOrigin('https://app.example.test',{production:true,label:'test'}),'https://app.example.test');
  assert.throws(()=>normalizeOrigin('http://app.example.test',{production:true}),/HTTPS/);
  assert.throws(()=>normalizeOrigin('https://app.example.test/path',{production:true}),/origin only/);
  assert.throws(()=>normalizeOrigin('https://user:pass@app.example.test',{production:true}),/origin only/);
});

test('CORS allowlist contains configured origins and development preview hosts are handled separately',()=>{
  const origins=getAllowedOrigins({NODE_ENV:'production',APP_URL:'https://app.example.test',CLIENT_ORIGINS:'https://admin.example.test'});
  assert.deepEqual([...origins].sort(),['https://admin.example.test','https://app.example.test']);
  assert.throws(()=>getAllowedOrigins({NODE_ENV:'production',APP_URL:'https://app.example.test',CLIENT_ORIGINS:'http://localhost:5173'}),/HTTPS/);
});

test('production requires HTTPS identity and durable storage configuration',()=>{
  assert.throws(()=>validateRuntimeConfig({NODE_ENV:'production'}),/DISABLE_DEMO_SEED/);
  const valid={NODE_ENV:'production',DISABLE_DEMO_SEED:'true',APP_URL:'https://app.example.test',DATABASE_PATH:'/var/lib/digitrans/db.sqlite',UPLOADS_DIR:'/var/lib/digitrans/uploads',PAYMENT_CALLBACK_URL:'https://app.example.test/payment/return'};
  assert.doesNotThrow(()=>validateRuntimeConfig(valid));
  assert.throws(()=>validateRuntimeConfig({...valid,DATABASE_PATH:'data/db.sqlite'}),/absolute persistent/);
  assert.throws(()=>validateRuntimeConfig({...valid,PAYMENT_CALLBACK_URL:'https://other.example.test/payment/return'}),/same HTTPS origin/);
  assert.throws(()=>validateRuntimeConfig({...valid,PAYMENT_CALLBACK_URL:'https://user:pass@app.example.test/payment/return'}),/without credentials/);
  assert.throws(()=>validateRuntimeConfig({...valid,APP_URL:'http://app.example.test'}),/HTTPS/);
});

test('session cookies are secure in production and SameSite=None cannot be insecure',()=>{
  assert.deepEqual(getSessionCookieOptions({NODE_ENV:'production'}),{httpOnly:true,secure:true,sameSite:'lax',path:'/'});
  assert.throws(()=>getSessionCookieOptions({NODE_ENV:'development',SESSION_COOKIE_SAME_SITE:'none'}),/must also be Secure/);
  assert.deepEqual(getSessionCookieOptions({NODE_ENV:'development',SESSION_COOKIE_SAME_SITE:'none',SESSION_COOKIE_SECURE:'true'}),{httpOnly:true,secure:true,sameSite:'none',path:'/'});
});
