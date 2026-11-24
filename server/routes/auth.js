import crypto from 'node:crypto';
import {asyncRouter} from '../async-router.js';
import {z} from 'zod';
import db from '../db.js';
import {createSession,loginSupabaseUser,registerSupabaseUser,sendSupabaseRecovery,verifySupabaseOtp,resendSupabaseSignup,resetSupabasePassword,changeSupabasePassword,getSessionUser,revokeSession,acceptAdminInvitation} from '../auth.js';
import {isEmailConfigured,sendEmail} from '../email.js';
import {createAuthEmailTemplate} from '../email-templates.js';
import {buildUserIdentifierPredicate,normalizePhoneNumber} from '../phone.js';
import {getSessionCookieOptions} from '../config.js';
import {logger} from '../logger.js';
import {getSupabaseAdmin,readSupabaseConfig} from '../supabase.js';
import {PUBLIC_SIGNUP_ROLES} from '../../shared/roles.js';

const router=asyncRouter();
const sessionCookieOptions=getSessionCookieOptions();
const registerSchema=z.object({
  fullName:z.string().trim().min(2).max(100),
  email:z.string().trim().email().max(180),
  phone:z.string().trim().min(8).max(24).regex(/^\+?[\d\s().-]+$/,'Enter a valid phone number').refine(value=>Boolean(normalizePhoneNumber(value)),'Enter a valid phone number'),
  password:z.string().min(8).max(128).regex(/[A-Z]/,'Password must include an uppercase letter').regex(/[a-z]/,'Password must include a lowercase letter').regex(/[0-9]/,'Password must include a number').regex(/[^A-Za-z0-9]/,'Password must include a special character'),
  confirmPassword:z.string(),
  role:z.enum(PUBLIC_SIGNUP_ROLES).default('customer'),
  acceptedTerms:z.literal(true),
  businessName:z.string().trim().min(2).max(120).optional(),
  category:z.string().trim().max(80).optional(),
  institution:z.string().trim().max(120).optional(),
  matricNo:z.string().trim().max(50).optional(),
  address:z.string().trim().max(300).optional(),
}).refine(d=>d.password===d.confirmPassword,{path:['confirmPassword'],message:'Passwords do not match'})
  .refine(d=>d.role!=='vendor'||!!d.businessName,{path:['businessName'],message:'Business name is required'});
const adminInviteSchema=z.object({
  invitationId:z.string().uuid(),email:z.string().trim().email().max(180),token:z.string().trim().min(16).max(512),
  password:z.string().min(12).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),confirmPassword:z.string(),
}).refine(d=>d.password===d.confirmPassword,{path:['confirmPassword'],message:'Passwords do not match'});

function setSession(res,session){
  const cookie={...sessionCookieOptions};
  res.cookie('session',session.token,{...cookie,path:'/',expires:new Date(session.expires)});
  if(session.refreshToken)res.cookie('session_refresh',session.refreshToken,{...cookie,path:'/api',maxAge:30*24*60*60*1000});
}
function clearSession(res){
  res.clearCookie('session',{...sessionCookieOptions,path:'/'});
  res.clearCookie('session_refresh',{...sessionCookieOptions,path:'/api'});
}
function publicProfileSql(){
  return `SELECT u.id,u.email,u.phone,u.role,u.status,u.created_at,p.full_name,p.address,p.dob,p.profile_photo,
    r.vehicle_type,r.vehicle_reg,r.vehicle_desc,r.availability,r.approval_status,r.rejection_reason,
    v.business_name,v.category,v.contact_person,v.business_address,v.service_location,v.description,v.operating_hours,v.approval_status vendor_approval_status,v.rejection_reason vendor_rejection_reason,
    i.address investor_address,i.id_type,i.verification_status,
    sp.institution,sp.verification_status student_verification_status,sp.expires_at
    FROM public.users u LEFT JOIN public.profiles p ON p.user_id=u.id
    LEFT JOIN public.riders r ON r.user_id=u.id LEFT JOIN public.vendors v ON v.user_id=u.id
    LEFT JOIN public.investors i ON i.user_id=u.id LEFT JOIN public.student_profiles sp ON sp.user_id=u.id WHERE u.id=?`;
}
async function publicProfile(userId){
  const user=await db.prepare(publicProfileSql()).get(userId);
  if(!user)return null;
  if(user.role==='vendor'){user.approval_status=user.vendor_approval_status;user.rejection_reason=user.vendor_rejection_reason;}
  if(user.role==='investor'){user.address=user.investor_address;}
  if(user.role==='student')user.verification_status=user.student_verification_status;
  const roleInfo=await db.prepare('SELECT description FROM public.roles WHERE id=?').get(user.role);
  user.role_label=roleInfo?.description||user.role;
  user.permissions=(await db.prepare(`SELECT p.key FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id WHERE rp.role_id=? ORDER BY p.key`).all(user.role)).map(row=>row.key);
  delete user.investor_address;delete user.vendor_approval_status;delete user.vendor_rejection_reason;delete user.student_verification_status;
  return user;
}
function appOrigin(req){
  const configured=String(process.env.APP_URL||'').trim();
  if(configured)return new URL(configured);
  return new URL(`${req.protocol}://${req.get('host')}`);
}
function verificationUrl(req,{token,email,type}){
  const url=new URL(type==='recovery'?'/reset-password':'/auth/verify',appOrigin(req));
  url.searchParams.set('token',token);url.searchParams.set('email',email);
  if(type&&type!=='recovery')url.searchParams.set('type',type);
  return url;
}

