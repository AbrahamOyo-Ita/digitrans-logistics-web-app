import {asyncRouter} from '../async-router.js';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requirePermission, notify, audit } from '../auth.js';

const router=asyncRouter();
const ref=p=>`${p}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
const canManageSupport=async user => user.role==='super_admin'||!!(await db.prepare(`SELECT 1 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.name=? AND p.key='support.manage'`).get(user.role));

router.get('/notifications',requireAuth,async (req, res) => {
  const rows=await db.prepare('SELECT id,title,message,type,related_id,is_read,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  res.json({notifications:rows,unread:rows.filter(n=>!n.is_read).length});
});
router.patch('/notifications/:id/read',requireAuth,async (req, res) => {
  const result=await db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  if(!result.changes)return res.status(404).json({error:'Notification not found.'});res.json({ok:true});
});
router.post('/notifications/read-all',requireAuth,async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0').run(req.user.id);res.json({ok:true});
});

router.post('/support',requireAuth,async (req, res) => {
  const category=String(req.body?.category||'general').trim().slice(0,80),description=String(req.body?.description||'').trim(),relatedId=String(req.body?.relatedId||'').trim()||null;
  if(description.length<10||description.length>3000)return res.status(400).json({error:'Describe the issue in at least 10 characters.'});
  if(relatedId){
    const owns=(await db.prepare(`SELECT 1 FROM deliveries WHERE id=? AND (customer_id=? OR vendor_id=?)`).get(relatedId,req.user.id,req.user.id))
      || (await db.prepare('SELECT 1 FROM waybills WHERE id=? AND customer_id=?').get(relatedId,req.user.id))
      || (await db.prepare('SELECT 1 FROM market_runs WHERE id=? AND customer_id=?').get(relatedId,req.user.id));
    if(!owns&&!['super_admin','ops_officer','rider_manager','vendor_manager'].includes(req.user.role))return res.status(404).json({error:'Related record not found.'});
  }
  const id=crypto.randomUUID(),reference=ref('SUP');
  await db.prepare('INSERT INTO support_tickets (id,reference,requester_id,category,description,related_id) VALUES (?,?,?,?,?,?)').run(id,reference,req.user.id,category,description,relatedId);
  await db.prepare('INSERT INTO support_messages (id,ticket_id,sender_id,message,is_internal) VALUES (?,?,?,?,0)').run(crypto.randomUUID(),id,req.user.id,description);
  res.status(201).json({id,reference,status:'open'});
});
router.get('/support',requireAuth,async (req, res) => {
  const staff=await canManageSupport(req.user);
  const tickets=staff?await db.prepare(`SELECT t.*,p.full_name requester_name,u.role requester_role FROM support_tickets t JOIN profiles p ON p.user_id=t.requester_id JOIN users u ON u.id=t.requester_id ORDER BY t.created_at DESC LIMIT 200`).all():await db.prepare('SELECT id,reference,category,description,related_id,status,created_at,updated_at FROM support_tickets WHERE requester_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json({tickets});
});
router.get('/support/:id',requireAuth,async (req, res) => {
  const t=await db.prepare('SELECT * FROM support_tickets WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!t)return res.status(404).json({error:'Support request not found.'});
  const staff=await canManageSupport(req.user);
  if(t.requester_id!==req.user.id&&!staff)return res.status(404).json({error:'Support request not found.'});
  const messages=staff?await db.prepare('SELECT * FROM support_messages WHERE ticket_id=? ORDER BY created_at').all(t.id):await db.prepare('SELECT id,sender_id,message,created_at FROM support_messages WHERE ticket_id=? AND is_internal=0 ORDER BY created_at').all(t.id);
  res.json({ticket:t,messages});
});
router.post('/support/:id/messages',requireAuth,async (req, res) => {
  const t=await db.prepare('SELECT * FROM support_tickets WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!t)return res.status(404).json({error:'Support request not found.'});
  const staff=await canManageSupport(req.user),internal=req.body?.internal===true;
  if(t.requester_id!==req.user.id&&!staff)return res.status(404).json({error:'Support request not found.'});
  if(internal&&!staff)return res.status(403).json({error:'Only support staff can add internal notes.'});
  const message=String(req.body?.message||'').trim();if(message.length<2||message.length>3000)return res.status(400).json({error:'Enter a message.'});
  const mid=crypto.randomUUID();await db.prepare('INSERT INTO support_messages (id,ticket_id,sender_id,message,is_internal) VALUES (?,?,?,?,?)').run(mid,t.id,req.user.id,message,internal?1:0);
  if(staff&&!internal)await notify(t.requester_id,'Support reply',`There is a new reply on ${t.reference}.`,'support',t.id);
  await db.prepare("UPDATE support_tickets SET status=CASE WHEN status='open' THEN 'in_progress' ELSE status END,updated_at=now() WHERE id=?").run(t.id);
  res.status(201).json({id:mid,message,internal});
});
router.post('/support/:id/status',requireAuth,requirePermission('support.manage'),async (req, res) => {
  const t=await db.prepare('SELECT * FROM support_tickets WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!t)return res.status(404).json({error:'Support request not found.'});
  const status=String(req.body?.status||''),assignedTo=req.body?.assignedTo||null;
  if(!['open','assigned','in_progress','awaiting_user','resolved','closed'].includes(status))return res.status(400).json({error:'Unsupported support status.'});
  if(assignedTo&&!(await db.prepare('SELECT id FROM users WHERE id=? AND status=\'active\'').get(assignedTo)))return res.status(400).json({error:'Select an active staff user.'});
  await db.prepare("UPDATE support_tickets SET status=?,assigned_to=COALESCE(?,assigned_to),updated_at=now() WHERE id=?").run(status,assignedTo,t.id);
  await audit(req.user,'support.status_changed','support_ticket',t.id,{status:t.status},{status,assignedTo},String(req.body?.reason||''),req.ip);
  if(['resolved','closed'].includes(status))await notify(t.requester_id,'Support request '+status,`Request ${t.reference} is ${status}.`,'support',t.id);
  res.json({status});
});

export default router;
