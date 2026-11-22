import {asyncRouter} from '../async-router.js';
import crypto from 'crypto';
import db from '../db.js';
import {requireAuth,requireRole,requirePermission,requireAnyPermission,userHasPermission,notify,audit,revokeAllSessions,createSupabasePendingAdmin,sendSupabaseRecovery} from '../auth.js';
import {getSupabaseAdmin} from '../supabase.js';
import {isEmailConfigured,sendEmail} from '../email.js';
import {createAdminInviteEmailTemplate} from '../email-templates.js';
import {sanitizeAuditRecord,verifyAuditHistory} from '../audit.js';
import {ADMIN_ROLE_IDS,ADMIN_ROLE_LABELS} from '../../shared/roles.js';
import {missingPermissionDependencies} from '../../shared/permissions.js';
import { createDelivery } from './customer.js';
import {logger} from '../logger.js';

const router=asyncRouter();
const id=()=>crypto.randomUUID();
const ref=p=>`${p}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
const adminRoleSlots=ADMIN_ROLE_IDS.map(()=>'?').join(',');
function adminInvitationOrigin(){
 let url;
 try{url=new URL(String(process.env.APP_URL||''));}catch{throw new Error('A valid APP_URL is required for administrator invitations.');}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash||(process.env.NODE_ENV==='production'&&url.protocol!=='https:')){
  throw new Error('APP_URL must be a public HTTP(S) origin for administrator invitations.');
 }
 return url.origin;
}
function adminInvitationUrl(origin,{id:inviteId,email,role,token}){
 const url=new URL('/admin/invite',origin);
 url.hash=new URLSearchParams({invite:inviteId,email,role,token}).toString();
 return url.href;
}
function auditDateFilter(value,end=false){
 const date=String(value||'').trim();
 if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date))return null;
 const parsed=new Date(`${date}T${end?'23:59:59.999':'00:00:00.000'}Z`);
 return Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date?null:parsed.toISOString();
}

router.get('/ops/dashboard',requireAuth,requirePermission('deliveries.read'),async (req,res)=>{
  const count=async(sql,...args)=>(await db.prepare(sql).get(...args))?.n||0;
  const sum=async(sql,...args)=>(await db.prepare(sql).get(...args))?.n||0;
  const [users,riders,vendors,marketRuns,waybills,finance,investments,studentReview]=await Promise.all([
    userHasPermission(req.user,'users.read'),userHasPermission(req.user,'riders.review'),userHasPermission(req.user,'vendors.review'),
    userHasPermission(req.user,'market_runs.manage'),userHasPermission(req.user,'waybills.manage'),userHasPermission(req.user,'finance.read'),userHasPermission(req.user,'investments.read'),userHasPermission(req.user,'students.review'),
  ]);
  const stats={
    activeDeliveries:await count("SELECT COUNT(*) n FROM deliveries WHERE status IN ('assigned','rider_accepted','rider_en_route_to_pickup','arrived_at_pickup','package_collected','in_transit','arrived_at_destination','out_for_delivery')"),
    pendingDeliveries:await count("SELECT COUNT(*) n FROM deliveries WHERE status IN ('pending_confirmation','awaiting_assignment')"),
    completedDeliveries:await count("SELECT COUNT(*) n FROM deliveries WHERE status='delivered'"),
    failedDeliveries:await count("SELECT COUNT(*) n FROM deliveries WHERE status='delivery_failed'"),
    scheduledDeliveries:await count("SELECT COUNT(*) n FROM deliveries WHERE timing='scheduled' AND status NOT IN ('delivered','cancelled','returned')"),
  };
  if(users){stats.customers=await count("SELECT COUNT(*) n FROM users WHERE role IN ('customer','student')");stats.activeCustomers=await count("SELECT COUNT(*) n FROM users WHERE role IN ('customer','student') AND status='active'");}
  if(riders){stats.riders=await count('SELECT COUNT(*) n FROM riders');stats.approvedRiders=await count("SELECT COUNT(*) n FROM riders WHERE approval_status='approved'");stats.pendingRiders=await count("SELECT COUNT(*) n FROM riders WHERE approval_status='pending'");}
  if(vendors){stats.vendors=await count('SELECT COUNT(*) n FROM vendors');stats.pendingVendors=await count("SELECT COUNT(*) n FROM vendors WHERE approval_status='pending'");}
  if(marketRuns){stats.pendingMarketRuns=await count("SELECT COUNT(*) n FROM market_runs WHERE status IN ('submitted','under_review','awaiting_customer_approval')");stats.activeMarketRuns=await count("SELECT COUNT(*) n FROM market_runs WHERE status NOT IN ('delivered','cancelled','rejected')");}
  if(waybills){stats.pendingWaybills=await count("SELECT COUNT(*) n FROM waybills WHERE status IN ('submitted','under_review','awaiting_parcel_dropoff')");stats.dispatchedWaybills=await count("SELECT COUNT(*) n FROM waybills WHERE status IN ('dispatched','in_transit')");}
  if(finance){stats.riderEarnings=await sum('SELECT COALESCE(SUM(rider_earnings),0) n FROM rider_earnings');stats.outstandingSettlements=await sum("SELECT COALESCE(SUM(rider_earnings),0) n FROM rider_earnings WHERE settlement_status='pending'");stats.pendingWithdrawals=await count("SELECT COUNT(*) n FROM withdrawal_requests WHERE status IN ('requested','under_review')");}
  if(investments){stats.investors=await count('SELECT COUNT(*) n FROM investors');stats.activeOpportunities=await count("SELECT COUNT(*) n FROM opportunities WHERE status='published'");}
  if(studentReview)stats.pendingStudents=await count("SELECT COUNT(*) n FROM student_profiles WHERE verification_status='pending'");
  const recent=await db.prepare('SELECT id,reference,manual_customer_name,recipient_name,status,fee,created_at FROM deliveries ORDER BY created_at DESC LIMIT 6').all();
  res.json({stats,recent});
});

router.post('/ops/bookings',requireAuth,requirePermission('deliveries.create'),async (req, res) => {
  try{
    const channel=['phone','whatsapp','walk_in','manual'].includes(req.body?.channel)?req.body.channel:'manual';
    const result=await createDelivery({userId:null,role:req.user.role,body:req.body,actor:req.user,channel});
    res.status(201).json({...result,message:'Manual booking created.'});
  }catch(e){res.status(e.status||400).json({error:e.message});}
});

router.get('/ops/users',requireAuth,requirePermission('users.read'),async (req, res) => {
  const role=req.query.role?String(req.query.role):null, status=req.query.status?String(req.query.status):null;
  const search=req.query.search?`%${String(req.query.search).slice(0,80)}%`:null;
  const limit=Math.min(100,Math.max(1,Number(req.query.limit)||50));
  const rows=await db.prepare(`SELECT u.id,u.email,u.phone,u.role,u.status,u.created_at,p.full_name,
    r.approval_status rider_status,v.approval_status vendor_status,i.verification_status investor_status,
    r.vehicle_type,v.business_name FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN riders r ON r.user_id=u.id LEFT JOIN vendors v ON v.user_id=u.id LEFT JOIN investors i ON i.user_id=u.id
    WHERE (CAST(? AS text) IS NULL OR u.role=?) AND (CAST(? AS text) IS NULL OR u.status=?) AND (CAST(? AS text) IS NULL OR u.email LIKE ? OR u.phone LIKE ? OR p.full_name LIKE ? OR v.business_name LIKE ?)
    ORDER BY u.created_at DESC LIMIT ?`).all(role,role,status,status,search,search,search,search,search,limit);
  res.json({users:rows});
});

router.post('/ops/users/:userId/status',requireAuth,requireAnyPermission('accounts.suspend','users.manage'),async (req, res) => {
  const status=String(req.body?.status||''), reason=String(req.body?.reason||'').trim();
  if(!['active','suspended','rejected','deactivated','archived'].includes(status))return res.status(400).json({error:'Unsupported account status.'});
  const u=await db.prepare('SELECT id,role,status FROM users WHERE id=?').get(req.params.userId);
  if(!u)return res.status(404).json({error:'Account not found.'});
  if(u.role==='super_admin'&&req.user.role!=='super_admin')return res.status(403).json({error:'Only the Super Administrator can manage another Super Administrator.'});
  if(u.id===req.user.id)return res.status(400).json({error:'You cannot suspend your own account.'});
  const update=db.transaction(async () => {
    if(u.role==='super_admin'&&status!=='active'){
      const activeSuperAdmins=await db.prepare("SELECT id FROM public.users WHERE role='super_admin' AND status='active' ORDER BY id FOR UPDATE").all();
      if(activeSuperAdmins.length<=1)throw Object.assign(new Error('At least one active Super Administrator must remain.'),{status:409});
    }
    const locked=await db.prepare('SELECT id,role,status FROM public.users WHERE id=? FOR UPDATE').get(u.id);
    if(!locked||locked.role!==u.role||locked.status!==u.status)throw Object.assign(new Error('The account changed while this update was in progress. Refresh and retry.'),{status:409});
    await db.prepare("UPDATE users SET status=?,updated_at=now() WHERE id=?").run(status,u.id);
    if(status!=='active')await revokeAllSessions(u.id);
    if(u.role==='rider'&&status==='suspended')await db.prepare("UPDATE riders SET approval_status='suspended',availability='suspended',rejection_reason=? WHERE user_id=?").run(reason,u.id);
    if(u.role==='vendor'&&status==='suspended')await db.prepare("UPDATE vendors SET approval_status='suspended',rejection_reason=? WHERE user_id=?").run(reason,u.id);
  });
  try{await update();}catch(error){if(error?.status)return res.status(error.status).json({error:error.message});throw error;}
  await notify(u.id,'Account status updated',reason||`Your account status is now ${status.replaceAll('_',' ')}.`,'account');
  await audit(req.user,'user.status_changed','user',u.id,{status:u.status},{status},reason,req.ip);
  res.json({id:u.id,status});
});

router.get('/ops/vendors',requireAuth,requirePermission('vendors.review'),async (req, res) => {
  const status=req.query.status?String(req.query.status):null;
  const rows=await db.prepare(`SELECT v.*,u.email,u.phone,u.status account_status,p.full_name FROM vendors v JOIN users u ON u.id=v.user_id JOIN profiles p ON p.user_id=u.id WHERE (CAST(? AS text) IS NULL OR v.approval_status=?) ORDER BY v.created_at DESC`).all(status,status);
  res.json({vendors:rows});
});
router.get('/ops/vendors/:id/documents',requireAuth,requirePermission('vendors.review'),async (req, res) => {
  const v=await db.prepare('SELECT user_id FROM vendors WHERE user_id=?').get(req.params.id);if(!v)return res.status(404).json({error:'Vendor not found.'});res.json({documents:await db.prepare('SELECT id,doc_type,status,created_at FROM vendor_documents WHERE vendor_id=? ORDER BY created_at DESC').all(v.user_id)});
});
router.post('/ops/vendors/:id/documents/:docId/status',requireAuth,requirePermission('vendors.review'),async (req, res) => {
  const status=String(req.body?.status||'');if(!['approved','rejected'].includes(status))return res.status(400).json({error:'Choose approved or rejected.'});
  const doc=await db.prepare('SELECT * FROM vendor_documents WHERE id=? AND vendor_id=?').get(req.params.docId,req.params.id);if(!doc)return res.status(404).json({error:'Document not found.'});
  await db.prepare('UPDATE vendor_documents SET status=? WHERE id=?').run(status,doc.id);await audit(req.user,`vendor.document_${status}`,'vendor_document',doc.id,{status:doc.status},{status},String(req.body?.reason||''),req.ip);res.json({status});
});
router.post('/ops/vendors/:id/decision',requireAuth,requirePermission('vendors.review'),async (req, res) => {
  const status=String(req.body?.status||''),reason=String(req.body?.reason||'').trim();
  if(!['approved','rejected','suspended'].includes(status))return res.status(400).json({error:'Invalid vendor decision.'});
  const v=await db.prepare('SELECT * FROM vendors WHERE user_id=?').get(req.params.id);
  if(!v)return res.status(404).json({error:'Vendor not found.'});
  if(status==='approved'&&(await db.prepare("SELECT id FROM vendor_documents WHERE vendor_id=? AND status='approved' LIMIT 1").get(v.user_id))==null)return res.status(409).json({error:'Review and approve at least one business document before approving this vendor.'});
  const accountStatus=status==='approved'?'active':status==='suspended'?'suspended':'rejected';
  const update=db.transaction(async () => {
    await db.prepare('UPDATE vendors SET approval_status=?,rejection_reason=? WHERE user_id=?').run(status,reason||null,v.user_id);
    await db.prepare("UPDATE users SET status=?,updated_at=now() WHERE id=?").run(accountStatus,v.user_id);
    if(accountStatus!=='active')await revokeAllSessions(v.user_id);
  });
  await update();
  await notify(v.user_id,`Vendor application ${status}`,reason||`Your business account is ${status}.`,'account');
  await audit(req.user,`vendor.application_${status}`,'vendor',v.user_id,{approval_status:v.approval_status},{approval_status:status},reason,req.ip);
  res.json({status});
});

router.get('/ops/students',requireAuth,requirePermission('students.review'),async (req, res) => {
  const rows=await db.prepare(`SELECT sp.*,u.email,u.phone,p.full_name FROM student_profiles sp JOIN users u ON u.id=sp.user_id JOIN profiles p ON p.user_id=u.id WHERE u.role='student' AND sp.verification_status IN ('pending','rejected') ORDER BY u.created_at`).all();
  res.json({students:rows});
});
router.get('/ops/students/:id/documents',requireAuth,requirePermission('students.review'),async (req, res) => {
  const s=await db.prepare('SELECT user_id FROM student_profiles WHERE user_id=?').get(req.params.id);if(!s)return res.status(404).json({error:'Student record not found.'});res.json({documents:await db.prepare('SELECT id,doc_type,status,created_at FROM student_documents WHERE user_id=? ORDER BY created_at DESC').all(s.user_id)});
});
router.post('/ops/students/:id/documents/:docId/status',requireAuth,requirePermission('students.review'),async (req, res) => {
  const status=String(req.body?.status||'');if(!['approved','rejected'].includes(status))return res.status(400).json({error:'Choose approved or rejected.'});
  const doc=await db.prepare('SELECT * FROM student_documents WHERE id=? AND user_id=?').get(req.params.docId,req.params.id);if(!doc)return res.status(404).json({error:'Document not found.'});
  await db.prepare('UPDATE student_documents SET status=? WHERE id=?').run(status,doc.id);await audit(req.user,`student.document_${status}`,'student_document',doc.id,{status:doc.status},{status},String(req.body?.reason||''),req.ip);res.json({status});
});
router.post('/ops/students/:id/decision',requireAuth,requirePermission('students.review'),async (req, res) => {
  const status=String(req.body?.status||''),expiresAt=req.body?.expiresAt||null,reason=String(req.body?.reason||'').trim();
  if(!['approved','rejected'].includes(status))return res.status(400).json({error:'Invalid student verification decision.'});
  const s=await db.prepare('SELECT * FROM student_profiles WHERE user_id=?').get(req.params.id);
  if(!s)return res.status(404).json({error:'Student record not found.'});
  if(status==='approved'&&!(await db.prepare("SELECT id FROM student_documents WHERE user_id=? AND status='approved' LIMIT 1").get(req.params.id)))return res.status(409).json({error:'Review and approve a current student ID document first.'});
  await db.prepare('UPDATE student_profiles SET verification_status=?,expires_at=? WHERE user_id=?').run(status==='approved'?'approved':'rejected',status==='approved'?(expiresAt||new Date(Date.now()+365*86400000).toISOString().slice(0,10)):null,req.params.id);
  await notify(req.params.id,`Student verification ${status}`,reason||`Your student verification is ${status}.`,'account');
  await audit(req.user,`student.verification_${status}`,'student',req.params.id,{status:s.verification_status},{status},reason,req.ip);
  res.json({status});
});

router.post('/ops/deliveries/:id/assign',requireAuth,requirePermission('deliveries.assign'),async (req, res) => {
  const delivery=await db.prepare('SELECT * FROM deliveries WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!delivery)return res.status(404).json({error:'Delivery not found.'});
  if(['delivered','cancelled','returned','delivery_failed'].includes(delivery.status))return res.status(409).json({error:'This delivery is no longer assignable.'});
  if(delivery.timing==='scheduled'&&delivery.scheduled_at&&new Date(delivery.scheduled_at)>new Date())return res.status(409).json({error:'This scheduled delivery cannot be dispatched before its booking window.'});
  const riderId=String(req.body?.riderId||'');
  const rider=await db.prepare(`SELECT r.*,u.status user_status FROM riders r JOIN users u ON u.id=r.user_id WHERE r.user_id=?`).get(riderId);
  if(!rider||rider.approval_status!=='approved'||rider.user_status!=='active'||rider.availability==='suspended')return res.status(400).json({error:'Select an approved, active rider.'});
  const current=await db.prepare("SELECT id,rider_id FROM delivery_assignments WHERE delivery_id=? AND status IN ('assigned','accepted')").get(delivery.id);
  if(current){
    if(current.rider_id===riderId)return res.status(409).json({error:'This rider is already assigned.'});
    if(!req.body?.reassign)return res.status(409).json({error:'A rider is already assigned. Confirm reassignment to continue.'});
  }
  const conflict=await db.prepare(`SELECT d.reference FROM delivery_assignments da JOIN deliveries d ON d.id=da.delivery_id WHERE da.rider_id=? AND da.status IN ('assigned','accepted') AND d.id<>? AND d.status NOT IN ('delivered','cancelled','returned','delivery_failed') LIMIT 1`).get(riderId,delivery.id);
  if(conflict)return res.status(409).json({error:`This rider already has an active delivery (${conflict.reference}).`});
  const agreementVersion=(await db.prepare("SELECT value FROM system_settings WHERE key='current_rider_agreement_version'").get())?.value||'';
  if(!agreementVersion||!(await db.prepare('SELECT id FROM rider_agreements WHERE rider_id=? AND version=?').get(riderId,agreementVersion)))return res.status(409).json({error:'The current rider agreement must be configured and accepted before assignment.'});
  const assignmentId=id(),assignmentRef=ref('ASG'),reason=String(req.body?.reason||'').trim();
  const assign=db.transaction(async () => {
    if(current)await db.prepare("UPDATE delivery_assignments SET status='reassigned',reason=? WHERE id=?").run(reason||'Reassigned by operations',current.id);
    await db.prepare('INSERT INTO delivery_assignments (id,delivery_id,rider_id,status,reference,assigned_by,reason) VALUES (?,?,?,?,?,?,?)').run(assignmentId,delivery.id,riderId,'assigned',assignmentRef,req.user.id,reason||null);
    const previous=delivery.status;
    await db.prepare("UPDATE deliveries SET status='assigned',updated_at=now() WHERE id=?").run(delivery.id);
    await db.prepare('INSERT INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)').run(id(),delivery.id,previous,'assigned',req.user.id,req.user.role,current?'Rider reassigned':'Rider assigned');
    await db.prepare("UPDATE riders SET availability='on_delivery' WHERE user_id=?").run(riderId);
  });
  try{await assign();}catch(error){logger.error('delivery.assignment_failed',{requestId:req.requestId,deliveryId:delivery.id,riderId,error});return res.status(409).json({error:'Unable to create rider assignment.'});}
  await notify(riderId,'New delivery assignment',`You have been assigned delivery ${delivery.reference}.`,'assignment',delivery.id);
  if(delivery.customer_id)await notify(delivery.customer_id,'Rider assigned',`A rider has been assigned to ${delivery.reference}.`,'delivery',delivery.id);
  await audit(req.user,current?'delivery.reassigned':'delivery.assigned','delivery',delivery.id,{status:delivery.status,riderId:current?.rider_id||null},{status:'assigned',riderId,assignmentRef},reason,req.ip);
  res.status(201).json({assignmentId,assignmentRef,status:'assigned'});
});

router.post('/ops/deliveries/:id/status',requireAuth,requirePermission('deliveries.update'),async (req, res) => {
  const d=await db.prepare('SELECT * FROM deliveries WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!d)return res.status(404).json({error:'Delivery not found.'});
  const next=String(req.body?.status||''),reason=String(req.body?.reason||'').trim();
  const allowed={pending_confirmation:['cancelled','awaiting_assignment'],awaiting_assignment:['cancelled'],assigned:['awaiting_assignment','cancelled'],rider_accepted:['awaiting_assignment','cancelled'],rider_en_route_to_pickup:['delivery_failed','cancelled'],arrived_at_pickup:['delivery_failed','cancelled'],package_collected:['delivery_failed','returned'],in_transit:['delivery_failed','returned'],arrived_at_destination:['delivery_failed','returned'],delivery_failed:['awaiting_assignment','returned'],cancelled:['awaiting_assignment']};
  if(!(allowed[d.status]||[]).includes(next))return res.status(409).json({error:`This status change is not allowed (${d.status} → ${next}).`});
  if(reason.length<3)return res.status(400).json({error:'Add an operational reason for this status change.'});
  const run=db.transaction(async () => {
    await db.prepare("UPDATE deliveries SET status=?,updated_at=now() WHERE id=?").run(next,d.id);
    await db.prepare('INSERT INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)').run(id(),d.id,d.status,next,req.user.id,req.user.role,reason);
    if(next==='awaiting_assignment')await db.prepare("UPDATE delivery_assignments SET status='reassigned',reason=? WHERE delivery_id=? AND status IN ('assigned','accepted')").run(reason,d.id);
  });
  await run(); if(d.customer_id)await notify(d.customer_id,'Delivery updated',`Delivery ${d.reference}: ${next.replaceAll('_',' ')}.`,'delivery',d.id);
  await audit(req.user,'delivery.status_changed','delivery',d.id,{status:d.status},{status:next},reason,req.ip);
  res.json({status:next});
});

router.get('/ops/pricing',requireAuth,requirePermission('pricing.read'),async (_req, res) => {
  res.json({versions:await db.prepare('SELECT * FROM pricing_versions ORDER BY created_at DESC').all(),waybillRates:await db.prepare('SELECT * FROM waybill_pricing ORDER BY origin,destination,weight_band').all(),zones:await db.prepare('SELECT * FROM service_zones ORDER BY name').all()});
});
router.post('/ops/pricing',requireAuth,requirePermission('pricing.manage'),async (req, res) => {
  const d=req.body||{};
  const numbers=['baseFee','perKm','minFee','studentFlat','vendorDiscountPct','scheduledSurcharge','specialCharge','riderCommissionPct','marketRunsFee'];
  for(const key of numbers){const n=Number(d[key]??0);if(!Number.isFinite(n)||n<0)return res.status(400).json({error:`${key} must be zero or greater.`});}
  if(Number(d.riderCommissionPct)>100||Number(d.vendorDiscountPct)>100)return res.status(400).json({error:'Percentages cannot exceed 100.'});
  if(Number(d.baseFee)>10000000||Number(d.perKm)>1000000||Number(d.minFee)>10000000)return res.status(400).json({error:'Pricing values exceed the allowed limit.'});
  const versionId=id(),version=`Calabar v${Date.now()}`;
  await db.prepare(`INSERT INTO pricing_versions (id,version,base_fee,per_km,min_fee,student_flat,vendor_discount_pct,scheduled_surcharge,special_charge,rider_commission_pct,market_runs_fee,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(versionId,version,Math.round(Number(d.baseFee)),Math.round(Number(d.perKm)),Math.round(Number(d.minFee)),Math.round(Number(d.studentFlat||0))||null,Number(d.vendorDiscountPct),Math.round(Number(d.scheduledSurcharge)),Math.round(Number(d.specialCharge)),Number(d.riderCommissionPct),Math.round(Number(d.marketRunsFee)),req.user.id);
  await audit(req.user,'pricing.version_created','pricing',versionId,null,d,'New pricing version',req.ip);
  res.status(201).json({id:versionId,version});
});
router.post('/ops/waybill-rates',requireAuth,requirePermission('pricing.manage'),async (req, res) => {
  const d=req.body||{},origin=String(d.origin||'').trim(),destination=String(d.destination||'').trim(),weightBand=String(d.weightBand||''),price=Math.round(Number(d.price));
  if(!origin||!destination||!['below_5kg','5_10kg','above_10kg'].includes(weightBand)||!Number.isSafeInteger(price)||price<0)return res.status(400).json({error:'Provide a valid route, weight band and price.'});
  const prior=await db.prepare('SELECT * FROM waybill_pricing WHERE origin=? AND destination=? AND weight_band=?').get(origin,destination,weightBand);
  if(prior)await db.prepare('UPDATE waybill_pricing SET price=? WHERE id=?').run(price,prior.id);else await db.prepare('INSERT INTO waybill_pricing (id,origin,destination,weight_band,price,category) VALUES (?,?,?,?,?,?)').run(id(),origin,destination,weightBand,price,String(d.category||'general'));
  await audit(req.user,'waybill.pricing_changed','waybill_pricing',`${origin}:${destination}:${weightBand}`,prior,{price},'Waybill price updated',req.ip);
  res.json({ok:true});
});
router.post('/ops/zones',requireAuth,requirePermission('pricing.manage'),async (req, res) => {
  const name=String(req.body?.name||'').trim(),description=String(req.body?.description||'').trim();
  if(name.length<2||name.length>80)return res.status(400).json({error:'Enter a service area name.'});
  const zoneId=id();
  try{await db.prepare('INSERT INTO service_zones (id,name,description,active,supported_services) VALUES (?,?,?,?,?)').run(zoneId,name,description,req.body?.active===false?0:1,String(req.body?.services||'local,market_runs'));}catch{return res.status(409).json({error:'That service area already exists.'});}
  await audit(req.user,'service_zone.created','service_zone',zoneId,null,{name,active:req.body?.active!==false},null,req.ip);
  res.status(201).json({id:zoneId,name});
});
router.patch('/ops/zones/:id',requireAuth,requirePermission('pricing.manage'),async (req, res) => {
  const z=await db.prepare('SELECT * FROM service_zones WHERE id=?').get(req.params.id);
  if(!z)return res.status(404).json({error:'Zone not found.'});
  await db.prepare('UPDATE service_zones SET name=?,description=?,active=?,supported_services=? WHERE id=?').run(String(req.body?.name||z.name),String(req.body?.description??z.description??''),req.body?.active===undefined?z.active:(req.body.active?1:0),String(req.body?.services||z.supported_services),z.id);
  await audit(req.user,'service_zone.updated','service_zone',z.id,z,req.body,null,req.ip);res.json({ok:true});
});