const GOOGLE_STATE_COOKIE='google_oauth_state';
const GOOGLE_VERIFIER_COOKIE='google_oauth_verifier';
const GOOGLE_OAUTH_MAX_AGE=10*60;

function safeAuthNext(value){
  const candidate=String(value||'/workspace');
  try{
    const url=new URL(candidate,'http://localhost');
    return url.origin==='http://localhost'&&url.pathname.startsWith('/')&&!url.pathname.startsWith('//')
      ? `${url.pathname}${url.search}${url.hash}`:'/workspace';
  }catch{return '/workspace';}
}

function oauthCookieOptions(path){
  return {...sessionCookieOptions,path,maxAge:GOOGLE_OAUTH_MAX_AGE,sameSite:'lax'};
}

function encodeOAuthState(value){return Buffer.from(JSON.stringify(value)).toString('base64url');}
function signOAuthState(value){
  return crypto.createHmac('sha256',String(process.env.SUPABASE_SERVICE_ROLE_KEY||'')).update(value).digest('base64url');
}
function createOAuthState(payload){
  const encoded=encodeOAuthState(payload);
  return `${encoded}.${signOAuthState(encoded)}`;
}
function readOAuthState(value){
  const [encoded,signature]=String(value||'').split('.');
  if(!encoded||!signature)return null;
  const expected=signOAuthState(encoded);
  const left=Buffer.from(signature),right=Buffer.from(expected);
  if(left.length!==right.length||!crypto.timingSafeEqual(left,right))return null;
  try{return JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));}catch{return null;}
}
function createPkceVerifier(){return crypto.randomBytes(32).toString('base64url');}
function createPkceChallenge(verifier){return crypto.createHash('sha256').update(verifier).digest('base64url');}
function clearGoogleCookies(res){
  res.clearCookie(GOOGLE_STATE_COOKIE,oauthCookieOptions('/api/auth/google'));
  res.clearCookie(GOOGLE_VERIFIER_COOKIE,oauthCookieOptions('/api/auth/google'));
}
function googleFailure(req,res,code,next='/workspace'){
  clearGoogleCookies(res);
  const url=new URL('/login',appOrigin(req));
  url.searchParams.set('next',safeAuthNext(next));
  url.searchParams.set('oauth_error',code);
  return res.redirect(302,url.href);
}
async function exchangeGoogleCode(code,verifier){
  const {url,serviceKey}=readSupabaseConfig();
  const response=await fetch(`${url}/auth/v1/token?grant_type=pkce`,{
    method:'POST',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({auth_code:code,code_verifier:verifier}),
  });
  let payload={};try{payload=await response.json();}catch{}
  if(!response.ok||!payload.access_token||!payload.user)throw Object.assign(new Error('Google sign-in could not be completed.'),{status:502});
  return payload;
}
async function provisionGoogleUser(authUser,requestedRole){
  const id=String(authUser?.id||'').trim(),email=String(authUser?.email||'').trim().toLowerCase();
  if(!id||!email)throw Object.assign(new Error('Google did not return a usable account.'),{status:502});
  const existing=await db.prepare('SELECT id,role,status FROM public.users WHERE id=? OR lower(email)=?').get(id,email);
  if(existing){
    if(existing.id!==id)throw Object.assign(new Error('An account already exists for this Google email. Sign in with your existing account.'),{status:409});
    return existing;
  }
  const role=PUBLIC_SIGNUP_ROLES.includes(requestedRole)?requestedRole:'customer';
  // Google has already verified the email identity. Riders still need the
  // compliance checklist, but that should not block workspace access.
  const status=['customer','student','rider'].includes(role)?'active':'pending_verification';
  const fullName=String(authUser.user_metadata?.full_name||authUser.user_metadata?.name||email.split('@')[0]).trim().slice(0,100)||'Google user';
  await db.transaction(async()=>{
    await db.prepare('INSERT INTO public.users (id,email,phone,role,status,email_verified) VALUES (?,?,?,?,?,1)').run(id,email,null,role,status);
    await db.prepare('INSERT INTO public.profiles (user_id,full_name,address) VALUES (?,?,?)').run(id,fullName,null);
    if(role==='student')await db.prepare('INSERT INTO public.student_profiles (user_id) VALUES (?)').run(id);
    if(role==='rider')await db.prepare('INSERT INTO public.riders (user_id) VALUES (?)').run(id);
    if(role==='vendor')await db.prepare('INSERT INTO public.vendors (user_id,business_name,contact_person) VALUES (?,?,?)').run(id,`${fullName}'s business`,fullName);
    if(role==='investor')await db.prepare('INSERT INTO public.investors (user_id) VALUES (?)').run(id);
  });
  return {id,role,status};
}
async function saveAccount({authUser,d,phone,email,status}){
  const create=db.transaction(async()=>{
    await db.prepare('INSERT INTO public.users (id,email,phone,role,status) VALUES (?,?,?,?,?)').run(authUser.id,email,phone,d.role,status);
    await db.prepare('INSERT INTO public.profiles (user_id,full_name,address) VALUES (?,?,?)').run(authUser.id,d.fullName,d.address||null);
    if(d.role==='student')await db.prepare('INSERT INTO public.student_profiles (user_id,institution,matric_no) VALUES (?,?,?)').run(authUser.id,d.institution||null,d.matricNo||null);
    if(d.role==='rider')await db.prepare('INSERT INTO public.riders (user_id) VALUES (?)').run(authUser.id);
    if(d.role==='vendor')await db.prepare('INSERT INTO public.vendors (user_id,business_name,category,contact_person,business_address) VALUES (?,?,?,?,?)').run(authUser.id,d.businessName,d.category||null,d.fullName,d.address||null);
    if(d.role==='investor')await db.prepare('INSERT INTO public.investors (user_id,address) VALUES (?,?)').run(authUser.id,d.address||null);
  });
  await create();
}
async function discardNewAccount(userId){
  try{await db.prepare('DELETE FROM public.users WHERE id=?').run(userId);}catch{}
  try{await getSupabaseAdmin().auth.admin.deleteUser(userId);}catch{}
}

