import {asyncRouter} from '../async-router.js';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requireRole, notify, audit, getSessionUser } from '../auth.js';
import { calculateDeliveryFee, calculateWaybillFee } from '../pricing.js';

const router=asyncRouter();
const ref = prefix => `${prefix}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
const ACTIVE_STATUSES = ['pending_confirmation','awaiting_assignment','assigned','rider_accepted','rider_en_route_to_pickup','arrived_at_pickup','package_collected','in_transit','arrived_at_destination','out_for_delivery'];

export async function createDelivery({ userId, role, body, actor, channel='app' }) {
  const pickup = String(body.pickupAddress || body.pickup || '').trim();
  const dropoff = String(body.dropoffAddress || body.dropoff || '').trim();
  const recipientName = String(body.recipientName || '').trim();
  const recipientPhone = String(body.recipientPhone || '').trim();
  const manualName = ['ops_officer','super_admin'].includes(role) ? String(body.customerName || '').trim() : null;
  const manualPhone = ['ops_officer','super_admin'].includes(role) ? String(body.customerPhone || '').trim() : null;
  if (['ops_officer','super_admin'].includes(role) && (manualName.length < 2 || manualPhone.length < 7)) throw Object.assign(new Error('Manual bookings require the customer name and phone number.'),{status:400});
  const timing = body.timing === 'scheduled' ? 'scheduled' : 'now';
  const scheduledAt = timing === 'scheduled' ? String(body.scheduledAt || '') : null;
  if (pickup.length < 4 || dropoff.length < 4 || recipientName.length < 2 || recipientPhone.length < 7) throw Object.assign(new Error('Add pickup, destination, recipient name and phone.'),{status:400});
  if (!['bicycle','electric_bicycle','motorcycle','partner'].includes(body.deliveryMethod || 'bicycle')) throw Object.assign(new Error('Choose a supported delivery method.'),{status:400});
  const scheduledMs=scheduledAt?Date.parse(scheduledAt):NaN;
  if (timing === 'scheduled' && (!scheduledAt || !Number.isFinite(scheduledMs) || scheduledMs < Date.now()+2*60*60*1000 || scheduledMs > Date.now()+7*24*60*60*1000)) throw Object.assign(new Error('Choose a delivery time between 2 hours and 7 days from now.'),{status:400});
  if (String(body.prohibitedAccepted) !== 'true') throw Object.assign(new Error('Confirm the prohibited items and packaging policy.'),{status:400});
  const category = String(body.packageCategory || 'general').slice(0,80);
  const description = String(body.packageDescription || '').trim().slice(0,500);
  if (!description) throw Object.assign(new Error('Describe the parcel.'),{status:400});
  const recipientValue = Number(body.declaredValue || 0);
  if (!Number.isFinite(recipientValue) || recipientValue < 0 || recipientValue > 100000000) throw Object.assign(new Error('Enter a valid declared value.'),{status:400});
  const riderService = role === 'vendor' ? await db.prepare('SELECT approval_status FROM vendors WHERE user_id=?').get(userId) : null;
  if (role === 'vendor' && riderService?.approval_status !== 'approved') throw Object.assign(new Error('Your business account must be approved before requesting deliveries.'),{status:403});
  const isStudent = role === 'student' && (async () => {
    const s = await db.prepare('SELECT verification_status,expires_at FROM student_profiles WHERE user_id=?').get(userId);
    return s?.verification_status === 'approved' && (!s.expires_at || new Date(s.expires_at) >= new Date());
  })();
  const isVendor = role === 'vendor';
  let price;
  try {
    price = await calculateDeliveryFee({ pickupLat:body.pickupLat, pickupLng:body.pickupLng, dropoffLat:body.dropoffLat, dropoffLng:body.dropoffLng, timing, isStudent, isVendor, zone:body.zone || 'Calabar Municipal' });
  } catch(e) { throw Object.assign(new Error(e.message),{status:400}); }
  const id = crypto.randomUUID(), reference = ref('DT');
  const vendorId = role === 'vendor' ? userId : null;
  const customerId = ['vendor','ops_officer','super_admin'].includes(role) ? null : userId;
  const create = db.transaction(async () => {
    await db.prepare(`INSERT INTO deliveries (id,reference,customer_id,vendor_id,manual_customer_name,manual_customer_phone,pickup_address,dropoff_address,pickup_lat,pickup_lng,dropoff_lat,dropoff_lng,recipient_name,recipient_phone,package_category,package_desc,declared_value,delivery_method,timing,scheduled_at,instructions,status,fee,pricing_version_id,distance_km,fee_breakdown,channel,created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id,reference,customerId,vendorId,manualName,manualPhone,pickup,dropoff,body.pickupLat ?? null,body.pickupLng ?? null,body.dropoffLat ?? null,body.dropoffLng ?? null,
      recipientName,recipientPhone,category,description,recipientValue,body.deliveryMethod || 'bicycle',timing,scheduledAt,body.instructions || null,
      timing === 'scheduled' ? 'pending_confirmation' : 'awaiting_assignment',price.fee,price.pricing.id,price.distanceKm,JSON.stringify(price.breakdown),channel,actor?.id || userId
    );
    await db.prepare('INSERT INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)')
      .run(crypto.randomUUID(),id,null,timing === 'scheduled' ? 'pending_confirmation' : 'awaiting_assignment',actor?.id || userId,actor?.role || role,'Booking created');
  });
  await create();
  if (customerId) await notify(customerId,'Delivery request received',`Reference ${reference} is in the delivery queue.`,'delivery',id);
  await audit(actor || {id:userId,role},'delivery.created','delivery',id,null,{reference,fee:price.fee,channel},null);
  return { id, reference, fee:price.fee, breakdown:price.breakdown, status:timing === 'scheduled' ? 'pending_confirmation' : 'awaiting_assignment', scheduledAt, distanceKm:price.distanceKm };
}

