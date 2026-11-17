import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import db from '../db.js';
import { hashPassword, verifyPassword, createSession, revokeSession, revokeAllSessions, getSessionUser, notify } from '../auth.js';
import { isEmailConfigured, sendEmail } from '../email.js';
import { getSessionCookieOptions } from '../config.js';

const router = Router();
const sessionCookieOptions=getSessionCookieOptions();
const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().min(8).max(24),
  password: z.string().min(8).max(128).regex(/[A-Za-z]/,'Password must include a letter').regex(/[0-9]/,'Password must include a number'),
  confirmPassword: z.string(),
  role: z.enum(['customer','student','rider','vendor','investor']).default('customer'),
  acceptedTerms: z.literal(true),
  businessName: z.string().trim().min(2).max(120).optional(),
  category: z.string().trim().max(80).optional(),
  institution: z.string().trim().max(120).optional(),
  matricNo: z.string().trim().max(50).optional(),
  address: z.string().trim().max(300).optional(),
}).refine(d => d.password === d.confirmPassword, { path:['confirmPassword'], message:'Passwords do not match' })
  .refine(d => d.role !== 'vendor' || !!d.businessName, { path:['businessName'], message:'Business name is required' });

function setSession(res, token, expires) {
  res.cookie('session',token,{...sessionCookieOptions,expires:new Date(expires)});
}
function sessionPayload(userId, req, res) {
  const s = createSession(userId, req); setSession(res, s.token, s.expires); return s;
}
function publicProfile(userId) {
  const user = db.prepare('SELECT id,email,phone,role,status,created_at FROM users WHERE id=?').get(userId);
  if (!user) return null;
  const profile = db.prepare('SELECT full_name,address,dob,profile_photo FROM profiles WHERE user_id=?').get(userId) || {};
  const roleData = user.role === 'rider' ? db.prepare('SELECT vehicle_type,vehicle_reg,vehicle_desc,availability,approval_status,rejection_reason FROM riders WHERE user_id=?').get(userId)
    : user.role === 'vendor' ? db.prepare('SELECT business_name,category,contact_person,business_address,service_location,description,operating_hours,approval_status,rejection_reason FROM vendors WHERE user_id=?').get(userId)
    : user.role === 'investor' ? db.prepare('SELECT address,id_type,verification_status FROM investors WHERE user_id=?').get(userId)
    : user.role === 'student' ? db.prepare('SELECT institution,verification_status,expires_at FROM student_profiles WHERE user_id=?').get(userId)
    : null;
  return { ...user, ...profile, ...(roleData || {}) };
}

router.post('/register', (req,res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error:'Please review the highlighted fields.', details:parsed.error.flatten().fieldErrors });
  const d = parsed.data;
  const email = d.email.toLowerCase();
  if (db.prepare('SELECT id FROM users WHERE email=? OR phone=?').get(email,d.phone)) return res.status(409).json({ error:'An account with this email or phone already exists.' });
  const id = crypto.randomUUID();
  const status = ['customer','student'].includes(d.role) ? 'active' : 'pending_verification';
  const create = db.transaction(() => {
    db.prepare('INSERT INTO users (id,email,phone,password_hash,role,status) VALUES (?,?,?,?,?,?)').run(id,email,d.phone,hashPassword(d.password),d.role,status);
    db.prepare('INSERT INTO profiles (user_id,full_name,address) VALUES (?,?,?)').run(id,d.fullName,d.address || null);
    if (d.role === 'student') db.prepare('INSERT INTO student_profiles (user_id,institution,matric_no) VALUES (?,?,?)').run(id,d.institution || null,d.matricNo || null);
    if (d.role === 'rider') db.prepare('INSERT INTO riders (user_id) VALUES (?)').run(id);
    if (d.role === 'vendor') db.prepare('INSERT INTO vendors (user_id,business_name,category,contact_person,business_address) VALUES (?,?,?,?,?)').run(id,d.businessName,d.category || null,d.fullName,d.address || null);
    if (d.role === 'investor') db.prepare('INSERT INTO investors (user_id,address) VALUES (?,?)').run(id,d.address || null);
  });
  try { create(); } catch (e) { console.error(e); return res.status(400).json({ error:'Unable to create the account. Verify your details and try again.' }); }
  sessionPayload(id,req,res);
  res.status(201).json({ user:publicProfile(id), message: status === 'active' ? 'Your account is ready.' : 'Your application has been submitted for verification.' });
});

router.post('/login', (req,res) => {
  const identifier = String(req.body?.identifier || req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!identifier || !password) return res.status(400).json({ error:'Enter your email or phone and password.' });
  const user = db.prepare('SELECT * FROM users WHERE lower(email)=? OR phone=?').get(identifier,identifier);
  if (!user || !verifyPassword(password,user.password_hash)) return res.status(401).json({ error:'The sign-in details are incorrect.' });
  if (['suspended','deactivated','archived','rejected'].includes(user.status)) return res.status(403).json({ error:`This account is ${user.status.replaceAll('_',' ')}. Contact DigiTrans support for help.` });
  const s = sessionPayload(user.id,req,res);
  res.json({ user:publicProfile(user.id), sessionExpiresAt:s.expires });
});

