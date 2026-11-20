import {readPostgresConfig} from './postgres.js';
import {readSupabaseConfig} from './supabase.js';

const URL_PROTOCOLS=new Set(['http:','https:']);

export function normalizeOrigin(value,{production=process.env.NODE_ENV==='production',label='origin'}={}){
  let url;
  try{url=new URL(String(value||'').trim());}catch{throw new Error(`${label} must be a valid absolute URL.`);}
  if(!URL_PROTOCOLS.has(url.protocol)||url.origin==='null'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error(`${label} must be an origin only, without credentials, a path, query, or fragment.`);
  if(production&&url.protocol!=='https:')throw new Error(`${label} must use HTTPS in production.`);
  return url.origin;
}

export function getAllowedOrigins(env=process.env){
  const production=env.NODE_ENV==='production';
  const configured=[env.APP_URL,...String(env.CLIENT_ORIGINS||'').split(',')].map(value=>String(value||'').trim()).filter(Boolean);
  const origins=new Set(configured.map((value,index)=>normalizeOrigin(value,{production,label:index===0&&env.APP_URL?'APP_URL':'CLIENT_ORIGINS entry'})));
  if(!production){origins.add('http://localhost:5173');origins.add('http://127.0.0.1:5173');}
  return origins;
}

export function validateRuntimeConfig(env=process.env){
  const production=env.NODE_ENV==='production';
  // Configuration is mandatory in every mode. There is deliberately no local-file fallback.
  readPostgresConfig(env);
  readSupabaseConfig(env,{production});
  if(env.APP_URL)normalizeOrigin(env.APP_URL,{production,label:'APP_URL'});
  if(production){
    if(!env.APP_URL)throw new Error('APP_URL must be the public HTTPS origin in production.');
    if(!String(env.RESEND_API_KEY||'').trim()||!String(env.RESEND_FROM_EMAIL||'').trim())throw new Error('RESEND_API_KEY and RESEND_FROM_EMAIL are required to deliver Auth verification and recovery links.');
    const apiOrigin=String(env.CLIENT_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean);
    for(const origin of apiOrigin)normalizeOrigin(origin,{production:true,label:'CLIENT_ORIGINS entry'});
  }
  if(env.PAYMENT_CALLBACK_URL){
    let callbackUrl;
    try{callbackUrl=new URL(String(env.PAYMENT_CALLBACK_URL).trim());}catch{throw new Error('PAYMENT_CALLBACK_URL must be a valid absolute HTTPS URL.');}
    if(callbackUrl.protocol!=='https:'||callbackUrl.username||callbackUrl.password||callbackUrl.hash)throw new Error('PAYMENT_CALLBACK_URL must be a secure URL without credentials or a fragment.');
    if(env.APP_URL&&callbackUrl.origin!==normalizeOrigin(env.APP_URL,{production,label:'APP_URL'}))throw new Error('PAYMENT_CALLBACK_URL must use the same HTTPS origin as APP_URL.');
  }
  getSessionCookieOptions(env);
}

export function getSessionCookieOptions(env=process.env){
  const sameSite=String(env.SESSION_COOKIE_SAME_SITE||'lax').trim().toLowerCase();
  if(!['lax','strict','none'].includes(sameSite))throw new Error('SESSION_COOKIE_SAME_SITE must be lax, strict, or none.');
  const secure=env.NODE_ENV==='production'||String(env.SESSION_COOKIE_SECURE||'').toLowerCase()==='true';
  if(sameSite==='none'&&!secure)throw new Error('SameSite=None cookies must also be Secure.');
  return {httpOnly:true,secure,sameSite,path:'/'};
}