router.get('/zones', async (_req, res) => res.json({ zones:await db.prepare('SELECT id,name,description FROM service_zones WHERE active=1 ORDER BY name').all() }));
router.get('/pricing', async (_req, res) => {
  const p = await db.prepare('SELECT version,base_fee,per_km,min_fee,student_flat,scheduled_surcharge FROM pricing_versions ORDER BY created_at DESC LIMIT 1').get();
  if (!p) return res.status(503).json({error:'Pricing is not configured.'});
  res.json({pricing:p,currency:'NGN',method:'haversine-estimate',notice:'Final fare is calculated by the server. Route estimates may differ from road distance.'});
});
router.post('/pricing/quote', async (req, res) => {
  try {
    const sessionUser=await getSessionUser(req.cookies?.session);
    const student=sessionUser?.role==='student'?await db.prepare('SELECT verification_status,expires_at FROM student_profiles WHERE user_id=?').get(sessionUser.id):null;
    const isStudent=student?.verification_status==='approved'&&(!student.expires_at||new Date(student.expires_at)>=new Date());
    const isVendor=sessionUser?.role==='vendor'&&(await db.prepare("SELECT approval_status FROM vendors WHERE user_id=?").get(sessionUser.id))?.approval_status==='approved';
    const price = await calculateDeliveryFee({ pickupLat:req.body.pickupLat,pickupLng:req.body.pickupLng,dropoffLat:req.body.dropoffLat,dropoffLng:req.body.dropoffLng,timing:req.body.timing==='scheduled'?'scheduled':'now',isStudent,isVendor,zone:req.body.zone || 'Calabar Municipal' });
    res.json({ fee:price.fee, breakdown:price.breakdown, currency:'NGN', validForSeconds:300 });
  } catch(e) { res.status(400).json({error:e.message}); }
});

