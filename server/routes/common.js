import {asyncRouter} from '../async-router.js';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requirePermission, userHasPermission, notify, audit } from '../auth.js';
import { parseSearchQuery } from '../query-filters.js';
import { ADMIN_ROLE_IDS } from '../../shared/roles.js';
import { workspacePath } from '../../shared/workspace-links.js';

const router=asyncRouter();
const ref=p=>`${p}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
const canManageSupport=user=>userHasPermission(user,'support.manage');
const moneyText=value=>`₦${Number(value||0).toLocaleString('en-NG')}`;

async function resolveRelatedRecord(rawValue,user,{allowAny=false}={}){
  const key=String(rawValue||'').trim();
  if(!key)return null;
  const checkOwner=allowAny?1:0;

  const delivery=await db.prepare(`SELECT d.id,d.reference,d.status,d.pickup_address,d.dropoff_address,d.fee
    FROM public.deliveries d
    WHERE (d.id=? OR d.reference=?)
      AND (?=1 OR d.customer_id=? OR d.vendor_id=?
        OR EXISTS(SELECT 1 FROM public.delivery_assignments da WHERE da.delivery_id=d.id AND da.rider_id=?))
    LIMIT 1`).get(key,key,checkOwner,user.id,user.id,user.id);
  if(delivery)return {type:'delivery',id:delivery.id,reference:delivery.reference,status:delivery.status,summary:`${delivery.pickup_address} → ${delivery.dropoff_address} · ${moneyText(delivery.fee)}`};

  const waybill=await db.prepare(`SELECT id,reference,waybill_number,status,origin,destination_city,fee
    FROM public.waybills
    WHERE (id=? OR reference=? OR waybill_number=?) AND (?=1 OR customer_id=?)
    LIMIT 1`).get(key,key,key,checkOwner,user.id);
  if(waybill)return {type:'waybill',id:waybill.id,reference:waybill.waybill_number||waybill.reference,status:waybill.status,summary:`${waybill.origin} → ${waybill.destination_city} · ${moneyText(waybill.fee)}`};

  const marketRun=await db.prepare(`SELECT id,reference,status,delivery_location,final_total,budget_estimate
    FROM public.market_runs
    WHERE (id=? OR reference=?) AND (?=1 OR customer_id=?)
    LIMIT 1`).get(key,key,checkOwner,user.id);
  if(marketRun)return {type:'market_run',id:marketRun.id,reference:marketRun.reference,status:marketRun.status,summary:`${marketRun.delivery_location} · ${moneyText(marketRun.final_total||marketRun.budget_estimate)}`};

  const payment=await db.prepare(`SELECT id,reference,status,amount
    FROM public.payments
    WHERE (id=? OR reference=? OR provider_ref=?) AND (?=1 OR user_id=?)
    LIMIT 1`).get(key,key,key,checkOwner,user.id);
  if(payment)return {type:'payment',id:payment.id,reference:payment.reference,status:payment.status,summary:`Payment · ${moneyText(payment.amount)}`};

  const withdrawal=await db.prepare(`SELECT id,reference,status,amount
    FROM public.withdrawal_requests
    WHERE (id=? OR reference=?) AND (?=1 OR rider_id=?)
    LIMIT 1`).get(key,key,checkOwner,user.id);
  if(withdrawal)return {type:'withdrawal',id:withdrawal.id,reference:withdrawal.reference,status:withdrawal.status,summary:`Rider withdrawal · ${moneyText(withdrawal.amount)}`};

  const application=await db.prepare(`SELECT a.id,a.reference,a.status,a.amount,o.title opportunity_title
    FROM public.investment_applications a JOIN public.opportunities o ON o.id=a.opportunity_id
    WHERE (a.id=? OR a.reference=?) AND (?=1 OR a.investor_id=?)
    LIMIT 1`).get(key,key,checkOwner,user.id);
  if(application)return {type:'investment_application',id:application.id,reference:application.reference,status:application.status,summary:`${application.opportunity_title} · ${moneyText(application.amount)}`};

  const investment=await db.prepare(`SELECT i.id,i.status,i.principal,o.title opportunity_title
    FROM public.investments i JOIN public.opportunities o ON o.id=i.opportunity_id
    WHERE i.id=? AND (?=1 OR i.investor_id=?)
    LIMIT 1`).get(key,checkOwner,user.id);
  if(investment)return {type:'investment',id:investment.id,reference:investment.opportunity_title,status:investment.status,summary:`Investment · ${moneyText(investment.principal)}`};

  const invWithdrawal=await db.prepare(`SELECT w.id,w.reference,w.status,w.amount,o.title opportunity_title
    FROM public.investment_withdrawals w JOIN public.investments i ON i.id=w.investment_id JOIN public.opportunities o ON o.id=i.opportunity_id
    WHERE (w.id=? OR w.reference=?) AND (?=1 OR w.investor_id=?)
    LIMIT 1`).get(key,key,checkOwner,user.id);
  if(invWithdrawal)return {type:'investment_withdrawal',id:invWithdrawal.id,reference:invWithdrawal.reference,status:invWithdrawal.status,summary:`Investment withdrawal · ${moneyText(invWithdrawal.amount)}`};

  return null;
}

async function contextHref(context,user){
  if(!context)return null;
  const role=String(user?.role||''),isAdmin=ADMIN_ROLE_IDS.includes(role);
  if(isAdmin){
    if(context.type==='delivery'&&await userHasPermission(user,'deliveries.read'))return workspacePath(role,'deliveries',{focus:context.id});
    if(context.type==='waybill'&&await userHasPermission(user,'waybills.manage'))return workspacePath(role,'waybills',{focus:context.id});
    if(context.type==='market_run'&&await userHasPermission(user,'market_runs.manage'))return workspacePath(role,'market',{focus:context.id});
    if(context.type==='payment'&&await userHasPermission(user,'finance.read'))return workspacePath(role,'payments',{focus:context.id});
    if(context.type==='withdrawal'&&await userHasPermission(user,'finance.read'))return workspacePath(role,'withdrawals',{focus:context.id});
    if(context.type==='investment_application'&&await userHasPermission(user,'investments.read'))return workspacePath(role,'investments',{tab:'applications',focus:context.id});
    if(context.type==='investment'&&await userHasPermission(user,'investments.read'))return workspacePath(role,'investments',{tab:'opportunities',focus:context.id});
    if(context.type==='investment_withdrawal'&&await userHasPermission(user,'investments.read'))return workspacePath(role,'investments',{tab:'withdrawals',focus:context.id});
    return null;
  }
  switch(context.type){
    case 'delivery': return workspacePath(role,role==='rider'?'jobs':'history',{focus:context.id});
    case 'waybill': return workspacePath(role,'waybills',{focus:context.id});
    case 'market_run': return workspacePath(role,'market',{focus:context.id});
    case 'payment': return workspacePath(role,'payments',{focus:context.id});
    case 'withdrawal': return workspacePath(role,'earnings',{focus:context.id});
    case 'investment_application': return workspacePath(role,'applications',{focus:context.id});
    case 'investment': return workspacePath(role,'overview',{focus:context.id});
    case 'investment_withdrawal': return workspacePath(role,'withdrawals',{focus:context.id});
    default: return null;
  }
}

async function enrichTickets(tickets,user,staff){
  return Promise.all(tickets.map(async ticket=>{
    if(!ticket.related_id)return {...ticket,related_context:null};
    const context=await resolveRelatedRecord(ticket.related_id,user,{allowAny:staff});
    if(!context)return {...ticket,related_context:null};
    return {...ticket,related_context:{...context,href:await contextHref(context,user)}};
  }));
}

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
  const category=String(req.body?.category||'general').trim().slice(0,80),description=String(req.body?.description||'').trim(),rawRelated=String(req.body?.relatedId||'').trim();
  if(description.length<10||description.length>3000)return res.status(400).json({error:'Describe the issue in at least 10 characters.'});
  let relatedId=null;
  if(rawRelated){
    const staff=await canManageSupport(req.user);
    const resolved=await resolveRelatedRecord(rawRelated,req.user,{allowAny:staff});
    if(!resolved)return res.status(404).json({error:'Related record not found.'});
    relatedId=resolved.id;
  }
  const id=crypto.randomUUID(),reference=ref('SUP');
  await db.prepare('INSERT INTO support_tickets (id,reference,requester_id,category,description,related_id) VALUES (?,?,?,?,?,?)').run(id,reference,req.user.id,category,description,relatedId);
  await db.prepare('INSERT INTO support_messages (id,ticket_id,sender_id,message,is_internal) VALUES (?,?,?,?,0)').run(crypto.randomUUID(),id,req.user.id,description);
  res.status(201).json({id,reference,status:'open',relatedId});
});
router.get('/support',requireAuth,async (req, res) => {
  const staff=await canManageSupport(req.user);
  const status=String(req.query.status||'').trim()||null,search=parseSearchQuery(req.query.search);
  if(status&&!['open','assigned','in_progress','awaiting_user','resolved','closed'].includes(status))return res.status(400).json({error:'Choose a valid support status.'});
  const rows=staff
    ?await db.prepare(`SELECT t.*,p.full_name requester_name,u.role requester_role FROM support_tickets t JOIN profiles p ON p.user_id=t.requester_id JOIN users u ON u.id=t.requester_id
      WHERE (CAST(? AS text) IS NULL OR t.status=?)
        AND (CAST(? AS text) IS NULL OR t.reference ILIKE ? OR t.description ILIKE ? OR p.full_name ILIKE ? OR COALESCE(t.related_id,'') ILIKE ?)
      ORDER BY t.created_at DESC LIMIT 200`).all(status,status,search,search,search,search,search)
    :await db.prepare(`SELECT id,reference,category,description,related_id,status,created_at,updated_at FROM support_tickets
      WHERE requester_id=?
        AND (CAST(? AS text) IS NULL OR status=?)
        AND (CAST(? AS text) IS NULL OR reference ILIKE ? OR description ILIKE ?)
      ORDER BY created_at DESC`).all(req.user.id,status,status,search,search,search);
  res.json({tickets:await enrichTickets(rows,req.user,staff)});
});
router.get('/support/:id',requireAuth,async (req, res) => {
  const t=await db.prepare('SELECT * FROM support_tickets WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!t)return res.status(404).json({error:'Support request not found.'});
  const staff=await canManageSupport(req.user);
  if(t.requester_id!==req.user.id&&!staff)return res.status(404).json({error:'Support request not found.'});
  const messages=staff?await db.prepare('SELECT * FROM support_messages WHERE ticket_id=? ORDER BY created_at').all(t.id):await db.prepare('SELECT id,sender_id,message,created_at FROM support_messages WHERE ticket_id=? AND is_internal=0 ORDER BY created_at').all(t.id);
  const [enriched]=await enrichTickets([t],req.user,staff);
  res.json({ticket:enriched,messages});
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