function isGoogleOAuthEnabled(){
  return String(process.env.GOOGLE_OAUTH_ENABLED||'').trim().toLowerCase()==='true';
}

router.get('/providers',(_req,res)=>{
  res.json({google:isGoogleOAuthEnabled()});
});

router.get('/google',async(req,res)=>{
  if(!isGoogleOAuthEnabled())return googleFailure(req,res,'google_disabled',req.query?.next);
  const verifier=createPkceVerifier();
  const state=createOAuthState({
    nonce:crypto.randomBytes(24).toString('base64url'),
    role:String(req.query?.role||'customer'),
    next:safeAuthNext(req.query?.next),
  });
  const {url}=readSupabaseConfig();
  const callback=new URL('/api/auth/google/callback',appOrigin(req)).href;
  const authorize=new URL('/auth/v1/authorize',url);
  authorize.searchParams.set('provider','google');
  authorize.searchParams.set('redirect_to',callback);
  authorize.searchParams.set('state',state.split('.')[0]);
  authorize.searchParams.set('code_challenge',createPkceChallenge(verifier));
  authorize.searchParams.set('code_challenge_method','s256');
  res.cookie(GOOGLE_STATE_COOKIE,state,oauthCookieOptions('/api/auth/google'));
  res.cookie(GOOGLE_VERIFIER_COOKIE,verifier,oauthCookieOptions('/api/auth/google'));
  res.redirect(302,authorize.href);
});

