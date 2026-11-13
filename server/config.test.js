import test from 'node:test';
import assert from 'node:assert/strict';
import {getAllowedOrigins,getSessionCookieOptions,normalizeOrigin,validateRuntimeConfig} from './config.js';

const serviceKey='eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.sig';
const productionEnv={
  NODE_ENV:'production',APP_URL:'https://app.example.test',CLIENT_ORIGINS:'https://api-client.example.test',
  SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:serviceKey,
  SUPABASE_DB_URL:'postgresql://api_user:secret@db.example.test/postgres?sslmode=require',
  RESEND_API_KEY:'re_test_key',RESEND_FROM_EMAIL:'DigiTrans <no-reply@example.test>',
  PAYMENT_CALLBACK_URL:'https://app.example.test/payment/return',
};

test('production origins are HTTPS origins without path components',()=>{
  assert.equal(normalizeOrigin('https://app.example.test',{production:true,label:'test'}),'https://app.example.test');
  assert.throws(()=>normalizeOrigin('http://app.example.test',{production:true}),/HTTPS/);
  assert.throws(()=>normalizeOrigin('https://app.example.test/path',{production:true}),/origin only/);
  assert.throws(()=>normalizeOrigin('https://user:pass@app.example.test',{production:true}),/origin only/);
});

test('CORS allowlist contains configured origins and development preview hosts are handled separately',()=>{
  const origins=getAllowedOrigins({NODE_ENV:'production',APP_URL:'https://app.example.test',CLIENT_ORIGINS:'https://admin.example.test'});
  assert.deepEqual([...origins].sort(),['https://admin.example.test','https://app.example.test']);
  const productionOrigins=getAllowedOrigins({NODE_ENV:'production',APP_URL:'https://digitransdelivery.com',CLIENT_ORIGINS:'https://digitransdelivery.com,https://www.digitransdelivery.com'});
  assert.deepEqual([...productionOrigins].sort(),['https://digitransdelivery.com','https://www.digitransdelivery.com']);
  assert.throws(()=>getAllowedOrigins({NODE_ENV:'production',APP_URL:'https://app.example.test',CLIENT_ORIGINS:'http://localhost:5173'}),/HTTPS/);
});

test('runtime requires PostgreSQL and server-only Supabase configuration, with no SQLite or local-upload fallback',()=>{
  assert.throws(()=>validateRuntimeConfig({NODE_ENV:'development'}),/SUPABASE_DB_URL/);
  const local={NODE_ENV:'development',SUPABASE_URL:'http://127.0.0.1:54321',SUPABASE_SERVICE_ROLE_KEY:serviceKey,SUPABASE_DB_URL:'postgresql://postgres:postgres@localhost:54322/postgres',DATABASE_PATH:'/tmp/ignored.sqlite',UPLOADS_DIR:'/tmp/ignored-uploads'};
  assert.doesNotThrow(()=>validateRuntimeConfig(local));
  assert.throws(()=>validateRuntimeConfig({...local,SUPABASE_DB_URL:'sqlite:///tmp/local.db'}),/PostgreSQL/);
});

test('production requires verified HTTPS, auth-email configuration, and a same-origin payment callback',()=>{
  assert.throws(()=>validateRuntimeConfig({NODE_ENV:'production'}),/SUPABASE_DB_URL/);
  assert.doesNotThrow(()=>validateRuntimeConfig(productionEnv));
  assert.throws(()=>validateRuntimeConfig({...productionEnv,RESEND_API_KEY:''}),/RESEND_API_KEY/);
  assert.throws(()=>validateRuntimeConfig({...productionEnv,PAYMENT_CALLBACK_URL:'https://other.example.test/payment/return'}),/same HTTPS origin/);
  assert.throws(()=>validateRuntimeConfig({...productionEnv,PAYMENT_CALLBACK_URL:'https://user:pass@app.example.test/payment/return'}),/without credentials/);
  assert.throws(()=>validateRuntimeConfig({...productionEnv,APP_URL:'http://app.example.test'}),/HTTPS/);
  assert.throws(()=>validateRuntimeConfig({...productionEnv,SUPABASE_URL:'http://project.supabase.co'}),/HTTPS/);
});

test('session cookies are secure in production and SameSite=None cannot be insecure',()=>{
  assert.deepEqual(getSessionCookieOptions({NODE_ENV:'production'}),{httpOnly:true,secure:true,sameSite:'lax',path:'/'});
  assert.throws(()=>getSessionCookieOptions({NODE_ENV:'development',SESSION_COOKIE_SAME_SITE:'none'}),/must also be Secure/);
  assert.deepEqual(getSessionCookieOptions({NODE_ENV:'development',SESSION_COOKIE_SAME_SITE:'none',SESSION_COOKIE_SECURE:'true'}),{httpOnly:true,secure:true,sameSite:'none',path:'/'});
});
