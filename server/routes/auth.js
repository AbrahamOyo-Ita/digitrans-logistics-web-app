import {asyncRouter} from '../async-router.js';
import {z} from 'zod';
import db from '../db.js';
import {createSession,loginSupabaseUser,registerSupabaseUser,sendSupabaseRecovery,verifySupabaseOtp,resendSupabaseSignup,resetSupabasePassword,changeSupabasePassword,getSessionUser,revokeSession} from '../auth.js';
import {isEmailConfigured,sendEmail} from '../email.js';
import {createAuthEmailTemplate} from '../email-templates.js';
import {buildUserIdentifierPredicate,normalizePhoneNumber} from '../phone.js';
import {getSessionCookieOptions} from '../config.js';
import {logger} from '../logger.js';
import {getSupabaseAdmin} from '../supabase.js';
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
  url.searchParams.set('token',token);url.searchParams.set('email',email);return url;
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
  if(await db.prepare(`SELECT id FROM public.users WHERE lower(email)=? OR ${phonePredicate.sql}`).get(email,...phonePredicate.params))return res.status(409).json({error:'An account with this email or phone already exists.'});
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
  const message=delivered?'Check your email for a verification link. Your account will be ready after verification.':'Account created. Use the local verification link to confirm your email.';
  res.status(201).json({message,...(status!=='active'?{applicationStatus:'pending_verification'}:{}),...(!delivered&&process.env.NODE_ENV!=='production'?{debugVerificationUrl:verifyUrl.href}:{})});
});

router.post('/verify-email',async(req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase(),token=String(req.body?.token||'').trim();
  if(!email||!token)return res.status(400).json({error:'A verification email and token are required.'});
  const result=await verifySupabaseOtp({email,token,type:'signup'});
  if(result.pending){clearSession(res);return res.json({verified:true,pendingApproval:true,user:result.user,message:'Your email is verified. Your application is waiting for operations review.'});}
  req.authSession=result.session;
  const session=await createSession(result.user.id,req);setSession(res,session);
  res.json({verified:true,user:result.user,message:'Your email is verified. Welcome to DigiTrans.'});
});

router.post('/resend-verification',async(req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase();
  const generic={message:'If that account is waiting for email verification, a fresh verification link has been requested.'};
  if(!email||!z.string().email().safeParse(email).success)return res.json(generic);
  const row=await db.prepare('SELECT id,email_verified FROM public.users WHERE lower(email)=?').get(email);
  if(!row||row.email_verified)return res.json(generic);
  await resendSupabaseSignup(email);
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
  if(password.length<8||password.length>128||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))return res.status(400).json({error:'Use at least 8 characters with letters and numbers.'});
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
  if(next.length<8||next.length>128||!/[A-Za-z]/.test(next)||!/[0-9]/.test(next))return res.status(400).json({error:'Use at least 8 characters with letters and numbers.'});
  await changeSupabasePassword({userId:user.id,currentPassword:current,newPassword:next});
  clearSession(res);res.json({message:'Password updated. Sign in again on your devices.'});
});

export default router;