router.get('/google/callback',async(req,res)=>{
  if(!isGoogleOAuthEnabled())return googleFailure(req,res,'google_disabled',req.query?.next);
  const signedState=readOAuthState(req.cookies?.[GOOGLE_STATE_COOKIE]);
  const returnedState=String(req.query?.state||'');
  const next=signedState?.next||'/workspace';
  if(!signedState||!returnedState||returnedState!==encodeOAuthState({nonce:signedState.nonce,role:signedState.role,next:signedState.next})){
    return googleFailure(req,res,'google_state_invalid',next);
  }
  if(req.query?.error)return googleFailure(req,res,'google_cancelled',next);
  const code=String(req.query?.code||''),verifier=String(req.cookies?.[GOOGLE_VERIFIER_COOKIE]||'');
  if(!code||!verifier)return googleFailure(req,res,'google_code_missing',next);
  try{
    const oauth=await exchangeGoogleCode(code,verifier);
    await provisionGoogleUser(oauth.user,signedState.role);
    req.authSession={
      user:oauth.user,
      access_token:oauth.access_token,
      refresh_token:oauth.refresh_token,
      expires_in:oauth.expires_in,
      expires_at:oauth.expires_at,
    };
    const session=await createSession(oauth.user.id,req);
    setSession(res,session);
    clearGoogleCookies(res);
    return res.redirect(302,new URL(safeAuthNext(next),appOrigin(req)).href);
  }catch(error){
    logger.error('auth.google_oauth_failed',{requestId:req.requestId,error});
    return googleFailure(req,res,error?.status===409?'google_account_conflict':'google_failed',next);
  }
});

router.post('/register',async(req,res)=>{
  const parsed=registerSchema.safeParse(req.body);
  if(!parsed.success){
    const details=parsed.error.flatten().fieldErrors;
    const summary=Object.entries(details).flatMap(([field,messages])=>(messages||[]).map(message=>`${field}: ${message}`)).join(' ');
    return res.status(400).json({error:summary||'Please review the highlighted fields.',details});
  }
  const d=parsed.data,email=d.email.toLowerCase(),phone=normalizePhoneNumber(d.phone);
  if(process.env.NODE_ENV==='production'&&!isEmailConfigured())return res.status(503).json({error:'Account verification email is not configured yet. Please contact DigiTrans support.'});
  const phonePredicate=buildUserIdentifierPredicate(phone,{emailColumn:'email',phoneColumn:'phone'});
  const emailConflict=await db.prepare(`SELECT u.id,u.email,u.email_verified,p.full_name
    FROM public.users u LEFT JOIN public.profiles p ON p.user_id=u.id WHERE lower(u.email)=?`).get(email);
  const phoneConflict=await db.prepare(`SELECT id FROM public.users WHERE ${phonePredicate.sql}`).get(...phonePredicate.params);
  if(emailConflict||phoneConflict){
    if(emailConflict&&!Number(emailConflict.email_verified)){
      try{
        const generated=await resendSupabaseSignup(email);
        const url=verificationUrl(req,{token:generated.hashedToken,email,type:'magiclink'});
        await sendEmail({to:email,...createAuthEmailTemplate({kind:'verify',name:emailConflict.full_name||d.fullName,actionUrl:url.href})});
      }catch(error){
        logger.error('auth.registration_verification_resend_failed',{requestId:req.requestId,error});
        return res.status(error?.status||503).json({error:'This account is awaiting email verification, but a fresh verification email could not be sent. Please try again shortly.'});
      }
      return res.status(200).json({message:'This account is awaiting email verification. We sent a fresh verification link to your email.'});
    }
    const conflict=emailConflict&&phoneConflict?'email address and phone number':emailConflict?'email address':'phone number';
    return res.status(409).json({error:`An account with this ${conflict} already exists. Sign in or use account recovery.`});
  }
  const status=['customer','student'].includes(d.role)?'active':'pending_verification';
  let created;
  try{
    created=await registerSupabaseUser({email,password:d.password,metadata:{full_name:d.fullName},role:d.role,status});
    await saveAccount({authUser:created.user,d,phone,email,status});
  }catch(error){
    if(created?.user?.id)await discardNewAccount(created.user.id);
    if(error?.status===409||error?.code==='23505')return res.status(409).json({error:'An account with this email or phone already exists.'});
    if(error?.status)return res.status(error.status).json({error:error.message});
    throw error;
  }
  const verifyUrl=verificationUrl(req,{token:created.hashedToken,email,type:'signup'});
  let delivered=false;
  if(isEmailConfigured()){
    try{
      await sendEmail({to:email,...createAuthEmailTemplate({kind:'verify',name:d.fullName,actionUrl:verifyUrl.href})});
      delivered=true;
    }catch(error){
      logger.error('auth.verification_email_failed',{requestId:req.requestId,error});
      if(process.env.NODE_ENV==='production'){await discardNewAccount(created.user.id);return res.status(503).json({error:'Verification email could not be delivered. Please try again shortly.'});}
    }
  }
  const message=d.role==='rider'
    ? (delivered?'Check your email to verify your account. After verification, sign in to complete your rider application.':'Account created. Verify your email, then sign in to complete your rider application.')
    : (delivered?'Check your email for a verification link. Your account will be ready after verification.':'Account created. Use the local verification link to confirm your email.');
  res.status(201).json({message,...(status!=='active'?{applicationStatus:'pending_verification'}:{}),...(!delivered&&process.env.NODE_ENV!=='production'?{debugVerificationUrl:verifyUrl.href}:{})});
});

