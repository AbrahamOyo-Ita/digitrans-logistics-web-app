import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requireRole, requirePermission, notify, audit, revokeAllSessions } from '../auth.js';
import { calculateRiderEarnings } from '../pricing.js';

const router=Router();
const riderOnly=requireRole('rider');
const id=()=>crypto.randomUUID();
const ref=p=>`${p}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
const adminRoles=['super_admin','ops_officer','rider_manager'];
const currentAgreement=()=>db.prepare("SELECT value FROM system_settings WHERE key='current_rider_agreement_version'").get()?.value || '';
function riderBalances(riderId){
  const rows=db.prepare(`SELECT e.id,e.rider_earnings,
    COALESCE((SELECT SUM(si.amount) FROM rider_settlement_items si JOIN rider_settlements s ON s.id=si.settlement_id WHERE si.earnings_id=e.id AND s.status IN ('pending','approved','paid')),0) settled,
    COALESCE((SELECT SUM(wi.amount) FROM rider_withdrawal_items wi JOIN withdrawal_requests w ON w.id=wi.withdrawal_id WHERE wi.earnings_id=e.id AND w.status IN ('requested','under_review','approved','processing','paid')),0) withdrawn
    FROM rider_earnings e WHERE e.rider_id=? ORDER BY e.created_at,e.id`).all(riderId);
  return rows.reduce((b,e)=>{const remaining=Math.max(0,e.rider_earnings-e.settled-e.withdrawn);b.available+=remaining;b.outstanding+=remaining+e.settled+e.withdrawn;return b;},{available:0,outstanding:0});
}
function availableEarnings(riderId,cutoff='9999-12-31'){
  return db.prepare(`SELECT e.id,e.rider_earnings,
    COALESCE((SELECT SUM(si.amount) FROM rider_settlement_items si JOIN rider_settlements s ON s.id=si.settlement_id WHERE si.earnings_id=e.id AND s.status IN ('pending','approved','paid')),0) settled,
    COALESCE((SELECT SUM(wi.amount) FROM rider_withdrawal_items wi JOIN withdrawal_requests w ON w.id=wi.withdrawal_id WHERE wi.earnings_id=e.id AND w.status IN ('requested','under_review','approved','processing','paid')),0) withdrawn
    FROM rider_earnings e WHERE e.rider_id=? AND date(e.created_at)<=date(?) ORDER BY e.created_at,e.id`).all(riderId,cutoff).map(e=>({...e,available:Math.max(0,e.rider_earnings-e.settled-e.withdrawn)})).filter(e=>e.available>0);
}

router.get('/rider/dashboard',requireAuth,riderOnly,(req,res)=>{
  const rider=db.prepare('SELECT * FROM riders WHERE user_id=?').get(req.user.id);
  const profile=db.prepare('SELECT full_name FROM profiles WHERE user_id=?').get(req.user.id);
  const active=db.prepare(`SELECT COUNT(*) n FROM delivery_assignments da JOIN deliveries d ON d.id=da.delivery_id WHERE da.rider_id=? AND da.status IN ('assigned','accepted') AND d.status NOT IN ('delivered','cancelled','delivery_failed','returned')`).get(req.user.id).n;
  const completed=db.prepare("SELECT COUNT(*) n FROM rider_earnings WHERE rider_id=?").get(req.user.id).n;
  const earnings=db.prepare('SELECT COALESCE(SUM(rider_earnings),0) total FROM rider_earnings WHERE rider_id=?').get(req.user.id).total;
  const balances=riderBalances(req.user.id);
  const pending=db.prepare("SELECT COALESCE(SUM(amount),0) total FROM rider_settlement_items si JOIN rider_settlements s ON s.id=si.settlement_id WHERE si.rider_id=? AND s.status IN ('pending','approved')").get(req.user.id).total;
  const jobs=db.prepare(`SELECT d.id,d.reference,d.pickup_address,d.dropoff_address,d.recipient_name,d.recipient_phone,d.package_category,d.package_desc,d.instructions,d.status,d.fee,d.timing,d.scheduled_at,da.status assignment_status,da.created_at assigned_at
    FROM deliveries d JOIN delivery_assignments da ON da.delivery_id=d.id WHERE da.rider_id=? AND da.status IN ('assigned','accepted') AND d.status NOT IN ('delivered','cancelled','delivery_failed','returned') ORDER BY da.created_at DESC`).all(req.user.id);
  const version=currentAgreement(),agreementText=db.prepare("SELECT value FROM system_settings WHERE key='current_rider_agreement_text'").get()?.value||'';
  res.json({profile:{...profile,...rider,bank_name:undefined,bank_account_name:undefined,bank_account_number:undefined},stats:{active,completed,earnings,pending,availableBalance:balances.available,unsettled:balances.outstanding},jobs,currentAgreement:version,agreementText,agreementAccepted:!!version&&!!db.prepare('SELECT 1 FROM rider_agreements WHERE rider_id=? AND version=?').get(req.user.id,version)});
});

router.get('/rider/profile',requireAuth,riderOnly,(req,res)=>{
  const profile=db.prepare('SELECT full_name,address,dob,emergency_contact FROM profiles WHERE user_id=?').get(req.user.id);
  const rider=db.prepare('SELECT vehicle_type,vehicle_reg,vehicle_desc,availability,approval_status,rejection_reason FROM riders WHERE user_id=?').get(req.user.id);
  const guarantor=db.prepare('SELECT full_name,phone,address,relationship FROM rider_guarantors WHERE rider_id=? ORDER BY rowid DESC LIMIT 1').get(req.user.id);
  res.json({profile,rider,guarantor});
});

router.patch('/rider/profile',requireAuth,riderOnly,(req,res)=>{
  const d=req.body||{}, fullName=String(d.fullName||'').trim(), phone=String(d.phone||'').trim();
  if(fullName.length<2||phone.length<7)return res.status(400).json({error:'Enter your legal name and a valid phone number.'});
  const vehicleType=String(d.vehicleType||'').trim();
  if(!['bicycle','electric_bicycle','motorcycle','partner'].includes(vehicleType))return res.status(400).json({error:'Choose a supported vehicle type.'});
  const update=db.transaction(()=>{
    db.prepare('UPDATE profiles SET full_name=?,address=?,dob=?,emergency_contact=?,updated_at=datetime(\'now\') WHERE user_id=?').run(fullName,String(d.address||'').trim(),d.dob||null,String(d.emergencyContact||'').trim(),req.user.id);
    db.prepare('UPDATE users SET phone=?,updated_at=datetime(\'now\') WHERE id=?').run(phone,req.user.id);
    db.prepare('UPDATE riders SET vehicle_type=?,vehicle_reg=?,vehicle_desc=?,bank_name=?,bank_account_name=?,bank_account_number=? WHERE user_id=?').run(vehicleType,String(d.vehicleReg||'').trim(),String(d.vehicleDescription||'').trim(),String(d.bankName||'').trim(),String(d.bankAccountName||'').trim(),String(d.bankAccountNumber||'').trim(),req.user.id);
    if(d.guarantorName&&d.guarantorPhone)db.prepare('INSERT INTO rider_guarantors (id,rider_id,full_name,phone,address,relationship) VALUES (?,?,?,?,?,?)').run(id(),req.user.id,String(d.guarantorName).trim(),String(d.guarantorPhone).trim(),String(d.guarantorAddress||'').trim(),String(d.guarantorRelationship||'').trim());
  });
  try{update();}catch(e){return res.status(400).json({error:e.message.includes('UNIQUE')?'This phone number is already registered.':'Unable to save your rider profile.'});}
  res.json({message:'Rider profile saved. Your information is under review.'});
});

router.post('/rider/agreement',requireAuth,riderOnly,(req,res)=>{
  const version=currentAgreement(),agreementText=db.prepare("SELECT value FROM system_settings WHERE key='current_rider_agreement_text'").get()?.value||'';
  if(!version||!agreementText)return res.status(503).json({error:'The current rider agreement has not been configured by DigiTrans operations.'});
  if(req.body?.accepted!==true)return res.status(400).json({error:'Confirm that you have read and accept the rider agreement.'});
  const existing=db.prepare('SELECT id FROM rider_agreements WHERE rider_id=? AND version=?').get(req.user.id,version);
  if(existing)return res.json({message:'The current agreement has already been accepted.',version});
  db.prepare('INSERT INTO rider_agreements (id,rider_id,version,ip,session_ref,doc_ref) VALUES (?,?,?,?,?,?)').run(id(),req.user.id,version,req.ip,req.user.sessionId,`rider-agreement-${version}`);
  audit(req.user,'rider.agreement_accepted','rider',req.user.id,null,{version},null,req.ip);
  res.status(201).json({message:'Agreement acceptance recorded.',version});
});

router.post('/rider/availability',requireAuth,riderOnly,(req,res)=>{
  const availability=String(req.body?.availability||'');
  if(!['available','unavailable'].includes(availability))return res.status(400).json({error:'Choose available or unavailable.'});
  const r=db.prepare('SELECT approval_status FROM riders WHERE user_id=?').get(req.user.id);
  if(r?.approval_status!=='approved')return res.status(403).json({error:'Your rider profile must be approved before you can change availability.'});
  if(!db.prepare('SELECT id FROM rider_agreements WHERE rider_id=? AND version=?').get(req.user.id,currentAgreement()))return res.status(403).json({error:'Accept the current rider agreement before going online.'});
  db.prepare('UPDATE riders SET availability=? WHERE user_id=?').run(availability,req.user.id);
  res.json({availability});
});

router.get('/rider/history',requireAuth,riderOnly,(req,res)=>{
  const deliveries=db.prepare(`SELECT d.id,d.reference,d.pickup_address,d.dropoff_address,d.status,d.fee,d.created_at,d.updated_at,e.rider_earnings,e.settlement_status,e.reference earnings_reference
    FROM deliveries d JOIN delivery_assignments da ON da.delivery_id=d.id LEFT JOIN rider_earnings e ON e.delivery_id=d.id WHERE da.rider_id=? ORDER BY d.created_at DESC LIMIT 100`).all(req.user.id);
  const settlements=db.prepare('SELECT id,settlement_date,total_payable,status,payout_reference,created_at FROM rider_settlements WHERE id IN (SELECT settlement_id FROM rider_settlement_items WHERE rider_id=?) ORDER BY created_at DESC').all(req.user.id);
  const withdrawals=db.prepare('SELECT id,amount,status,reference,created_at FROM withdrawal_requests WHERE rider_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json({deliveries,settlements,withdrawals,availableBalance:riderBalances(req.user.id).available});
});

router.post('/rider/withdrawals',requireAuth,riderOnly,(req,res)=>{
  const amount=Math.round(Number(req.body?.amount||0));
  if(!Number.isSafeInteger(amount)||amount<1000)return res.status(400).json({error:'Withdrawal requests must be at least ₦1,000.'});
  const balance=availableEarnings(req.user.id).reduce((sum,e)=>sum+e.available,0);
  if(amount>balance)return res.status(400).json({error:'This amount exceeds your available balance.'});
  const r=db.prepare('SELECT bank_name,bank_account_number FROM riders WHERE user_id=?').get(req.user.id);
  if(!r?.bank_name||!r?.bank_account_number)return res.status(400).json({error:'Add verified bank details to your profile before requesting a withdrawal.'});
  const idd=id(),reference=ref('RW');
  const request=db.transaction(()=>{
    db.prepare('INSERT INTO withdrawal_requests (id,rider_id,amount,destination_account,reference) VALUES (?,?,?,?,?)').run(idd,req.user.id,amount,`${r.bank_name} ••••${r.bank_account_number.slice(-4)}`,reference);
    let remaining=amount;
    for(const earning of availableEarnings(req.user.id)){
      if(remaining<=0)break;
      const allocation=Math.min(remaining,earning.available);
      db.prepare('INSERT INTO rider_withdrawal_items (withdrawal_id,earnings_id,amount) VALUES (?,?,?)').run(idd,earning.id,allocation);
      remaining-=allocation;
    }
    if(remaining>0)throw new Error('Balance changed. Refresh and try again.');
  });
  try{request();}catch(e){return res.status(409).json({error:e.message||'Unable to reserve the requested balance.'});}
  audit(req.user,'rider.withdrawal_requested','withdrawal',idd,null,{amount,reference},null,req.ip);
  res.status(201).json({id:idd,reference,status:'requested',amount});
});

router.post('/rider/jobs/:deliveryId/accept',requireAuth,riderOnly,(req,res)=>{
  const rider=db.prepare('SELECT * FROM riders WHERE user_id=?').get(req.user.id);
  if(rider?.approval_status!=='approved'||rider?.availability==='suspended')return res.status(403).json({error:'Your rider account is not eligible for assignments.'});
  if(!db.prepare('SELECT id FROM rider_agreements WHERE rider_id=? AND version=?').get(req.user.id,currentAgreement()))return res.status(403).json({error:'Accept the current rider agreement before accepting jobs.'});
  const a=db.prepare(`SELECT da.*,d.status delivery_status,d.customer_id,d.vendor_id,d.reference FROM delivery_assignments da JOIN deliveries d ON d.id=da.delivery_id WHERE da.delivery_id=? AND da.rider_id=? AND da.status='assigned'`).get(req.params.deliveryId,req.user.id);
  if(!a)return res.status(404).json({error:'This assignment is no longer available.'});
  const update=db.transaction(()=>{
    db.prepare("UPDATE delivery_assignments SET status='accepted' WHERE id=?").run(a.id);
    db.prepare("UPDATE deliveries SET status='rider_accepted',updated_at=datetime('now') WHERE id=? AND status='assigned'").run(req.params.deliveryId);
    db.prepare('INSERT INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)').run(id(),req.params.deliveryId,a.delivery_status,'rider_accepted',req.user.id,'rider','Rider accepted assignment');
  });
  update();
  if(a.customer_id)notify(a.customer_id,'Rider accepted your delivery',`A rider accepted delivery ${a.reference}.`,'delivery',req.params.deliveryId);
  res.json({message:'Assignment accepted.',status:'rider_accepted'});
});

router.post('/rider/jobs/:deliveryId/reject',requireAuth,riderOnly,(req,res)=>{
  const a=db.prepare(`SELECT da.*,d.status delivery_status,d.customer_id,d.reference FROM delivery_assignments da JOIN deliveries d ON d.id=da.delivery_id WHERE da.delivery_id=? AND da.rider_id=? AND da.status='assigned'`).get(req.params.deliveryId,req.user.id);
  if(!a)return res.status(404).json({error:'This assignment is no longer available.'});
  const reason=String(req.body?.reason||'').trim();
  if(reason.length<3)return res.status(400).json({error:'Add a short reason for declining this assignment.'});
  const reject=db.transaction(()=>{
    db.prepare("UPDATE delivery_assignments SET status='rejected',reason=? WHERE id=?").run(reason.slice(0,300),a.id);
    db.prepare("UPDATE deliveries SET status='awaiting_assignment',updated_at=datetime('now') WHERE id=?").run(req.params.deliveryId);
    db.prepare('INSERT INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)').run(id(),req.params.deliveryId,a.delivery_status,'awaiting_assignment',req.user.id,'rider',`Assignment declined: ${reason.slice(0,250)}`);
  });
  reject(); audit(req.user,'delivery.assignment_rejected','delivery',req.params.deliveryId,{rider:req.user.id},{status:'awaiting_assignment'},reason,req.ip);
  if(a.customer_id)notify(a.customer_id,'Delivery reassignment in progress',`We are finding a new rider for ${a.reference}.`,'delivery',req.params.deliveryId);
  res.json({message:'Assignment declined. Operations has been notified.'});
});

router.post('/rider/jobs/:deliveryId/proof',requireAuth,riderOnly,(req,res)=>{
  const authorized=db.prepare(`SELECT 1 FROM delivery_assignments WHERE delivery_id=? AND rider_id=? AND status IN ('accepted','assigned')`).get(req.params.deliveryId,req.user.id);
  if(!authorized)return res.status(404).json({error:'Delivery not found.'});
  const delivery=db.prepare('SELECT status FROM deliveries WHERE id=?').get(req.params.deliveryId);
  if(!delivery||!['arrived_at_destination','in_transit','out_for_delivery'].includes(delivery.status))return res.status(409).json({error:'Proof can only be recorded near the destination.'});
  const recipient=String(req.body?.recipientName||'').trim(), notes=String(req.body?.notes||'').trim();
  if(recipient.length<2)return res.status(400).json({error:'Enter the recipient name for proof of delivery.'});
  try{db.prepare('INSERT INTO delivery_proof (id,delivery_id,recipient_name,photo_path,notes,lat,lng) VALUES (?,?,?,?,?,?,?)').run(id(),req.params.deliveryId,recipient,req.body?.photoPath||null,notes.slice(0,500),req.body?.lat??null,req.body?.lng??null);}
  catch{return res.status(409).json({error:'Proof of delivery has already been submitted.'});}
  res.status(201).json({message:'Proof of delivery recorded.'});
});

const nextStatuses={
  rider_accepted:['rider_en_route_to_pickup'],
  rider_en_route_to_pickup:['arrived_at_pickup'],
  arrived_at_pickup:['package_collected'],
  package_collected:['in_transit'],
  in_transit:['arrived_at_destination'],
  arrived_at_destination:['delivered'],
  out_for_delivery:['delivered'],
};
router.post('/rider/jobs/:deliveryId/status',requireAuth,riderOnly,(req,res)=>{
  const d=db.prepare(`SELECT d.*,da.id assignment_id,da.status assignment_status FROM deliveries d JOIN delivery_assignments da ON da.delivery_id=d.id WHERE d.id=? AND da.rider_id=? AND da.status IN ('accepted','assigned')`).get(req.params.deliveryId,req.user.id);
  if(!d)return res.status(404).json({error:'Delivery not found.'});
  const next=String(req.body?.status||''), notes=String(req.body?.notes||'').trim().slice(0,500);
  const failed=next==='delivery_failed';
  if(failed){if(notes.length<4)return res.status(400).json({error:'Add a reason for the failed delivery.'});}
  else if(!(nextStatuses[d.status]||[]).includes(next))return res.status(409).json({error:`Cannot move a delivery from ${d.status.replaceAll('_',' ')} to ${next.replaceAll('_',' ')}.`});
  if(next==='delivered'&&!db.prepare('SELECT id FROM delivery_proof WHERE delivery_id=?').get(d.id))return res.status(409).json({error:'Submit proof of delivery before completing the delivery.'});
  const statusUpdate=db.transaction(()=>{
    db.prepare("UPDATE deliveries SET status=?,updated_at=datetime('now') WHERE id=?").run(next,d.id);
    db.prepare('INSERT INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,lat,lng,notes) VALUES (?,?,?,?,?,?,?,?,?)').run(id(),d.id,d.status,next,req.user.id,'rider',req.body?.lat??null,req.body?.lng??null,notes||null);
    if(next==='delivery_failed'){
      db.prepare("UPDATE delivery_assignments SET status='rejected',reason=? WHERE id=?").run(notes,d.assignment_id);
      db.prepare("UPDATE riders SET availability='available' WHERE user_id=?").run(req.user.id);
    }
    if(next==='delivered'){
      db.prepare("UPDATE delivery_assignments SET status='completed' WHERE id=?").run(d.assignment_id);
      db.prepare("UPDATE riders SET availability='available' WHERE user_id=?").run(req.user.id);
      const p=db.prepare('SELECT rider_commission_pct FROM pricing_versions WHERE id=?').get(d.pricing_version_id) || {rider_commission_pct:25};
      const earnings=calculateRiderEarnings(d.fee,p.rider_commission_pct);
      const earningRef=ref('EARN');
      db.prepare(`INSERT INTO rider_earnings (id,rider_id,delivery_id,eligible_fee,commission_pct,rider_earnings,digitrans_share,reference)
        VALUES (?,?,?,?,?,?,?,?)`).run(id(),req.user.id,d.id,d.fee,p.rider_commission_pct,earnings.riderEarnings,earnings.digitransShare,earningRef);
      db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`LED-${earningRef}`,'rider_earning',earnings.riderEarnings,d.id,'delivery',`Rider share for ${d.reference}`);
      db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`LED-${earningRef}-D`,'digitrans_share',earnings.digitransShare,d.id,'delivery',`DigiTrans share for ${d.reference}`);
    }
  });
  try{statusUpdate();}catch(e){console.error(e);return res.status(409).json({error:'Unable to record the update. Refresh and try again.'});}
  if(d.customer_id)notify(d.customer_id,next==='delivered'?'Delivery completed':'Delivery update',`Delivery ${d.reference}: ${next.replaceAll('_',' ')}.`,'delivery',d.id);
  audit(req.user,'delivery.status_changed','delivery',d.id,{status:d.status},{status:next},notes,req.ip);
  res.json({message:'Delivery progress updated.',status:next});
});

router.get('/rider/applications',requireAuth,requirePermission('riders.review'),(req,res)=>{
  const rows=db.prepare(`SELECT u.id,u.email,u.phone,u.status,u.created_at,p.full_name,p.address,r.vehicle_type,r.vehicle_reg,r.approval_status,r.rejection_reason,
    (SELECT COUNT(*) FROM rider_documents rd WHERE rd.rider_id=u.id) document_count,
    (SELECT COUNT(*) FROM rider_agreements ra WHERE ra.rider_id=u.id AND ra.version=?) agreement_current
    FROM users u JOIN profiles p ON p.user_id=u.id JOIN riders r ON r.user_id=u.id WHERE r.approval_status IN ('pending','rejected','suspended') ORDER BY u.created_at`).all(currentAgreement());
  res.json({riders:rows});
});

router.get('/rider/applications/:id/documents',requireAuth,requirePermission('riders.review'),(req,res)=>{
  const exists=db.prepare('SELECT id FROM riders WHERE user_id=?').get(req.params.id);if(!exists)return res.status(404).json({error:'Rider application not found.'});
  res.json({documents:db.prepare('SELECT id,doc_type,status,created_at FROM rider_documents WHERE rider_id=? ORDER BY created_at DESC').all(req.params.id)});
});
router.post('/rider/applications/:id/documents/:docId/status',requireAuth,requirePermission('riders.review'),(req,res)=>{
  const status=String(req.body?.status||'');if(!['approved','rejected'].includes(status))return res.status(400).json({error:'Choose approved or rejected.'});
  const doc=db.prepare('SELECT * FROM rider_documents WHERE id=? AND rider_id=?').get(req.params.docId,req.params.id);if(!doc)return res.status(404).json({error:'Document not found.'});
  db.prepare('UPDATE rider_documents SET status=? WHERE id=?').run(status,doc.id);audit(req.user,`rider.document_${status}`,'rider_document',doc.id,{status:doc.status},{status},String(req.body?.reason||''),req.ip);res.json({status});
});

router.post('/rider/applications/:id/decision',requireAuth,requirePermission('riders.review'),(req,res)=>{
  const status=String(req.body?.status||''), reason=String(req.body?.reason||'').trim();
  if(!['approved','rejected','suspended'].includes(status))return res.status(400).json({error:'Invalid rider decision.'});
  const r=db.prepare('SELECT * FROM riders WHERE user_id=?').get(req.params.id);
  if(!r)return res.status(404).json({error:'Rider application not found.'});
  if(status==='approved'){
    const profile=db.prepare('SELECT full_name,address FROM profiles WHERE user_id=?').get(req.params.id);
    const g=db.prepare('SELECT id FROM rider_guarantors WHERE rider_id=?').get(req.params.id);
    const identity=db.prepare("SELECT id FROM rider_documents WHERE rider_id=? AND status='approved' AND doc_type IN ('national_id','drivers_license','voter_id','passport') LIMIT 1").get(req.params.id);
    if(!profile?.full_name||!profile.address||!r.vehicle_type||!r.bank_name||!r.bank_account_name||!r.bank_account_number||!g||!identity||!currentAgreement()||!db.prepare('SELECT id FROM rider_agreements WHERE rider_id=? AND version=?').get(req.params.id,currentAgreement()))return res.status(409).json({error:'Complete personal details, bank information, guarantor, at least one approved identity document and current agreement before approving.'});
  }
  const accountStatus=status==='approved'?'active':status==='suspended'?'suspended':status==='rejected'?'rejected':'pending_verification';
  const update=db.transaction(()=>{
    db.prepare('UPDATE riders SET approval_status=?,rejection_reason=? WHERE user_id=?').run(status,reason||null,req.params.id);
    db.prepare('UPDATE users SET status=?,updated_at=datetime(\'now\') WHERE id=?').run(accountStatus,req.params.id);
    if(accountStatus!=='active')revokeAllSessions(req.params.id);
    db.prepare("UPDATE riders SET availability='unavailable' WHERE user_id=?").run(req.params.id);
  });
  update();
  notify(req.params.id,`Rider application ${status}`,reason||`Your rider application is ${status}.`,'account',req.params.id);
  audit(req.user,`rider.application_${status}`,'rider',req.params.id,{approval_status:r.approval_status},{approval_status:status},reason,req.ip);
  res.json({status,reason});
});

export default router;