router.get('/me', (req,res) => {
  const user = getSessionUser(req.cookies?.session);
  if (!user) return res.status(401).json({ error:'Unauthenticated' });
  res.json({ user:publicProfile(user.id) });
});

router.post('/logout', (req,res) => {
  revokeSession(req.cookies?.session);
  res.clearCookie('session',sessionCookieOptions);
  res.json({ ok:true });
});

router.post('/forgot-password', async(req,res) => {
  const identifier=String(req.body?.identifier||'').trim().toLowerCase();
  const generic={message:'If an account matches those details, recovery instructions will be sent.'};
  if(!identifier)return res.json(generic);
  const user=db.prepare('SELECT id,email FROM users WHERE lower(email)=? OR phone=?').get(identifier,identifier);
  if(!user)return res.json(generic);
  const production=process.env.NODE_ENV==='production';
  let resetUrl=null;
  if(production){
    if(!isEmailConfigured())return res.json(generic);
    try{const appUrl=new URL(process.env.APP_URL);if(appUrl.protocol!=='https:')return res.json(generic);resetUrl=new URL('/reset-password',appUrl);}
    catch{return res.json(generic);}
  }
  const token=crypto.randomBytes(32).toString('hex'),tokenHash=crypto.createHash('sha256').update(token).digest('hex');
  db.prepare('INSERT INTO password_resets (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)')
    .run(crypto.randomUUID(),user.id,tokenHash,new Date(Date.now()+15*60*1000).toISOString());
  if(!production)return res.json({...generic,debugToken:token,note:'Development only: token delivery provider is not configured.'});
  resetUrl.searchParams.set('token',token);
  try{
    await sendEmail({
      to:user.email,
      subject:'Reset your DigiTrans password',
      text:`Use this secure link within 15 minutes to reset your DigiTrans password: ${resetUrl.href}\n\nIf you did not request this, ignore this email.`,
      html:`<p>We received a request to reset your DigiTrans password.</p><p><a href="${resetUrl.href}">Reset password</a></p><p>This link expires in 15 minutes. If you did not request this, ignore this email.</p>`,
    });
  }catch(error){console.error('Password reset email could not be delivered:',error.message);}
  return res.json(generic);
});

router.post('/reset-password', (req,res) => {
  const token = String(req.body?.token || ''), password = String(req.body?.password || ''), confirm = String(req.body?.confirmPassword || '');
  if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return res.status(400).json({ error:'Use at least 8 characters with letters and numbers.' });
  if (password !== confirm) return res.status(400).json({ error:'Passwords do not match.' });
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const row = db.prepare('SELECT * FROM password_resets WHERE token_hash=? AND used=0').get(hash);
  if (!row || new Date(row.expires_at) < new Date()) return res.status(400).json({ error:'This recovery link is invalid or has expired.' });
  const update = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash=?,updated_at=datetime(\'now\') WHERE id=?').run(hashPassword(password),row.user_id);
    db.prepare('UPDATE password_resets SET used=1 WHERE id=?').run(row.id);
    revokeAllSessions(row.user_id);
  });
  update(); res.json({ message:'Password updated. Sign in with your new password.' });
});

router.get('/profile', (req,res) => {
  const user = getSessionUser(req.cookies?.session);
  if (!user) return res.status(401).json({ error:'Unauthenticated' });
  res.json({ user:publicProfile(user.id) });
});

router.patch('/profile', (req,res) => {
  const user = getSessionUser(req.cookies?.session);
  if (!user) return res.status(401).json({ error:'Unauthenticated' });
  const fullName = String(req.body?.fullName || '').trim();
  const address = String(req.body?.address || '').trim();
  if (fullName.length < 2 || fullName.length > 100) return res.status(400).json({ error:'Enter a valid full name.' });
  db.prepare('UPDATE profiles SET full_name=?,address=?,updated_at=datetime(\'now\') WHERE user_id=?').run(fullName,address || null,user.id);
  res.json({ user:publicProfile(user.id), message:'Profile updated.' });
});

router.post('/change-password', (req,res) => {
  const user = getSessionUser(req.cookies?.session);
  if (!user) return res.status(401).json({ error:'Unauthenticated' });
  const current = String(req.body?.currentPassword || ''), next = String(req.body?.newPassword || '');
  const record = db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id);
  if (!verifyPassword(current,record.password_hash)) return res.status(400).json({ error:'Current password is incorrect.' });
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) return res.status(400).json({ error:'Use at least 8 characters with letters and numbers.' });
  const change = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash=?,updated_at=datetime(\'now\') WHERE id=?').run(hashPassword(next),user.id);
    revokeAllSessions(user.id);
  });
  change();
  res.clearCookie('session',sessionCookieOptions);
  res.json({ message:'Password updated. Sign in again on your devices.' });
});

export default router;