router.post('/verify-email',async(req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase(),token=String(req.body?.token||'').trim();
  if(!email||!token)return res.status(400).json({error:'A verification email and token are required.'});
  const requestedType=String(req.body?.type||'signup');
  const type=['signup','magiclink'].includes(requestedType)?requestedType:'signup';
  const result=await verifySupabaseOtp({email,token,type});
  if(result.pending){clearSession(res);return res.json({verified:true,pendingApproval:true,user:result.user,message:'Your email is verified. Your application is waiting for operations review.'});}
  req.authSession=result.session;
  const session=await createSession(result.user.id,req);setSession(res,session);
  res.json({verified:true,user:result.user,message:'Your email is verified. Welcome to DigiTrans.'});
});

router.post('/accept-admin-invite',async(req,res)=>{
  const parsed=adminInviteSchema.safeParse(req.body||{});
  if(!parsed.success)return res.status(400).json({error:'Use a valid invitation link and a 12-character password with uppercase, lowercase, a number and a symbol.'});
  try{
    const result=await acceptAdminInvitation({...parsed.data,ip:req.ip,requestId:req.requestId,userAgent:String(req.get('user-agent')||'').slice(0,300)});
    res.json({message:'Your password is set. Sign in to open your DigiTrans administrator workspace.',role:result.role});
  }catch(error){
    logger.warn('auth.admin_invitation_accept_failed',{requestId:req.requestId,status:error?.status||500});
    res.status(error?.status||400).json({error:error?.status?error.message:'This invitation could not be completed. Ask a DigiTrans Super Administrator to send a fresh invite.'});
  }
});

router.post('/resend-verification',async(req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase();
  const generic={message:'If that account is waiting for email verification, a fresh verification link has been requested.'};
  if(!email||!z.string().email().safeParse(email).success)return res.json(generic);
  const row=await db.prepare('SELECT u.id,u.email,u.email_verified,p.full_name FROM public.users u LEFT JOIN public.profiles p ON p.user_id=u.id WHERE lower(u.email)=?').get(email);
  if(!row||row.email_verified)return res.json(generic);
  try{
    const generated=await resendSupabaseSignup(email);
    const url=verificationUrl(req,{token:generated.hashedToken,email,type:'magiclink'});
    await sendEmail({to:email,...createAuthEmailTemplate({kind:'verify',name:row.full_name,actionUrl:url.href})});
  }catch(error){
    logger.error('auth.verification_resend_failed',{requestId:req.requestId,error});
    return res.status(error?.status||503).json({error:'We could not send a new verification email right now. Please try again shortly.'});
  }
  res.json(generic);
});

