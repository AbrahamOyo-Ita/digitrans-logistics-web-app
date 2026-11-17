import {createClient} from '@supabase/supabase-js';

const insecureLocalHosts=new Set(['localhost','127.0.0.1','::1']);

function isServiceRoleKey(value){
  if(/^sb_secret_[A-Za-z0-9_-]{10,}$/.test(value))return true;
  const segments=value.split('.');
  if(segments.length!==3)return false;
  try{return JSON.parse(Buffer.from(segments[1],'base64url').toString('utf8')).role==='service_role';}
  catch{return false;}
}

export function readSupabaseConfig(env=process.env,{production=env.NODE_ENV==='production'}={}){
  const rawUrl=String(env.SUPABASE_URL||'').trim();
  const serviceKey=String(env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
  let url;
  try{url=new URL(rawUrl);}catch{throw new Error('SUPABASE_URL must be a valid absolute URL.');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash){
    throw new Error('SUPABASE_URL must be an origin only, without credentials, path, query, or fragment.');
  }
  if(production&&url.protocol!=='https:')throw new Error('SUPABASE_URL must use HTTPS in production.');
  const hostname=url.hostname.replace(/^\[|\]$/g,'').toLowerCase();
  if(!production&&url.protocol==='http:'&&!insecureLocalHosts.has(hostname))throw new Error('HTTP Supabase URLs are allowed only for a local development instance.');
  if(!serviceKey)throw new Error('SUPABASE_SERVICE_ROLE_KEY is required by the server.');
  if(!isServiceRoleKey(serviceKey))throw new Error('SUPABASE_SERVICE_ROLE_KEY must be a Supabase service-role secret or legacy service_role JWT.');
  return {url:url.origin,serviceKey};
}

export function createSupabaseAdmin(env=process.env,clientFactory=createClient){
  const {url,serviceKey}=readSupabaseConfig(env);
  return clientFactory(url,serviceKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{headers:{'X-Client-Info':'digitrans-api'}},
  });
}

// A fresh client per password/OTP exchange prevents concurrent requests from sharing
// a mutable GoTrue session in the process-wide service-role client.
export function createSupabaseUserClient(env=process.env,clientFactory=createClient){
  return createSupabaseAdmin(env,clientFactory);
}

let adminClient;
export function getSupabaseAdmin(){
  if(!adminClient)adminClient=createSupabaseAdmin();
  return adminClient;
}

export function resetSupabaseAdminForTests(){adminClient=undefined;}