router.get('/deliveries', requireAuth, async (req, res) => {
  const {user} = req;
  const page=Math.max(1,Number(req.query.page)||1), limit=Math.min(50,Math.max(1,Number(req.query.limit)||20)), offset=(page-1)*limit;
  const status=req.query.status ? String(req.query.status) : null;
  const search=req.query.search ? `%${String(req.query.search).slice(0,80)}%` : null;
  let rows, count;
  if (user.role==='super_admin' || user.role==='ops_officer' || user.role==='rider_manager' || user.role==='finance_officer') {
    rows=await db.prepare(`SELECT id,reference,customer_id,vendor_id,pickup_address,dropoff_address,recipient_name,status,fee,payment_status,timing,scheduled_at,created_at,updated_at FROM deliveries WHERE (CAST(? AS text) IS NULL OR status=?) AND (CAST(? AS text) IS NULL OR reference LIKE ?) ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(status,status,search,search,limit,offset);
    count=(await db.prepare(`SELECT COUNT(*) n FROM deliveries WHERE (CAST(? AS text) IS NULL OR status=?) AND (CAST(? AS text) IS NULL OR reference LIKE ?)`).get(status,status,search,search)).n;
  } else if (user.role==='vendor') {
    rows=await db.prepare(`SELECT id,reference,pickup_address,dropoff_address,recipient_name,status,fee,payment_status,timing,scheduled_at,created_at,updated_at FROM deliveries WHERE vendor_id=? AND (CAST(? AS text) IS NULL OR status=?) AND (CAST(? AS text) IS NULL OR reference LIKE ?) ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(user.id,status,status,search,search,limit,offset);
    count=(await db.prepare(`SELECT COUNT(*) n FROM deliveries WHERE vendor_id=? AND (CAST(? AS text) IS NULL OR status=?) AND (CAST(? AS text) IS NULL OR reference LIKE ?)`).get(user.id,status,status,search,search)).n;
  } else if (user.role==='rider') {
    rows=await db.prepare(`SELECT d.id,d.reference,d.pickup_address,d.dropoff_address,d.recipient_name,d.recipient_phone,d.package_category,d.package_desc,d.instructions,d.status,d.fee,d.timing,d.scheduled_at,d.created_at,da.status assignment_status
      FROM deliveries d JOIN delivery_assignments da ON da.delivery_id=d.id WHERE da.rider_id=? AND da.status IN ('assigned','accepted') AND (CAST(? AS text) IS NULL OR d.status=?) ORDER BY d.created_at DESC LIMIT ? OFFSET ?`).all(user.id,status,status,limit,offset);
    count=(await db.prepare(`SELECT COUNT(*) n FROM deliveries d JOIN delivery_assignments da ON da.delivery_id=d.id WHERE da.rider_id=? AND da.status IN ('assigned','accepted') AND (CAST(? AS text) IS NULL OR d.status=?)`).get(user.id,status,status)).n;
  } else {
    rows=await db.prepare(`SELECT id,reference,pickup_address,dropoff_address,recipient_name,status,fee,payment_status,timing,scheduled_at,created_at,updated_at FROM deliveries WHERE customer_id=? AND (CAST(? AS text) IS NULL OR status=?) AND (CAST(? AS text) IS NULL OR reference LIKE ?) ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(user.id,status,status,search,search,limit,offset);
    count=(await db.prepare(`SELECT COUNT(*) n FROM deliveries WHERE customer_id=? AND (CAST(? AS text) IS NULL OR status=?) AND (CAST(? AS text) IS NULL OR reference LIKE ?)`).get(user.id,status,status,search,search)).n;
  }
  res.json({deliveries:rows,page,pages:Math.ceil(count/limit),total:count});
});

router.post('/deliveries', requireAuth, requireRole('customer','student','vendor'), async (req, res) => {
  try { const result=await createDelivery({userId:req.user.id,role:req.user.role,body:req.body,actor:req.user}); res.status(201).json(result); }
  catch(e) { res.status(e.status||400).json({error:e.message}); }
});

router.get('/deliveries/:id', requireAuth, async (req, res) => {
  const d=await db.prepare(`SELECT * FROM deliveries WHERE id=? OR reference=?`).get(req.params.id,req.params.id);
  if (!d) return res.status(404).json({error:'Delivery not found.'});
  const privileged=['super_admin','ops_officer','rider_manager','finance_officer'].includes(req.user.role);
  const isAssigned=req.user.role==='rider' && !!(await db.prepare(`SELECT 1 FROM delivery_assignments WHERE delivery_id=? AND rider_id=? AND status IN ('assigned','accepted')`).get(d.id,req.user.id));
  if (!privileged && !isAssigned && d.customer_id!==req.user.id && d.vendor_id!==req.user.id) return res.status(404).json({error:'Delivery not found.'});
  const timeline=await db.prepare(`SELECT new_status,actor_role,lat,lng,created_at FROM delivery_status_history WHERE delivery_id=? ORDER BY created_at ASC`).all(d.id);
  const proof=await db.prepare('SELECT id,recipient_name,notes,created_at FROM delivery_proof WHERE delivery_id=?').get(d.id);
  const {fee_breakdown,...safe}=d;
  res.json({delivery:{...safe,fee_breakdown:JSON.parse(fee_breakdown||'{}'),timeline,proof:proof ? {id:proof.id,recipient_name:proof.recipient_name,notes:proof.notes,created_at:proof.created_at} : null}});
});

router.post('/deliveries/:id/cancel', requireAuth, async (req, res) => {
  const d=await db.prepare('SELECT * FROM deliveries WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if (!d) return res.status(404).json({error:'Delivery not found.'});
  const canManage=['super_admin','ops_officer'].includes(req.user.role);
  if (!canManage && d.customer_id!==req.user.id && d.vendor_id!==req.user.id) return res.status(404).json({error:'Delivery not found.'});
  if (!['pending_confirmation','awaiting_assignment'].includes(d.status)) return res.status(409).json({error:'This delivery can no longer be cancelled in the current status.'});
  const prev=d.status, reason=String(req.body?.reason||'Customer cancellation').slice(0,300);
  const cancel=db.transaction(async () => {
    await db.prepare(`UPDATE deliveries SET status='cancelled',updated_at=now() WHERE id=?`).run(d.id);
    await db.prepare('INSERT INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)').run(crypto.randomUUID(),d.id,prev,'cancelled',req.user.id,req.user.role,reason);
  });
  await cancel();
  if(d.customer_id) await notify(d.customer_id,'Delivery cancelled',`Reference ${d.reference} has been cancelled.`,'delivery',d.id);
  await audit(req.user,'delivery.cancelled','delivery',d.id,{status:prev},{status:'cancelled'},reason,req.ip);
  res.json({ok:true,status:'cancelled'});
});

router.post('/deliveries/:id/rating', requireAuth, requireRole('customer','student'), async (req, res) => {
  const d=await db.prepare('SELECT * FROM deliveries WHERE id=? AND customer_id=?').get(req.params.id,req.user.id);
  if(!d) return res.status(404).json({error:'Delivery not found.'});
  if(d.status!=='delivered') return res.status(409).json({error:'Only completed deliveries can be rated.'});
  const rating=Number(req.body?.rating), comment=String(req.body?.comment||'').slice(0,500);
  if(!Number.isInteger(rating)||rating<1||rating>5) return res.status(400).json({error:'Choose a rating from 1 to 5.'});
  try { await db.prepare('INSERT INTO ratings (id,delivery_id,customer_id,rating,comment) VALUES (?,?,?,?,?)').run(crypto.randomUUID(),d.id,req.user.id,rating,comment); }
  catch { return res.status(409).json({error:'A rating has already been submitted.'}); }
  res.status(201).json({message:'Thank you for your feedback.'});
});

router.post('/market-runs', requireAuth, requireRole('customer','student'), async (req, res) => {
  const d=req.body||{}, items=Array.isArray(d.items)?d.items:[];
  if(String(d.contactName||'').trim().length<2 || String(d.contactPhone||'').trim().length<7 || String(d.deliveryLocation||'').trim().length<4 || items.length<1 || items.length>40) return res.status(400).json({error:'Add a contact, delivery location and at least one item.'});
  const budget=Number(d.budgetEstimate||0);
  if(!Number.isFinite(budget)||budget<0||budget>100000000) return res.status(400).json({error:'Enter a valid budget estimate.'});
  for(const item of items) if(!String(item.name||'').trim() || !Number.isInteger(Number(item.quantity)) || Number(item.quantity)<1 || Number(item.quantity)>1000) return res.status(400).json({error:'Each shopping item needs a name and valid quantity.'});
  const id=crypto.randomUUID(),reference=ref('MR'),pricing=await db.prepare('SELECT market_runs_fee FROM pricing_versions ORDER BY created_at DESC LIMIT 1').get();
  const create=db.transaction(async () => {
    await db.prepare('INSERT INTO market_runs (id,reference,customer_id,contact_name,contact_phone,delivery_location,budget_estimate,service_date,contact_preference,instructions,status,service_fee) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id,reference,req.user.id,String(d.contactName).trim(),String(d.contactPhone).trim(),String(d.deliveryLocation).trim(),budget,d.serviceDate||null,d.contactPreference||'phone',String(d.instructions||'').slice(0,500),'submitted',pricing?.market_runs_fee||0);
    const add=db.prepare('INSERT INTO market_run_items (id,market_run_id,item_name,quantity,unit,brand,description) VALUES (?,?,?,?,?,?,?)');
    for(const item of items) await add.run(crypto.randomUUID(),id,String(item.name).trim().slice(0,120),Number(item.quantity),String(item.unit||'unit').slice(0,40),String(item.brand||'').slice(0,80),String(item.description||'').slice(0,200));
  });
  await create(); await notify(req.user.id,'Market Run submitted',`Request ${reference} is under review.`,'market_run',id);
  await audit(req.user,'market_run.created','market_run',id,null,{reference},null,req.ip);
  res.status(201).json({id,reference,status:'submitted',serviceFee:pricing?.market_runs_fee||0});
});

router.get('/market-runs', requireAuth, async (req, res) => {
  const isOps=['super_admin','ops_officer','finance_officer'].includes(req.user.role);
  const rows=isOps?await db.prepare(`SELECT m.*,COALESCE((SELECT p.status FROM payments p WHERE p.market_run_id=m.id ORDER BY p.created_at DESC LIMIT 1),'pending') payment_status FROM market_runs m ORDER BY m.created_at DESC LIMIT 100`).all():await db.prepare(`SELECT m.*,COALESCE((SELECT p.status FROM payments p WHERE p.market_run_id=m.id ORDER BY p.created_at DESC LIMIT 1),'pending') payment_status FROM market_runs m WHERE m.customer_id=? ORDER BY m.created_at DESC`).all(req.user.id);
  const result=await Promise.all(rows.map(async row => ({
    ...row,
    items:await db.prepare('SELECT item_name name,quantity,unit,brand,description FROM market_run_items WHERE market_run_id=?').all(row.id)
  })));
  res.json({marketRuns:result});
});

router.post('/waybills', requireAuth, requireRole('customer','student'), async (req, res) => {
  const d=req.body||{};
  for(const key of ['senderName','senderPhone','recipientName','recipientPhone','destinationCity','destinationAddress','origin','itemDescription']) if(!String(d[key]||'').trim()) return res.status(400).json({error:`${key.replace(/[A-Z]/g,x=>' '+x.toLowerCase())} is required.`});
  const weight=Number(d.weight||0);
  if(!Number.isFinite(weight)||weight<=0||weight>1000) return res.status(400).json({error:'Enter a valid parcel weight in kilograms.'});
  const origin=String(d.origin).trim(), destination=String(d.destinationCity).trim();
  let calculated;
  try{calculated=await calculateWaybillFee({origin,destination,weight,category:d.itemCategory});}catch(e){return res.status(400).json({error:'No approved waybill rate is configured for this route. Contact operations for assistance.'});}
  const id=crypto.randomUUID(),reference=ref('WB');
  const create=db.transaction(async () => {
    await db.prepare(`INSERT INTO waybills (id,reference,customer_id,sender_name,sender_phone,sender_email,recipient_name,recipient_phone,destination_city,destination_address,origin,destination,item_category,item_desc,weight,dimensions,declared_value,packaging,handling,dispatch_date,delivery_method,office_dropoff,status,fee)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,reference,req.user.id,String(d.senderName).trim(),String(d.senderPhone).trim(),d.senderEmail||null,String(d.recipientName).trim(),String(d.recipientPhone).trim(),destination,String(d.destinationAddress).trim(),origin,destination,String(d.itemCategory||'general').slice(0,80),String(d.itemDescription).slice(0,500),weight,String(d.dimensions||'').slice(0,100),Number(d.declaredValue||0),String(d.packaging||'').slice(0,120),String(d.handling||'').slice(0,300),d.dispatchDate||null,String(d.deliveryMethod||'standard'),d.officeDropoff||null,'submitted',calculated.fee);
    await db.prepare('INSERT INTO waybill_tracking_events (id,waybill_id,status,location,notes) VALUES (?,?,?,?,?)').run(crypto.randomUUID(),id,'submitted',origin,'Waybill request received');
  });
  await create(); await notify(req.user.id,'Waybill request received',`Reference ${reference} is under review.`,'waybill',id);
  await audit(req.user,'waybill.created','waybill',id,null,{reference,fee:calculated.fee},null,req.ip);
  res.status(201).json({id,reference,fee:calculated.fee,weightBand:calculated.band,status:'submitted'});
});

