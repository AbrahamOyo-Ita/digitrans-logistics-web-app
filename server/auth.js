import crypto from 'node:crypto';
import db from './db.js';
import {createSupabaseUserClient,getSupabaseAdmin} from './supabase.js';
import {getSessionCookieOptions} from './config.js';
import {buildUserIdentifierPredicate} from './phone.js';
import {APP_ROLES} from '../shared/roles.js';

export const ADMIN_ROLES=['super_admin','ops_officer','finance_officer'];
const ROLE_SET=new Set(APP_ROLES);

export function authError(error){
  const status=Number(error?.status)||0,code=String(error?.code||'');
  if(code==='invalid_credentials')return Object.assign(new Error('The sign-in details are incorrect.'),{status:401});
  if(code==='email_not_confirmed')return Object.assign(new Error('Verify your email address before signing in.'),{status:403});
  if(status===400||status===422||['weak_password','email_exists','user_already_exists'].includes(code))return Object.assign(new Error('The sign-in or account details could not be accepted.'),{status:400});
  if(status===404)return Object.assign(new Error('The account could not be found.'),{status:404});
  if(status===429)return Object.assign(new Error('Too many authentication requests. Please try again shortly.'),{status:429});
  return Object.assign(new Error('Authentication is temporarily unavailable.'),{status:503});
}
function assertPassword(password){
  const value=String(password||'');
  if(value.length<8||value.length>128||!/[A-Z]/.test(value)||!/[a-z]/.test(value)||!/[0-9]/.test(value)||!/[^A-Za-z0-9]/.test(value))throw Object.assign(new Error('Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.'),{status:400});
  return value;
}
function jwtPayload(token){
  try{return JSON.parse(Buffer.from(String(token).split('.')[1]||'','base64url').toString('utf8'));}catch{return null;}
}
function appUserFromRow(row){
  if(!row)return null;
  if(!ROLE_SET.has(row.role))throw Object.assign(new Error('Account role is unavailable.'),{status:403});
  return {id:row.id,email:row.email,phone:row.phone||null,role:row.role,status:row.status,full_name:row.full_name||'',created_at:row.created_at,...(row.address?{address:row.address}:{})};
}
async function loadAppUser(userId){
  const row=await db.prepare(`SELECT u.id,u.email,u.phone,u.role,u.status,u.created_at,p.full_name,p.address
    FROM public.users u LEFT JOIN public.profiles p ON p.user_id=u.id WHERE u.id=?`).get(userId);
  return appUserFromRow(row);
}
async function bumpSessionVersion(userId){
  const admin=getSupabaseAdmin();
  const {data,error}=await admin.auth.admin.getUserById(userId);
  if(error||!data?.user)throw authError(error||new Error('Account could not be found.'));
  const metadata={...(data.user.app_metadata||{}),session_version:crypto.randomUUID()};
  const {error:updateError}=await admin.auth.admin.updateUserById(userId,{app_metadata:metadata});
  if(updateError)throw authError(updateError);
}

export function authPublicUser(user,row){
  if(!user||!row)return null;
  return {...row,email:row.email||user.email||null,phone:row.phone||user.phone||null,full_name:row.full_name||user.user_metadata?.full_name||''};
}

export async function createSession(userId,req){
  const session=req?.authSession;
  if(session?.user?.id!==userId||!session.access_token)throw Object.assign(new Error('An authenticated Supabase session is required.'),{status:401});
  const user=await loadAppUser(userId);
  if(!user||user.status!=='active')throw Object.assign(new Error('This account is not active.'),{status:403});
  return {token:session.access_token,refreshToken:session.refresh_token,expires:session.expires_at?new Date(session.expires_at*1000).toISOString():new Date(Date.now()+Number(session.expires_in||3600)*1000).toISOString(),user};
}

export async function getSessionUser(token){
  if(!token)return null;
  const payload=jwtPayload(token);
  if(!payload?.sub||!payload?.exp||payload.exp*1000<=Date.now())return null;
  try{
    const {data,error}=await getSupabaseAdmin().auth.getUser(token);
    if(error||!data?.user||data.user.id!==payload.sub)return null;
    const tokenVersion=payload.app_metadata?.session_version||null;
    const currentVersion=data.user.app_metadata?.session_version||null;
    if(tokenVersion!==currentVersion)return null;
    const user=await loadAppUser(data.user.id);
    if(!user||user.status!=='active')return null;
    return user;
  }catch{return null;}
}

export async function revokeSession(token){
  if(!token)return;
  try{
    const {error}=await getSupabaseAdmin().auth.admin.signOut(token,'local');
    if(error&&![400,401,403].includes(Number(error.status)))throw authError(error);
  }catch(error){if(error?.status)throw error;throw authError(error);}
}