router.get('/ops/audit',requireAuth,requirePermission('audit.read'),async (req, res) => {
  const page=Math.min(10000,Math.max(1,Number.parseInt(req.query.page,10)||1));
  const limit=Math.min(100,Math.max(1,Number.parseInt(req.query.limit,10)||50));
  const search=String(req.query.search||'').trim().slice(0,100),action=String(req.query.action||'').trim().slice(0,100);
  const actorRole=String(req.query.actorRole||'').trim().slice(0,80),recordType=String(req.query.recordType||'').trim().slice(0,100);
  const from=auditDateFilter(req.query.from),to=auditDateFilter(req.query.to,true);
  if((req.query.from&&!from)||(req.query.to&&!to))return res.status(400).json({error:'Use valid dates for the audit filter.'});
  const clauses=[],params=[];
  if(search){clauses.push(`(a.action ILIKE ? OR a.record_type ILIKE ? OR a.record_id ILIKE ? OR a.actor_name ILIKE ? OR a.actor_email ILIKE ? OR a.reason ILIKE ? OR a.request_id ILIKE ?)`);for(let i=0;i<7;i++)params.push(`%${search}%`);}
  if(action){clauses.push('a.action ILIKE ?');params.push(`%${action}%`);}
  if(actorRole){clauses.push('a.actor_role=?');params.push(actorRole);}
  if(recordType){clauses.push('a.record_type ILIKE ?');params.push(`%${recordType}%`);}
  if(from){clauses.push('a.created_at>=CAST(? AS timestamptz)');params.push(from);}
  if(to){clauses.push('a.created_at<=CAST(? AS timestamptz)');params.push(to);}
  const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
  const total=Number((await db.prepare(`SELECT COUNT(*) total FROM public.audit_logs a ${where}`).get(...params))?.total||0);
  const offset=(page-1)*limit;
  const rows=await db.prepare(`SELECT a.*,COALESCE(NULLIF(a.actor_name,''),p.full_name) actor_name
    FROM public.audit_logs a LEFT JOIN public.profiles p ON p.user_id=a.actor_id ${where}
    ORDER BY a.chain_sequence DESC NULLS LAST,a.created_at DESC,a.id DESC LIMIT ? OFFSET ?`).all(...params,limit,offset);
  res.json({logs:rows.map(sanitizeAuditRecord),pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
});

router.get('/ops/audit/integrity',requireAuth,requirePermission('audit.read'),async (_req,res)=>{
  res.json(await verifyAuditHistory(db));
});

router.get('/ops/overview/reports',requireAuth,requirePermission('deliveries.read'),async (_req, res) => {
  const daily=await db.prepare(`SELECT created_at::date date,COUNT(*) bookings,SUM(fee) fees FROM deliveries WHERE created_at>=(current_date - interval '13 days')::date GROUP BY created_at::date ORDER BY date`).all();
  const serviceMix=await db.prepare(`SELECT 'Local delivery' service,COUNT(*) count FROM deliveries UNION ALL SELECT 'Market Runs',COUNT(*) FROM market_runs UNION ALL SELECT 'Waybills',COUNT(*) FROM waybills`).all();
  res.json({daily,serviceMix});
});

router.get('/ops/market-runs',requireAuth,requirePermission('market_runs.manage'),async (_req, res) => {
  const rows=await db.prepare(`SELECT m.*,p.full_name customer_name,COALESCE((SELECT pay.status FROM payments pay WHERE pay.market_run_id=m.id ORDER BY pay.created_at DESC LIMIT 1),'pending') payment_status FROM market_runs m LEFT JOIN profiles p ON p.user_id=m.customer_id ORDER BY m.created_at DESC LIMIT 200`).all();
  const marketRuns=await Promise.all(rows.map(async m => ({
    ...m,
    items:await db.prepare('SELECT id,item_name name,quantity,unit,brand,description FROM market_run_items WHERE market_run_id=?').all(m.id),
    expenses:await db.prepare('SELECT id,item_name,amount,receipt_path,status,created_at FROM market_run_expenses WHERE market_run_id=? ORDER BY created_at DESC').all(m.id)
  })));
  res.json({marketRuns});
});
router.post('/ops/market-runs/:id/estimate',requireAuth,requirePermission('market_runs.manage'),async (req, res) => {
  const m=await db.prepare('SELECT * FROM market_runs WHERE id=?').get(req.params.id);
  if(!m)return res.status(404).json({error:'Market Run not found.'});
  const items=Math.round(Number(req.body?.estimatedItemsCost)),fee=Math.round(Number(req.body?.serviceFee??m.service_fee));
  if(!Number.isSafeInteger(items)||items<0||items>100000000||!Number.isSafeInteger(fee)||fee<0)return res.status(400).json({error:'Enter valid cost and service fee values.'});
  const total=items+fee;
  await db.prepare("UPDATE market_runs SET estimated_items_cost=?,service_fee=?,final_total=?,status='awaiting_customer_approval',updated_at=now() WHERE id=?").run(items,fee,total,m.id);
  if(m.customer_id)await notify(m.customer_id,'Market Run estimate ready',`Review the estimate for ${m.reference}: ₦${total.toLocaleString()}.`,'market_run',m.id);
  await audit(req.user,'market_run.estimate_created','market_run',m.id,{total:m.final_total},{items,fee,total},String(req.body?.reason||''),req.ip);
  res.json({status:'awaiting_customer_approval',estimatedItemsCost:items,serviceFee:fee,total});
});
router.post('/ops/market-runs/:id/agent',requireAuth,requirePermission('market_runs.manage'),async (req, res) => {
  const m=await db.prepare('SELECT * FROM market_runs WHERE id=?').get(req.params.id),agentId=String(req.body?.agentId||'');
  if(!m)return res.status(404).json({error:'Market Run not found.'});
  const agent=await db.prepare('SELECT role FROM users WHERE id=? AND status=\'active\'').get(agentId);
  if(!agent||!await userHasPermission(agent,'market_runs.manage'))return res.status(400).json({error:'Choose an active operations agent with Market Run management access.'});
  await db.prepare("UPDATE market_runs SET agent_id=?,status='agent_assigned',updated_at=now() WHERE id=?").run(agentId,m.id);
  await audit(req.user,'market_run.agent_assigned','market_run',m.id,{agent_id:m.agent_id},{agent_id:agentId},String(req.body?.reason||''),req.ip);
  res.json({status:'agent_assigned'});
});
router.post('/ops/market-runs/:id/expenses',requireAuth,requirePermission('market_runs.manage'),async (req, res) => {
  const m=await db.prepare('SELECT * FROM market_runs WHERE id=?').get(req.params.id);
  if(!m)return res.status(404).json({error:'Market Run not found.'});
  const item=String(req.body?.itemName||'').trim(),amount=Math.round(Number(req.body?.amount||0));
  if(item.length<2||!Number.isSafeInteger(amount)||amount<=0||amount>100000000)return res.status(400).json({error:'Enter an expense description and valid amount.'});
  const expenseId=id();
  await db.prepare('INSERT INTO market_run_expenses (id,market_run_id,item_name,amount,receipt_path,status) VALUES (?,?,?,?,?,\'pending\')').run(expenseId,m.id,item.slice(0,120),amount,req.body?.receiptPath||null);
  await db.prepare("UPDATE market_runs SET status='awaiting_expense_review',updated_at=now() WHERE id=?").run(m.id);
  await audit(req.user,'market_run.expense_recorded','market_run_expense',expenseId,null,{amount,item},null,req.ip);
  res.status(201).json({id:expenseId,status:'pending'});
});
router.post('/ops/market-runs/:id/status',requireAuth,requirePermission('market_runs.manage'),async (req, res) => {
  const m=await db.prepare('SELECT * FROM market_runs WHERE id=?').get(req.params.id);
  if(!m)return res.status(404).json({error:'Market Run not found.'});
  const next=String(req.body?.status||''),reason=String(req.body?.reason||'').trim();
  const statuses=['submitted','under_review','awaiting_customer_approval','approved','agent_assigned','shopping_in_progress','awaiting_expense_review','expense_approved','awaiting_delivery_assignment','assigned_to_rider','in_transit','delivered','cancelled','rejected'];
  if(!statuses.includes(next)||['delivered','cancelled','rejected'].includes(m.status))return res.status(409).json({error:'This Market Run cannot move to that status.'});
  if(['rejected','cancelled'].includes(next)&&reason.length<3)return res.status(400).json({error:'Add a reason for cancellation or rejection.'});
  if(next==='delivered'&&!req.body?.deliveryReference)return res.status(400).json({error:'Link the completed delivery reference before closing this Market Run.'});
  await db.prepare('UPDATE market_runs SET status=?,updated_at=now() WHERE id=?').run(next,m.id);
  if(m.customer_id)await notify(m.customer_id,'Market Run update',`Request ${m.reference}: ${next.replaceAll('_',' ')}${reason?`. ${reason}`:''}`,'market_run',m.id);
  await audit(req.user,'market_run.status_changed','market_run',m.id,{status:m.status},{status:next},reason,req.ip);
  res.json({status:next});
});

router.get('/ops/waybills',requireAuth,requirePermission('waybills.manage'),async (req, res) => {
  const rows=await db.prepare('SELECT id,reference,waybill_number,customer_id,sender_name,sender_phone,recipient_name,recipient_phone,destination_city,origin,status,fee,payment_status,weight,created_at FROM waybills ORDER BY created_at DESC LIMIT 300').all();
  res.json({waybills:rows});
});
router.post('/ops/waybills/:id/status',requireAuth,requirePermission('waybills.manage'),async (req, res) => {
  const w=await db.prepare('SELECT * FROM waybills WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!w)return res.status(404).json({error:'Waybill not found.'});
  const next=String(req.body?.status||''),location=String(req.body?.location||'').trim(),notes=String(req.body?.notes||'').trim();
  const transitions={submitted:['under_review','cancelled','rejected'],under_review:['awaiting_parcel_dropoff','parcel_received','rejected','cancelled'],awaiting_parcel_dropoff:['parcel_received','cancelled'],parcel_received:['awaiting_payment','paid','cancelled'],awaiting_payment:['paid','cancelled'],paid:['processed'],processed:['ready_for_dispatch'],ready_for_dispatch:['dispatched'],dispatched:['in_transit'],in_transit:['arrived_at_destination','delivery_failed'],arrived_at_destination:['awaiting_collection','out_for_final_delivery','delivered'],awaiting_collection:['delivered','returned'],out_for_final_delivery:['delivered','delivery_failed'],delivery_failed:['returned','out_for_final_delivery']};
  if(!(transitions[w.status]||[]).includes(next))return res.status(409).json({error:`Cannot move a waybill from ${w.status} to ${next}.`});
  if(['rejected','cancelled','delivery_failed','returned'].includes(next)&&notes.length<3)return res.status(400).json({error:'Add an operational note for this update.'});
  if(['paid','processed','ready_for_dispatch','dispatched','in_transit'].includes(next)&&w.payment_status!=='successful')return res.status(409).json({error:'Confirm verified payment before processing or dispatch.'});
  let number=w.waybill_number;
  if(next==='processed'&&!number)number=ref('DWB');
  const change=db.transaction(async () => {
    await db.prepare("UPDATE waybills SET status=?,waybill_number=COALESCE(waybill_number,?),updated_at=now() WHERE id=?").run(next,number,w.id);
    await db.prepare('INSERT INTO waybill_tracking_events (id,waybill_id,status,location,notes) VALUES (?,?,?,?,?)').run(id(),w.id,next,location||w.destination_city,notes||null);
  });
  await change();if(w.customer_id)await notify(w.customer_id,'Waybill update',`Waybill ${w.reference}: ${next.replaceAll('_',' ')}.`,'waybill',w.id);
  await audit(req.user,'waybill.status_changed','waybill',w.id,{status:w.status},{status:next,waybillNumber:number},notes,req.ip);
  res.json({status:next,waybillNumber:number});
});
router.post('/ops/waybills/:id/payment',requireAuth,requirePermission('finance.manage'),async (req, res) => {
  const w=await db.prepare('SELECT * FROM waybills WHERE id=?').get(req.params.id);
  if(!w)return res.status(404).json({error:'Waybill not found.'});
  const providerRef=String(req.body?.providerReference||'').trim();
  if(w.payment_status==='successful')return res.status(409).json({error:'Payment was already reconciled.'});
  if(!providerRef||req.body?.verified!==true)return res.status(400).json({error:'Verify the payment using the provider reference before confirming.'});
  const paymentId=id(),paymentRef=ref('PAY');
  const record=db.transaction(async () => {
    await db.prepare("UPDATE waybills SET payment_status='successful',status=CASE WHEN status='awaiting_payment' THEN 'paid' ELSE status END,updated_at=now() WHERE id=?").run(w.id);
    await db.prepare("INSERT INTO payments (id,reference,user_id,waybill_id,amount,provider,provider_ref,status) VALUES (?,?,?,?,?,? ,?,'successful')").run(paymentId,paymentRef,w.customer_id,w.id,w.fee,'manual_reconciliation',providerRef);
    await db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`LED-${paymentRef}`,'waybill_payment',w.fee,w.id,'waybill',`Reconciled payment ${providerRef}`);
    if(w.status==='awaiting_payment')await db.prepare('INSERT INTO waybill_tracking_events (id,waybill_id,status,location,notes) VALUES (?,?,?,?,?)').run(id(),w.id,'paid',w.destination_city,'Payment manually reconciled by finance');
  });
  await record();if(w.customer_id)await notify(w.customer_id,'Waybill payment confirmed',`Payment for ${w.reference} has been reconciled.`,'payment',w.id);
  await audit(req.user,'waybill.payment_reconciled','waybill',w.id,{payment_status:w.payment_status},{payment_status:'successful',providerRef},'Provider transaction verified',req.ip);
  res.json({status:'successful',paymentReference:paymentRef});
});
router.get('/ops/waybills/:id/label',requireAuth,requirePermission('waybills.manage'),async (req, res) => {
  const w=await db.prepare('SELECT reference,waybill_number,sender_name,sender_phone,recipient_name,recipient_phone,origin,destination,destination_city,item_desc,weight,status FROM waybills WHERE id=?').get(req.params.id);
  if(!w)return res.status(404).json({error:'Waybill not found.'});
  if(!w.waybill_number)return res.status(409).json({error:'Process the waybill to create a waybill number first.'});
  res.json({label:w,trackingUrl:`/track?ref=${encodeURIComponent(w.waybill_number)}`,barcodeValue:w.waybill_number});
});

router.get('/ops/investors',requireAuth,requirePermission('investments.read'),async (req, res) => {
  const rows=await db.prepare(`SELECT i.user_id,i.address,i.id_type,i.verification_status,u.email,u.phone,u.status account_status,p.full_name,
    (SELECT COUNT(*) FROM investor_documents d WHERE d.investor_id=i.user_id) document_count FROM investors i JOIN users u ON u.id=i.user_id JOIN profiles p ON p.user_id=u.id ORDER BY i.created_at DESC`).all();
  res.json({investors:rows});
});
router.get('/ops/investors/:id/documents',requireAuth,requirePermission('investments.read'),async (req, res) => {
  const i=await db.prepare('SELECT user_id FROM investors WHERE user_id=?').get(req.params.id);if(!i)return res.status(404).json({error:'Investor not found.'});res.json({documents:await db.prepare('SELECT id,doc_type,status,created_at FROM investor_documents WHERE investor_id=? ORDER BY created_at DESC').all(i.user_id)});
});
router.post('/ops/investors/:id/documents/:docId/status',requireAuth,requirePermission('investments.manage'),async (req, res) => {
  const status=String(req.body?.status||'');if(!['approved','rejected'].includes(status))return res.status(400).json({error:'Choose approved or rejected.'});
  const doc=await db.prepare('SELECT * FROM investor_documents WHERE id=? AND investor_id=?').get(req.params.docId,req.params.id);if(!doc)return res.status(404).json({error:'Document not found.'});
  await db.prepare('UPDATE investor_documents SET status=? WHERE id=?').run(status,doc.id);await audit(req.user,`investor.document_${status}`,'investor_document',doc.id,{status:doc.status},{status},String(req.body?.reason||''),req.ip);res.json({status});
});
router.post('/ops/investors/:id/decision',requireAuth,requirePermission('investments.manage'),async (req, res) => {
  const status=String(req.body?.status||''),reason=String(req.body?.reason||'').trim();if(!['approved','rejected'].includes(status))return res.status(400).json({error:'Choose approved or rejected.'});
  const investor=await db.prepare('SELECT * FROM investors WHERE user_id=?').get(req.params.id);if(!investor)return res.status(404).json({error:'Investor not found.'});
  if(status==='approved'&&!(await db.prepare("SELECT id FROM investor_documents WHERE investor_id=? AND status='approved' LIMIT 1").get(req.params.id)))return res.status(409).json({error:'Review and approve an identity document before approving this investor.'});
  const update=db.transaction(async () => {
    await db.prepare('UPDATE investors SET verification_status=? WHERE user_id=?').run(status,investor.user_id);
    await db.prepare("UPDATE users SET status=?,updated_at=now() WHERE id=?").run(status==='approved'?'active':'rejected',investor.user_id);
    if(status!=='approved')await revokeAllSessions(investor.user_id);
  });
  await update();
  await notify(investor.user_id,`Investor verification ${status}`,reason||`Your investor verification is ${status}.`,'account');
  await audit(req.user,`investor.verification_${status}`,'investor',investor.user_id,{status:investor.verification_status},{status},reason,req.ip);res.json({status});
});

router.get('/ops/admin-users',requireAuth,requireRole('super_admin'),async (_req,res)=>{
  const admins=await db.prepare(`SELECT u.id,u.email,u.phone,u.role,u.status,u.created_at,p.full_name,r.description role_label
    FROM public.users u LEFT JOIN public.profiles p ON p.user_id=u.id LEFT JOIN public.roles r ON r.id=u.role
    WHERE u.role IN (${adminRoleSlots}) AND u.status<>'pending_verification' ORDER BY u.created_at DESC LIMIT 200`).all(...ADMIN_ROLE_IDS);
  const invitations=await db.prepare(`SELECT i.id,i.email,i.full_name,i.role,i.status,i.created_at,i.updated_at,i.last_sent_at,
    (SELECT MAX(t.expires_at) FROM public.admin_invitation_tokens t WHERE t.invitation_id=i.id AND t.used_at IS NULL AND t.revoked_at IS NULL) expires_at,
    p.full_name invited_by_name
    FROM public.admin_invitations i LEFT JOIN public.profiles p ON p.user_id=i.invited_by
    WHERE i.status IN ('pending','delivery_failed') ORDER BY i.created_at DESC LIMIT 100`).all();
  res.json({admins,invitations});
});

router.get('/ops/admin-roles',requireAuth,requireRole('super_admin'),async (_req,res)=>{
  const [roles,permissions,grants]=await Promise.all([
    db.prepare(`SELECT id,name,description FROM public.roles WHERE id IN (${adminRoleSlots}) ORDER BY CASE id WHEN 'super_admin' THEN 0 ELSE 1 END,name`).all(...ADMIN_ROLE_IDS),
    db.prepare('SELECT key,description FROM public.permissions ORDER BY key').all(),
    db.prepare(`SELECT rp.role_id,p.key FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id WHERE rp.role_id IN (${adminRoleSlots}) ORDER BY p.key`).all(...ADMIN_ROLE_IDS),
  ]);
  res.json({roles:roles.map(role=>({...role,permissions:grants.filter(grant=>grant.role_id===role.id).map(grant=>grant.key)})),permissions});
});

router.put('/ops/admin-roles/:role/permissions',requireAuth,requireRole('super_admin'),async (req,res)=>{
  const role=String(req.params.role||''),raw=req.body?.permissionKeys;
  if(!ADMIN_ROLE_IDS.includes(role)||role==='super_admin')return res.status(400).json({error:'Choose an editable administrative position. Super Administrator access is fixed.'});
  if(!Array.isArray(raw)||raw.length>100)return res.status(400).json({error:'Provide a valid permission list.'});
  const permissionKeys=[...new Set(raw.map(value=>String(value||'').trim()).filter(Boolean))];
  if(permissionKeys.includes('admin.manage'))return res.status(400).json({error:'Administrator and role management stays exclusive to Super Administrators.'});
  const missingDependency=missingPermissionDependencies(permissionKeys)[0];
  if(missingDependency)return res.status(400).json({error:`${missingDependency.permission} requires ${missingDependency.dependency}.`});
  const catalog=await db.prepare('SELECT id,key FROM public.permissions').all(),catalogByKey=new Map(catalog.map(item=>[item.key,item.id]));
  if(permissionKeys.some(key=>!catalogByKey.has(key)))return res.status(400).json({error:'The permission list contains an unsupported capability.'});
  const previous=(await db.prepare(`SELECT p.key FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id WHERE rp.role_id=? ORDER BY p.key`).all(role)).map(row=>row.key);
  const savePermissions=db.transaction(async()=>{
    await db.prepare('DELETE FROM public.role_permissions WHERE role_id=?').run(role);
    for(const key of permissionKeys)await db.prepare('INSERT INTO public.role_permissions(role_id,permission_id) VALUES (?,?)').run(role,catalogByKey.get(key));
    await audit(req.user,'admin.role_permissions_updated','role',role,{permissions:previous},{permissions:[...permissionKeys].sort()},'Super Administrator updated the access matrix.',req.ip);
  });
  await savePermissions();
  res.json({role,permissions:[...permissionKeys].sort(),message:'Role permissions updated.'});
});

router.post('/ops/admin-users',requireAuth,requireRole('super_admin'),async (req,res)=>{
  const fullName=String(req.body?.fullName||'').trim(),email=String(req.body?.email||'').trim().toLowerCase(),role=String(req.body?.role||req.body?.position||'');
  if(fullName.length<2||fullName.length>100||!/^\S+@\S+\.\S+$/.test(email)||email.length>180)return res.status(400).json({error:'Enter a valid full name and email address.'});
  if(!ADMIN_ROLE_IDS.includes(role))return res.status(400).json({error:'Choose a supported administrative position.'});
  if(!isEmailConfigured())return res.status(503).json({error:'Admin invitation email is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL and APP_URL before inviting administrators.'});
  let inviteOrigin;try{inviteOrigin=adminInvitationOrigin();}catch{return res.status(503).json({error:'APP_URL must be a valid public HTTPS origin before sending administrator invitations.'});}
  if(await db.prepare('SELECT id FROM public.users WHERE lower(email)=?').get(email))return res.status(409).json({error:'An account already exists for this email address.'});
  let provisioned;
  try{provisioned=await createSupabasePendingAdmin({email,fullName,role});}
  catch(error){return res.status(error?.status||409).json({error:error?.status?error.message:'Unable to prepare this invitation.'});}
  const invitationId=id(),tokenId=id(),expiresAt=new Date(Date.now()+60*60*1000).toISOString();
  const tokenDigest=crypto.createHash('sha256').update(provisioned.token).digest('hex');
  try{
    const saveInvitation=db.transaction(async()=>{
      await db.prepare(`INSERT INTO public.users(id,email,phone,role,status,email_verified) VALUES (?,?,NULL,?,'pending_verification',0)`).run(provisioned.user.id,email,role);
      await db.prepare('INSERT INTO public.profiles(user_id,full_name) VALUES (?,?)').run(provisioned.user.id,fullName);
      await db.prepare(`INSERT INTO public.admin_invitations(id,email,full_name,role,auth_user_id,invited_by,status)
        VALUES (?,?,?,?,?,?,'pending')`).run(invitationId,email,fullName,role,provisioned.user.id,req.user.id);
      await db.prepare('INSERT INTO public.admin_invitation_tokens(id,invitation_id,token_digest,expires_at) VALUES (?,?,?,?)').run(tokenId,invitationId,tokenDigest,expiresAt);
      await audit(req.user,'admin.invitation_created','admin_invitation',invitationId,null,{email,fullName,role,status:'pending'},null,req.ip);
    });
    await saveInvitation();
  }catch(error){
    try{await getSupabaseAdmin().auth.admin.deleteUser(provisioned.user.id);}catch{}
    if(error?.status)return res.status(error.status).json({error:error.message});
    return res.status(409).json({error:'The administrator invitation could not be saved.'});
  }
  const inviteLink=adminInvitationUrl(inviteOrigin,{id:invitationId,email,role,token:provisioned.token});
  try{
    await sendEmail({to:email,...createAdminInviteEmailTemplate({name:fullName,email,role,actionUrl:inviteLink}),idempotencyKey:`admin-invite-${invitationId}-${tokenDigest.slice(0,16)}`});
    await db.prepare("UPDATE public.admin_invitations SET status='pending',last_sent_at=now(),updated_at=now() WHERE id=?").run(invitationId);
    await audit(req.user,'admin.invitation_sent','admin_invitation',invitationId,{status:'pending'},{email,role,delivery:'sent'},null,req.ip);
    res.status(201).json({id:invitationId,email,role,status:'pending',emailSent:true,message:`Invitation sent to ${email}.`});
  }catch(error){
    await db.prepare("UPDATE public.admin_invitations SET status='delivery_failed',updated_at=now() WHERE id=?").run(invitationId);
    await audit(req.user,'admin.invitation_delivery_failed','admin_invitation',invitationId,{status:'pending'},{email,role,delivery:'failed'},'Email provider rejected or did not confirm delivery.',req.ip);
    logger.warn('admin.invitation_email_failed',{requestId:req.requestId,invitationId,status:error?.status||502});
    res.status(202).json({id:invitationId,email,role,status:'delivery_failed',emailSent:false,message:'The invitation is saved, but the email did not send. Use Resend invitation to try again.'});
  }
});

router.post('/ops/admin-invitations/:id/resend',requireAuth,requireRole('super_admin'),async (req,res)=>{
  if(!isEmailConfigured())return res.status(503).json({error:'Admin invitation email is not configured.'});
  let inviteOrigin;try{inviteOrigin=adminInvitationOrigin();}catch{return res.status(503).json({error:'APP_URL must be a valid public HTTPS origin before sending administrator invitations.'});}
  const invite=await db.prepare(`SELECT id,email,full_name,role,status,auth_user_id FROM public.admin_invitations
    WHERE id=? AND status IN ('pending','delivery_failed')`).get(req.params.id);
  if(!invite)return res.status(404).json({error:'A pending invitation was not found.'});
  const user=await db.prepare('SELECT status,role FROM public.users WHERE id=?').get(invite.auth_user_id);
  if(!user||user.status!=='pending_verification'||user.role!==invite.role)return res.status(409).json({error:'This invitation is no longer available.'});
  let token;
  try{token=await sendSupabaseRecovery(invite.email);}catch(error){return res.status(error?.status||503).json({error:'A fresh secure invite could not be created. Try again shortly.'});}
  const tokenId=id(),tokenDigest=crypto.createHash('sha256').update(token).digest('hex'),expiresAt=new Date(Date.now()+60*60*1000).toISOString();
  const saveResentToken=db.transaction(async()=>{
    await db.prepare('UPDATE public.admin_invitation_tokens SET revoked_at=now() WHERE invitation_id=? AND used_at IS NULL AND revoked_at IS NULL').run(invite.id);
    await db.prepare('INSERT INTO public.admin_invitation_tokens(id,invitation_id,token_digest,expires_at) VALUES (?,?,?,?)').run(tokenId,invite.id,tokenDigest,expiresAt);
    await audit(req.user,'admin.invitation_resent','admin_invitation',invite.id,{status:invite.status},{email:invite.email,role:invite.role,delivery:'pending'},null,req.ip);
  });
  await saveResentToken();
  try{
    await sendEmail({to:invite.email,...createAdminInviteEmailTemplate({name:invite.full_name,email:invite.email,role:invite.role,actionUrl:adminInvitationUrl(inviteOrigin,{id:invite.id,email:invite.email,role:invite.role,token})}),idempotencyKey:`admin-invite-${invite.id}-${tokenDigest.slice(0,16)}`});
    await db.prepare("UPDATE public.admin_invitations SET status='pending',last_sent_at=now(),updated_at=now() WHERE id=?").run(invite.id);
    await audit(req.user,'admin.invitation_sent','admin_invitation',invite.id,{status:invite.status},{email:invite.email,role:invite.role,delivery:'sent'},null,req.ip);
    res.json({id:invite.id,email:invite.email,status:'pending',message:`A fresh invitation was sent to ${invite.email}.`});
  }catch(error){
    await db.prepare("UPDATE public.admin_invitations SET status='delivery_failed',updated_at=now() WHERE id=?").run(invite.id);
    await audit(req.user,'admin.invitation_delivery_failed','admin_invitation',invite.id,{status:invite.status},{email:invite.email,role:invite.role,delivery:'failed'},'Email provider rejected or did not confirm delivery.',req.ip);
    logger.warn('admin.invitation_resend_failed',{requestId:req.requestId,invitationId:invite.id,status:error?.status||502});
    res.status(202).json({id:invite.id,email:invite.email,status:'delivery_failed',message:'The invitation remains pending, but email was not confirmed. Resend it again when ready.'});
  }
});

router.patch('/ops/admin-users/:userId/role',requireAuth,requireRole('super_admin'),async(req,res)=>{
  const role=String(req.body?.role||'');
  if(!ADMIN_ROLE_IDS.includes(role))return res.status(400).json({error:'Choose a supported administrative role.'});
  const target=await db.prepare('SELECT u.id,u.email,u.role,u.status,p.full_name FROM public.users u LEFT JOIN public.profiles p ON p.user_id=u.id WHERE u.id=? AND u.role IN ('+adminRoleSlots+')').get(req.params.userId,...ADMIN_ROLE_IDS);
  if(!target)return res.status(404).json({error:'Administrator not found.'});
  if(target.status!=='active')return res.status(409).json({error:'Only active administrators can change roles. Resend or complete their invitation first.'});
  if(target.role===role)return res.json({id:target.id,role,message:'That administrator already has this position.'});
  if(target.id===req.user.id)return res.status(400).json({error:'You cannot change your own administrator role.'});
  if(target.role==='super_admin'&&role!=='super_admin'){
    const activeCount=Number((await db.prepare("SELECT COUNT(*) total FROM public.users WHERE role='super_admin' AND status='active'").get())?.total||0);
    if(activeCount<=1)return res.status(409).json({error:'At least one active Super Administrator must remain.'});
  }
  const admin=getSupabaseAdmin(),authResult=await admin.auth.admin.getUserById(target.id);
  if(authResult.error||!authResult.data?.user)return res.status(503).json({error:'The administrator identity service is temporarily unavailable.'});
  const oldMetadata=authResult.data.user.app_metadata||{},newMetadata={...oldMetadata,role,status:target.status,session_version:crypto.randomUUID()};
  const {error:updateError}=await admin.auth.admin.updateUserById(target.id,{app_metadata:newMetadata});
  if(updateError)return res.status(503).json({error:'The administrator role could not be synchronized with sign-in.'});
  try{
    const updateRole=db.transaction(async()=>{
      if(target.role==='super_admin'||role==='super_admin'){
        const activeSuperAdmins=await db.prepare("SELECT id FROM public.users WHERE role='super_admin' AND status='active' ORDER BY id FOR UPDATE").all();
        if(target.role==='super_admin'&&role!=='super_admin'&&activeSuperAdmins.length<=1)throw Object.assign(new Error('At least one active Super Administrator must remain.'),{status:409});
      }
      const locked=await db.prepare('SELECT role,status FROM public.users WHERE id=? FOR UPDATE').get(target.id);
      if(!locked||locked.role!==target.role||locked.status!=='active')throw Object.assign(new Error('The administrator changed while this update was in progress. Refresh and retry.'),{status:409});
      await db.prepare('UPDATE public.users SET role=?,updated_at=now() WHERE id=?').run(role,target.id);
      await audit(req.user,'admin.role_changed','user',target.id,{role:target.role},{role},'Administrator role updated by Super Administrator.',req.ip);
    });
    await updateRole();
  }catch(error){
    try{
      const current=await db.prepare('SELECT role,status FROM public.users WHERE id=?').get(target.id);
      const latest=await admin.auth.admin.getUserById(target.id),latestMetadata=latest.data?.user?.app_metadata||{};
      if(!latest.error&&latestMetadata.session_version===newMetadata.session_version){
        await admin.auth.admin.updateUserById(target.id,{app_metadata:{...latestMetadata,role:current?.role||target.role,status:current?.status||target.status,session_version:crypto.randomUUID()}});
      }
    }catch{}
    return res.status(error?.status||409).json({error:error?.status?error.message:'The administrator role could not be saved.'});
  }
  res.json({id:target.id,role,roleLabel:ADMIN_ROLE_LABELS[role],message:'Administrator role updated. Their active sessions were signed out.'});
});

router.get('/ops/rider-agreement',requireAuth,requirePermission('settings.manage'),async (_req, res) => {
  const version=(await db.prepare("SELECT value FROM system_settings WHERE key='current_rider_agreement_version'").get())?.value||'';
  const text=(await db.prepare("SELECT value FROM system_settings WHERE key='current_rider_agreement_text'").get())?.value||'';
  res.json({version,text});
});
router.post('/ops/rider-agreement',requireAuth,requirePermission('settings.manage'),async (req, res) => {
  const version=String(req.body?.version||'').trim(),text=String(req.body?.text||'').trim();
  if(!/^[A-Za-z0-9._-]{1,40}$/.test(version)||text.length<100||text.length>10000)return res.status(400).json({error:'Provide a short agreement version and at least 100 characters of approved rider agreement text.'});
  const before=(await db.prepare("SELECT value FROM system_settings WHERE key='current_rider_agreement_version'").get())?.value||'';
  const save=db.transaction(async () => {
    await db.prepare("INSERT INTO system_settings (key,value,updated_at) VALUES ('current_rider_agreement_version',?,now()) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(version);
    await db.prepare("INSERT INTO system_settings (key,value,updated_at) VALUES ('current_rider_agreement_text',?,now()) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(text);
  });await save();
  if(before&&before!==version){for(const r of await db.prepare("SELECT user_id FROM riders WHERE approval_status='approved'").all())await notify(r.user_id,'Rider agreement updated','Review and accept the current agreement before going online or accepting new jobs.','account');}
  await audit(req.user,'rider_agreement.updated','system_settings','rider_agreement',{version:before},{version},'Current rider agreement published',req.ip);res.json({version});
});

export default router;