router.get('/waybills', requireAuth, async (req, res) => {
  const ops=['super_admin','ops_officer'].includes(req.user.role);
  const rows=ops?await db.prepare('SELECT id,reference,waybill_number,sender_name,recipient_name,destination_city,origin,status,fee,payment_status,weight,created_at FROM waybills ORDER BY created_at DESC LIMIT 100').all():await db.prepare('SELECT id,reference,waybill_number,sender_name,recipient_name,destination_city,origin,status,fee,payment_status,weight,created_at FROM waybills WHERE customer_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json({waybills:rows});
});

router.get('/track/:reference',async (req, res) => {
  const d=await db.prepare('SELECT id,reference,status,updated_at,created_at,timing,scheduled_at FROM deliveries WHERE reference=?').get(req.params.reference);
  if(d){
    const timeline=await db.prepare('SELECT new_status,created_at FROM delivery_status_history WHERE delivery_id=? ORDER BY created_at').all(d.id);
    return res.json({type:'delivery',tracking:{reference:d.reference,status:d.status,lastUpdated:d.updated_at,createdAt:d.created_at,scheduledAt:d.scheduled_at,timeline}});
  }
  const w=await db.prepare('SELECT id,reference,waybill_number,origin,destination,destination_city,status,dispatch_date,updated_at,created_at FROM waybills WHERE reference=? OR waybill_number=?').get(req.params.reference,req.params.reference);
  if(w){const timeline=await db.prepare('SELECT status,location,created_at FROM waybill_tracking_events WHERE waybill_id=? ORDER BY created_at').all(w.id);return res.json({type:'waybill',tracking:{reference:w.waybill_number||w.reference,origin:w.origin,destination:w.destination_city||w.destination,status:w.status,lastUpdated:w.updated_at,createdAt:w.created_at,timeline}});}
  res.status(404).json({error:'We could not find that tracking reference.'});
});

router.get('/waybills/track/:reference', async (req, res) => {
  const wb=await db.prepare('SELECT reference,waybill_number,origin,destination,destination_city,status,dispatch_date,updated_at,created_at FROM waybills WHERE reference=? OR waybill_number=?').get(req.params.reference,req.params.reference);
  if(!wb)return res.status(404).json({error:'Waybill not found.'});
  const timeline=await db.prepare('SELECT status,location,created_at FROM waybill_tracking_events WHERE waybill_id=(SELECT id FROM waybills WHERE reference=? OR waybill_number=?) ORDER BY created_at').all(req.params.reference,req.params.reference);
  res.json({waybill:wb,timeline});
});

router.get('/addresses',requireAuth,async (req, res) => res.json({addresses:await db.prepare('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC,created_at DESC').all(req.user.id)}));
router.post('/addresses',requireAuth,async (req, res) => {
  const label=String(req.body?.label||'Home').trim().slice(0,40),address=String(req.body?.addressLine||'').trim();
  if(address.length<4||address.length>250)return res.status(400).json({error:'Enter a complete address of no more than 250 characters.'});
  if((await db.prepare('SELECT COUNT(*) n FROM addresses WHERE user_id=?').get(req.user.id)).n>=20)return res.status(409).json({error:'You can save up to 20 addresses.'});
  const id=crypto.randomUUID(),hasDefault=!!(await db.prepare('SELECT id FROM addresses WHERE user_id=? AND is_default=1').get(req.user.id)),makeDefault=req.body?.isDefault===true||!hasDefault;
  const create=db.transaction(async () => {
    if(makeDefault)await db.prepare('UPDATE addresses SET is_default=0 WHERE user_id=?').run(req.user.id);
    await db.prepare('INSERT INTO addresses (id,user_id,label,address_line,lat,lng,is_default) VALUES (?,?,?,?,?,?,?)').run(id,req.user.id,label,address,req.body?.lat??null,req.body?.lng??null,makeDefault?1:0);
  });
  await create();res.status(201).json({id,label,addressLine:address,isDefault:makeDefault});
});
router.patch('/addresses/:id',requireAuth,async (req, res) => {
  const address=await db.prepare('SELECT * FROM addresses WHERE id=? AND user_id=?').get(req.params.id,req.user.id);
  if(!address)return res.status(404).json({error:'Saved address not found.'});
  const label=String(req.body?.label??address.label??'Home').trim().slice(0,40),line=String(req.body?.addressLine??address.address_line).trim();
  if(line.length<4||line.length>250)return res.status(400).json({error:'Enter a complete address of no more than 250 characters.'});
  const makeDefault=req.body?.isDefault===true;
  const update=db.transaction(async () => {
    if(makeDefault)await db.prepare('UPDATE addresses SET is_default=0 WHERE user_id=?').run(req.user.id);
    await db.prepare('UPDATE addresses SET label=?,address_line=?,is_default=? WHERE id=? AND user_id=?').run(label,line,makeDefault?1:(req.body?.isDefault===false?0:address.is_default),address.id,req.user.id);
    if(!makeDefault&&req.body?.isDefault===false&&address.is_default){
      const next=await db.prepare('SELECT id FROM addresses WHERE user_id=? AND id<>? ORDER BY created_at DESC LIMIT 1').get(req.user.id,address.id);
      if(next)await db.prepare('UPDATE addresses SET is_default=1 WHERE id=?').run(next.id);
    }
  });
  await update();res.json({id:address.id,label,addressLine:line,isDefault:makeDefault||address.is_default===1&&req.body?.isDefault!==false});
});
router.delete('/addresses/:id',requireAuth,async (req, res) => {
  const address=await db.prepare('SELECT * FROM addresses WHERE id=? AND user_id=?').get(req.params.id,req.user.id);
  if(!address)return res.status(404).json({error:'Saved address not found.'});
  const remove=db.transaction(async () => {
    await db.prepare('DELETE FROM addresses WHERE id=? AND user_id=?').run(address.id,req.user.id);
    if(address.is_default){
      const next=await db.prepare('SELECT id FROM addresses WHERE user_id=? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
      if(next)await db.prepare('UPDATE addresses SET is_default=1 WHERE id=?').run(next.id);
    }
  });
  await remove();res.json({ok:true});
});

router.get('/market-runs/:id',requireAuth,async (req, res) => {
  const m=await db.prepare('SELECT * FROM market_runs WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!m||m.customer_id!==req.user.id&&!['super_admin','ops_officer','finance_officer'].includes(req.user.role))return res.status(404).json({error:'Market Run not found.'});
  res.json({marketRun:{...m,items:await db.prepare('SELECT item_name name,quantity,unit,brand,description FROM market_run_items WHERE market_run_id=?').all(m.id),expenses:await db.prepare("SELECT item_name,amount,status,created_at FROM market_run_expenses WHERE market_run_id=? AND status='approved'").all(m.id)}});
});
router.post('/market-runs/:id/approve',requireAuth,requireRole('customer','student'),async (req, res) => {
  const m=await db.prepare('SELECT * FROM market_runs WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!m||m.customer_id!==req.user.id)return res.status(404).json({error:'Market Run not found.'});
  if(m.status!=='awaiting_customer_approval')return res.status(409).json({error:'There is no estimate awaiting your approval.'});
  const approved=req.body?.approved===true,status=approved?'approved':'cancelled';
  await db.prepare("UPDATE market_runs SET status=?,updated_at=now() WHERE id=?").run(status,m.id);
  await notify(req.user.id,approved?'Estimate approved':'Market Run cancelled',approved?`Your estimate of ₦${Number(m.final_total||0).toLocaleString()} has been approved.`:'The Market Run was cancelled.','market_run',m.id);
  await audit(req.user,'market_run.customer_decision','market_run',m.id,{status:m.status},{status},null,req.ip);
  res.json({status});
});
router.post('/market-runs/:id/cancel',requireAuth,requireRole('customer','student'),async (req, res) => {
  const m=await db.prepare('SELECT * FROM market_runs WHERE id=? OR reference=?').get(req.params.id,req.params.id);
  if(!m||m.customer_id!==req.user.id)return res.status(404).json({error:'Market Run not found.'});
  if(!['submitted','under_review','awaiting_customer_approval'].includes(m.status))return res.status(409).json({error:'This Market Run can no longer be cancelled.'});
  await db.prepare("UPDATE market_runs SET status='cancelled',updated_at=now() WHERE id=?").run(m.id);
  await audit(req.user,'market_run.cancelled','market_run',m.id,{status:m.status},{status:'cancelled'},String(req.body?.reason||''),req.ip);res.json({status:'cancelled'});
});

export default router;
