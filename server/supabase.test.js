import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupabaseAdmin,readSupabaseConfig} from './supabase.js';

test('server Supabase configuration accepts only a URL and server secret',()=>{
  const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_1234567890abcdefgh',NODE_ENV:'production'};
  assert.deepEqual(readSupabaseConfig(env),{url:'https://example.supabase.co',serviceKey:'sb_secret_1234567890abcdefgh'});
  assert.throws(()=>readSupabaseConfig({...env,SUPABASE_URL:'https://example.supabase.co/project'}),/origin only/);
  assert.throws(()=>readSupabaseConfig({...env,SUPABASE_URL:'http://example.supabase.co'}),/HTTPS/);
  assert.throws(()=>readSupabaseConfig({...env,SUPABASE_SERVICE_ROLE_KEY:'sb_publishable_public-key'}),/service-role secret/);
  assert.throws(()=>readSupabaseConfig({...env,SUPABASE_SERVICE_ROLE_KEY:''}),/required/);
});

test('local Supabase URLs are allowed only for loopback development',()=>{
  assert.equal(readSupabaseConfig({SUPABASE_URL:'http://127.0.0.1:54321',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_local1234567890',NODE_ENV:'development'}).url,'http://127.0.0.1:54321');
  assert.equal(readSupabaseConfig({SUPABASE_URL:'http://[::1]:54321',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_local1234567890',NODE_ENV:'development'}).url,'http://[::1]:54321');
  assert.throws(()=>readSupabaseConfig({SUPABASE_URL:'http://10.0.0.4:54321',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_local1234567890',NODE_ENV:'development'}),/local development/);
});

test('admin client disables browser-style session persistence and uses only server options',()=>{
  let received;
  const client={auth:{},storage:{}};
  const result=createSupabaseAdmin({SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_serveronly1234567890',NODE_ENV:'test'},(...args)=>{received=args;return client;});
  assert.equal(result,client);
  assert.equal(received[0],'https://example.supabase.co');
  assert.equal(received[1],'sb_secret_serveronly1234567890');
  assert.deepEqual(received[2].auth,{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false});
  assert.equal(received[2].global.headers['X-Client-Info'],'digitrans-api');
});