export async function revokeAllSessions(userId){await bumpSessionVersion(userId);}

export async function refreshExpiredSession(req,res,next){
  try{
    const token=req.cookies?.session,refreshToken=req.cookies?.session_refresh;
    if(!token||!refreshToken)return next();
    const payload=jwtPayload(token),expiresAt=Number(payload?.exp||0)*1000;
    if(expiresAt>Date.now()+90_000)return next();
    const cookieOptions=getSessionCookieOptions();
    const clear=()=>{res.clearCookie('session',{...cookieOptions,path:'/'});res.clearCookie('session_refresh',{...cookieOptions,path:'/api'});};
    if(!payload?.sub){clear();return next();}
    const current=await getSupabaseAdmin().auth.admin.getUserById(payload.sub);
    if(current.error||!current.data?.user){clear();return next();}
    const tokenVersion=payload.app_metadata?.session_version||null;
    const currentVersion=current.data.user.app_metadata?.session_version||null;
    if(tokenVersion!==currentVersion){clear();return next();}
    const {data,error}=await createSupabaseUserClient().auth.refreshSession({refresh_token:refreshToken});
    if(error||!data?.session){clear();return next();}
    res.cookie('session',data.session.access_token,{...cookieOptions,path:'/',expires:new Date(data.session.expires_at*1000)});
    res.cookie('session_refresh',data.session.refresh_token,{...cookieOptions,path:'/api',maxAge:30*24*60*60*1000});
    req.cookies.session=data.session.access_token;
    req.cookies.session_refresh=data.session.refresh_token;
    return next();
  }catch(error){return next(error);}
}

export async function requireAuth(req,res,next){
  try{
    const user=await getSessionUser(req.cookies?.session);
    if(!user)return res.status(401).json({error:'Unauthenticated'});
    req.user=user;next();
  }catch(error){next(error);}
}

export function requireRole(...roles){
  return (req,res,next)=>{
    if(!req.user)return res.status(401).json({error:'Unauthenticated'});
    if(!roles.includes(req.user.role))return res.status(403).json({error:'Forbidden'});
    next();
  };
}
export function requireAdmin(req,res,next){
  if(!req.user)return res.status(401).json({error:'Unauthenticated'});
  if(!ADMIN_ROLES.includes(req.user.role))return res.status(403).json({error:'Forbidden'});
  next();
}
export function requirePermission(key){
  return async (req,res,next)=>{
    try{
      if(!req.user)return res.status(401).json({error:'Unauthenticated'});
      if(req.user.role==='super_admin')return next();
      const allowed=await db.prepare('SELECT 1 FROM public.role_permissions rp JOIN public.roles r ON r.id=rp.role_id JOIN public.permissions p ON p.id=rp.permission_id WHERE r.name=? AND p.key=?').get(req.user.role,key);
      if(!allowed)return res.status(403).json({error:'You do not have permission to perform this action.'});
      next();
    }catch(error){next(error);}
  };
}

