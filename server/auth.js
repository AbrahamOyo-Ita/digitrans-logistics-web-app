import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from './db.js';

export const VALID_ROLES = ['customer','student','rider','vendor','investor','ops_officer','rider_manager','vendor_manager','finance_officer','investment_manager','super_admin'];
export const ADMIN_ROLES = ['ops_officer','rider_manager','vendor_manager','finance_officer','investment_manager','super_admin'];

export function hashPassword(pw) { return bcrypt.hashSync(pw, 12); }
export function verifyPassword(pw, hash) { return bcrypt.compareSync(pw, hash); }

export function createSession(userId, req) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 7*24*60*60*1000).toISOString();
  db.prepare(`INSERT INTO sessions (id,user_id,token_hash,expires_at,ip,user_agent) VALUES (?,?,?,?,?,?)`)
    .run(id, userId, tokenHash, expires, req?.ip || '', req?.headers?.['user-agent'] || '');
  return { token, sessionId: id, expires };
}

export function getSessionUser(token) {
  if (!token) return null;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const s = db.prepare(`SELECT * FROM sessions WHERE token_hash=? AND revoked=0`).get(hash);
  if (!s) return null;
  if (new Date(s.expires_at) < new Date()) return null;
  const u = db.prepare(`SELECT id,email,phone,role,status FROM users WHERE id=?`).get(s.user_id);
  if (!u) return null;
  if (['rejected','suspended','deactivated','archived'].includes(u.status)) return null;
  return { ...u, sessionId: s.id };
}

export function revokeSession(token) {
  if (!token) return;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  db.prepare(`UPDATE sessions SET revoked=1 WHERE token_hash=?`).run(hash);
}

export function revokeAllSessions(userId) {
  db.prepare(`UPDATE sessions SET revoked=1 WHERE user_id=?`).run(userId);
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.session;
  const user = getSessionUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });
  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (!ADMIN_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
}

export function requirePermission(key) {
  return (req,res,next) => {
    if (!req.user) return res.status(401).json({error:'Unauthenticated'});
    if (req.user.role === 'super_admin') return next();
    const granted = db.prepare(`SELECT 1 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.name=? AND p.key=?`).get(req.user.role,key);
    if (!granted) return res.status(403).json({error:'You do not have permission to perform this action.'});
    next();
  };
}

export function audit(actor, action, recordType, recordId, prev, next, reason, ip) {
  try {
    db.prepare(`INSERT INTO audit_logs (id,actor_id,actor_role,action,record_type,record_id,prev_value,new_value,reason,ip) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(crypto.randomUUID(), actor?.id || null, actor?.role || null, action, recordType, recordId, prev ? JSON.stringify(prev) : null, next ? JSON.stringify(next) : null, reason || null, ip || null);
  } catch(e) { console.error('audit failed', e); }
}

export function notify(userId, title, message, type='info', relatedId=null) {
  db.prepare(`INSERT INTO notifications (id,user_id,title,message,type,related_id) VALUES (?,?,?,?,?,?)`)
    .run(crypto.randomUUID(), userId, title, message, type, relatedId);
}