router.post('/login',async(req,res)=>{
  const identifier=String(req.body?.identifier||req.body?.email||'').trim(),password=String(req.body?.password||'');
  if(!identifier||!password)return res.status(400).json({error:'Enter your email or phone number and password.'});
  const result=await loginSupabaseUser(identifier,password);
  req.authSession=result.session;
  const session=await createSession(result.user.id,req);setSession(res,session);
  res.json({user:await publicProfile(result.user.id),sessionExpiresAt:session.expires});
});

async function currentUser(req){return await getSessionUser(req.cookies?.session);}
router.get('/me',async(req,res)=>{
  const user=await currentUser(req);
  if(!user)return res.json({user:null});
  res.json({user:await publicProfile(user.id)});
});
router.post('/logout',async(req,res)=>{
  const token=req.cookies?.session;
  clearSession(res);
  await revokeSession(token);
  res.json({ok:true});
});

router.post('/forgot-password',async(req,res)=>{
  const identifier=String(req.body?.identifier||'').trim(),generic={message:'If an account matches those details, recovery instructions will be sent.'};
  if(!identifier)return res.json(generic);
  let identifierPredicate;
  try{identifierPredicate=buildUserIdentifierPredicate(identifier,{emailColumn:'u.email',phoneColumn:'u.phone'});}catch{return res.json(generic);}
  const row=await db.prepare(`SELECT u.email,p.full_name FROM public.users u LEFT JOIN public.profiles p ON p.user_id=u.id WHERE ${identifierPredicate.sql}`).get(...identifierPredicate.params);
  if(!row?.email)return res.json(generic);
  if(process.env.NODE_ENV==='production'&&!isEmailConfigured())return res.json(generic);
  try{
    const token=await sendSupabaseRecovery(row.email),url=verificationUrl(req,{token,email:row.email,type:'recovery'});
    if(!isEmailConfigured())return res.json({...generic,...(process.env.NODE_ENV!=='production'?{debugVerificationUrl:url.href}:{})});
    await sendEmail({to:row.email,...createAuthEmailTemplate({kind:'recovery',name:row.full_name,actionUrl:url.href})});
  }catch(error){logger.error('auth.password_recovery_failed',{requestId:req.requestId,error});}
  res.json(generic);
});

router.post('/reset-password',async(req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase(),token=String(req.body?.token||''),password=String(req.body?.password||''),confirm=String(req.body?.confirmPassword||'');
  if(password.length<8||password.length>128||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password)||!/[^A-Za-z0-9]/.test(password))return res.status(400).json({error:'Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.'});
  if(password!==confirm)return res.status(400).json({error:'Passwords do not match.'});
  try{await resetSupabasePassword({email,token,password});}
  catch(error){return res.status(error?.status||400).json({error:error?.status?error.message:'This recovery link is invalid or has expired.'});}
  clearSession(res);res.json({message:'Password updated. Sign in with your new password.'});
});

router.get('/profile',async(req,res)=>{
  const user=await currentUser(req);if(!user)return res.status(401).json({error:'Unauthenticated'});
  res.json({user:await publicProfile(user.id)});
});
router.patch('/profile',async(req,res)=>{
  const user=await currentUser(req);if(!user)return res.status(401).json({error:'Unauthenticated'});
  const fullName=String(req.body?.fullName||'').trim(),address=String(req.body?.address||'').trim();
  if(fullName.length<2||fullName.length>100)return res.status(400).json({error:'Enter a valid full name.'});
  await db.prepare('UPDATE public.profiles SET full_name=?,address=?,updated_at=now() WHERE user_id=?').run(fullName,address||null,user.id);
  res.json({user:await publicProfile(user.id),message:'Profile updated.'});
});
router.post('/change-password',async(req,res)=>{
  const user=await currentUser(req);if(!user)return res.status(401).json({error:'Unauthenticated'});
  const current=String(req.body?.currentPassword||''),next=String(req.body?.newPassword||'');
  if(next.length<8||next.length>128||!/[A-Z]/.test(next)||!/[a-z]/.test(next)||!/[0-9]/.test(next)||!/[^A-Za-z0-9]/.test(next))return res.status(400).json({error:'Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.'});
  await changeSupabasePassword({userId:user.id,currentPassword:current,newPassword:next});
  clearSession(res);res.json({message:'Password updated. Sign in again on your devices.'});
});

export default router;