export async function audit(actor,action,recordType,recordId,prev,nextValue,reason,ip){
  await db.prepare('INSERT INTO public.audit_logs (id,actor_id,actor_role,action,record_type,record_id,prev_value,new_value,reason,ip) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(crypto.randomUUID(),actor?.id||null,actor?.role||'system',action,recordType,String(recordId),prev?JSON.stringify(prev):null,nextValue?JSON.stringify(nextValue):null,reason||null,ip||null);
}
export async function notify(userId,title,message,type='info',relatedId=null){
  if(!userId)return;
  await db.prepare('INSERT INTO public.notifications (id,user_id,title,message,type,related_id) VALUES (?,?,?,?,?,?)').run(crypto.randomUUID(),userId,title,message,type,relatedId);
}

export async function registerSupabaseUser({email,password,metadata,role,status='pending_verification',redirectTo}={}){
  const admin=getSupabaseAdmin(),address=String(email||'').trim().toLowerCase();
  const {data,error}=await admin.auth.admin.generateLink({type:'signup',email:address,password:assertPassword(password),options:{data:metadata||{},...(redirectTo?{redirectTo}:{})}});
  if(error)throw authError(error);
  const user=data.user,hashedToken=data.properties?.hashed_token;
  if(!user?.id||!hashedToken)throw Object.assign(new Error('Supabase Auth did not return a verification link.'),{status:503});
  const {error:updateError}=await admin.auth.admin.updateUserById(user.id,{app_metadata:{...(user.app_metadata||{}),role,status,session_version:crypto.randomUUID()}});
  if(updateError){await admin.auth.admin.deleteUser(user.id);throw authError(updateError);}
  return {user:await admin.auth.admin.getUserById(user.id).then(result=>{if(result.error)throw authError(result.error);return result.data.user;}),hashedToken};
}

export async function createSupabaseActiveUser({email,password,fullName,role,phone}={}){
  const {data,error}=await getSupabaseAdmin().auth.admin.createUser({
    email:String(email||'').trim().toLowerCase(),password:assertPassword(password),email_confirm:true,
    user_metadata:{full_name:String(fullName||'')},app_metadata:{role,status:'active',session_version:crypto.randomUUID()},
  });
  if(error)throw authError(error);
  return data.user;
}

export async function sendSupabaseRecovery(email){
  const {data,error}=await getSupabaseAdmin().auth.admin.generateLink({type:'recovery',email:String(email||'').trim().toLowerCase()});
  if(error)throw authError(error);
  const hashedToken=data.properties?.hashed_token;
  if(!hashedToken)throw Object.assign(new Error('Supabase Auth did not return a recovery link.'),{status:503});
  return hashedToken;
}

export async function verifySupabaseOtp({email,token,type='signup'}={}){
  if(!['signup','recovery','email_change','magiclink'].includes(type))throw Object.assign(new Error('Unsupported verification type.'),{status:400});
  const {data,error}=await createSupabaseUserClient().auth.verifyOtp({token_hash:String(token||''),type});
  if(error)throw authError(error);
  if(!data?.session||!data?.user)throw Object.assign(new Error('The verification link is invalid or expired.'),{status:400});
  const user=await loadAppUser(data.user.id);
  if(!user)throw Object.assign(new Error('Account setup could not be completed.'),{status:404});
  await db.prepare('UPDATE public.users SET email_verified=1,updated_at=now() WHERE id=?').run(user.id);
  if(user.status!=='active'){
    try{await getSupabaseAdmin().auth.admin.signOut(data.session.access_token,'local');}catch{}
    return {user,session:null,pending:true};
  }
  return {user,session:data.session};
}

export async function resolveLoginEmail(identifier,lookup=async predicate=>db.prepare(`SELECT email FROM public.users WHERE ${predicate.sql}`).get(...predicate.params)){
  let predicate;
  try{predicate=buildUserIdentifierPredicate(identifier,{emailColumn:'email',phoneColumn:'phone'});}
  catch(error){throw Object.assign(new Error(error.message),{status:400});}
  const row=await lookup(predicate);
  if(!row?.email)throw Object.assign(new Error('The sign-in details are incorrect.'),{status:401});
  return String(row.email).trim().toLowerCase();
}

export async function loginSupabaseUser(identifier,password){
  const email=await resolveLoginEmail(identifier);
  const client=createSupabaseUserClient();
  const {data,error}=await client.auth.signInWithPassword({email,password:String(password||'')});
  if(error)throw authError(error);
  const user=await loadAppUser(data.user.id);
  if(!user){await client.auth.signOut({scope:'local'});throw Object.assign(new Error('The sign-in details are incorrect.'),{status:401});}
  if(user.status!=='active'){
    await client.auth.signOut({scope:'local'});
    throw Object.assign(new Error('Your account is awaiting approval or is currently unavailable.'),{status:403});
  }
  return {user,session:data.session};
}

export async function resetSupabasePassword({email,token,password}={}){
  const safePassword=assertPassword(password);
  const client=createSupabaseUserClient();
  const {data,error}=await client.auth.verifyOtp({token_hash:String(token||''),type:'recovery'});
  if(error||!data?.user)throw Object.assign(new Error('This recovery link is invalid or has expired.'),{status:400});
  const {error:updateError}=await getSupabaseAdmin().auth.admin.updateUserById(data.user.id,{password:safePassword});
  if(updateError)throw authError(updateError);
  await bumpSessionVersion(data.user.id);
  return data.user;
}

export async function changeSupabasePassword({userId,currentPassword,newPassword}={}){
  const row=await db.prepare('SELECT email FROM public.users WHERE id=?').get(userId);
  if(!row)throw Object.assign(new Error('Account could not be found.'),{status:404});
  const client=createSupabaseUserClient();
  const {data,error}=await client.auth.signInWithPassword({email:row.email,password:String(currentPassword||'')});
  if(error||!data?.user)throw Object.assign(new Error('Current password is incorrect.'),{status:400});
  const {error:updateError}=await getSupabaseAdmin().auth.admin.updateUserById(userId,{password:assertPassword(newPassword)});
  if(updateError)throw authError(updateError);
  await bumpSessionVersion(userId);
}
