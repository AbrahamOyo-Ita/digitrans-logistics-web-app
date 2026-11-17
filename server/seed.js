import crypto from 'crypto';
import db, { migrate } from './db.js';
import { hashPassword } from './auth.js';

const demoPassword = process.env.DEMO_PASSWORD || 'Calabar2026!';
const people = [
  { email: 'admin@digitrans.test', phone: '+2348000000011', name: 'DigiTrans Administrator', role: 'super_admin' },
  { email: 'ops@digitrans.test', phone: '+2348000000012', name: 'Ada Operations', role: 'ops_officer' },
  { email: 'customer@digitrans.test', phone: '+2348000000013', name: 'Ekemini Customer', role: 'customer' },
  { email: 'rider@digitrans.test', phone: '+2348000000014', name: 'Uwem Rider', role: 'rider' },
  { email: 'vendor@digitrans.test', phone: '+2348000000015', name: 'Calabar Kitchen', role: 'vendor' },
  { email: 'investor@digitrans.test', phone: '+2348000000016', name: 'Ekong Investor', role: 'investor' },
  { email: 'finance@digitrans.test', phone: '+2348000000017', name: 'Finance Officer', role: 'finance_officer' },
  { email: 'rider.manager@digitrans.test', phone: '+2348000000018', name: 'Rider Manager', role: 'rider_manager' },
  { email: 'vendor.manager@digitrans.test', phone: '+2348000000019', name: 'Vendor Manager', role: 'vendor_manager' },
  { email: 'investment.manager@digitrans.test', phone: '+2348000000020', name: 'Investment Manager', role: 'investment_manager' },
  { email: 'student@digitrans.test', phone: '+2348000000021', name: 'Mfon Student', role: 'student' },
];
const roles = [
  ['customer','Customer'],['student','Student Customer'],['rider','Rider'],['vendor','Vendor'],['investor','Investor'],
  ['ops_officer','Operations Officer'],['rider_manager','Rider Manager'],['vendor_manager','Vendor Manager'],
  ['finance_officer','Finance Officer'],['investment_manager','Investment Manager'],['super_admin','Super Administrator'],
];
const permissions = [
  'users.read','users.manage','students.review','riders.review','vendors.review','deliveries.read','deliveries.create','deliveries.assign','deliveries.update',
  'pricing.read','pricing.manage','market_runs.manage','waybills.manage','finance.read','finance.manage','investments.read','investments.manage',
  'content.manage','settings.manage','audit.read','admin.manage','support.manage','accounts.suspend'
];

export function seedBase({demo=process.env.NODE_ENV!=='production'}={}) {
  migrate();
  const addRole = db.prepare('INSERT OR IGNORE INTO roles (id,name,description) VALUES (?,?,?)');
  const updateRole = db.prepare('UPDATE roles SET name=?,description=? WHERE id=?');
  for (const [id,label] of roles) {
    addRole.run(id,id,label);
    updateRole.run(id,label,id);
  }
  const addPermission = db.prepare('INSERT OR IGNORE INTO permissions (id,key,description) VALUES (?,?,?)');
  for (const key of permissions) addPermission.run(key,key,`Permission to ${key.replaceAll('.',' ')}`);
  const grants = {
    customer:[],student:[],rider:[],vendor:[],investor:[],
    ops_officer:['users.read','students.review','riders.review','deliveries.read','deliveries.create','deliveries.assign','deliveries.update','market_runs.manage','waybills.manage','support.manage'],
    rider_manager:['users.read','riders.review','deliveries.read','deliveries.assign','deliveries.update','support.manage'],
    vendor_manager:['users.read','vendors.review','deliveries.read','support.manage'],
    finance_officer:['finance.read','finance.manage','deliveries.read','investments.read'],
    investment_manager:['investments.read','investments.manage','finance.read'],
    super_admin:permissions,
  };
  const grant = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES (?,?)');
  for (const [role,items] of Object.entries(grants)) for (const p of items) grant.run(role,p);

  const zones = ['Calabar Municipal','Marian','UNICAL','Etta Agbor','State Housing','8 Miles','Akim','Big Qua','Atimbo','Goldie'];
  const addZone = db.prepare('INSERT OR IGNORE INTO service_zones (id,name,description,active,supported_services) VALUES (?,?,?,?,?)');
  zones.forEach((z,i) => addZone.run(`zone-${String(i+1).padStart(2,'0')}`,z,`DigiTrans delivery service area in ${z}, Calabar`,demo?1:0,'local,market_runs'));
  if(demo){
  if (!db.prepare('SELECT id FROM pricing_versions LIMIT 1').get()) {
    db.prepare(`INSERT INTO pricing_versions (id,version,base_fee,per_km,min_fee,student_flat,vendor_discount_pct,scheduled_surcharge,special_charge,rider_commission_pct,market_runs_fee,effective_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`)
      .run('pricing-v1','Calabar v1',800,180,1000,800,5,200,0,25,1500);
  }
  const routes = [
    ['Calabar','Lagos','below_5kg',6500],['Calabar','Lagos','5_10kg',10500],['Calabar','Lagos','above_10kg',16000],
    ['Calabar','Abuja','below_5kg',7000],['Calabar','Abuja','5_10kg',12000],['Calabar','Abuja','above_10kg',18000],
    ['Calabar','Port Harcourt','below_5kg',4000],['Calabar','Port Harcourt','5_10kg',7000],['Calabar','Port Harcourt','above_10kg',11000],
    ['Calabar','Uyo','below_5kg',2500],['Calabar','Uyo','5_10kg',4200],['Calabar','Uyo','above_10kg',6500],
    ['Calabar','Enugu','below_5kg',3500],['Calabar','Enugu','5_10kg',6000],['Calabar','Enugu','above_10kg',9500],
  ];
  const addRoute = db.prepare('INSERT OR IGNORE INTO waybill_pricing (id,origin,destination,weight_band,price,category) VALUES (?,?,?,?,?,?)');
  routes.forEach((r,i)=>addRoute.run(`route-${i+1}`,...r,'general'));
  }
  const addFaq = db.prepare('INSERT OR IGNORE INTO faqs (id,question,answer,category,sort_order) VALUES (?,?,?,?,?)');
  [
    ['faq-1','Where does DigiTrans deliver?','We provide local delivery throughout supported areas in Calabar and intercity parcel service on selected routes. Check availability when booking.','Services',1],
    ['faq-2','How do I track a delivery?','Use the unique delivery reference on your dashboard or enter it on our tracking page. Updates appear as your parcel moves through each delivery stage.','Tracking',2],
    ['faq-3','Can I schedule a delivery?','Yes. Choose “Schedule delivery” during booking and select a future date and time. Scheduled deliveries are dispatched in their authorised window.','Bookings',3],
    ['faq-4','How do Market Runs work?','Send a shopping list, review the estimate and approve it. Our team procures approved items, records expenses and arranges delivery.','Market Runs',4],
    ['faq-5','How do I become a rider?','Register as a rider, submit your identity, vehicle and guarantor details, and accept the current rider agreement. Our rider team will review your application.','Riders',5],
    ['faq-6','What items are prohibited?','Dangerous goods, illegal items, weapons, live animals and other restricted goods cannot be carried. Contact support if you are unsure about an item.','Safety',6],
  ].forEach(row=>addFaq.run(...row));

  if(demo){
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (id,email,phone,password_hash,role,status,email_verified,phone_verified) VALUES (?,?,?,?,?,?,1,1)');
  const insertProfile = db.prepare('INSERT OR IGNORE INTO profiles (user_id,full_name,address) VALUES (?,?,?)');
  const ids = {};
  for (const p of people) {
    let existing = db.prepare('SELECT id FROM users WHERE email=?').get(p.email);
    const id = existing?.id || crypto.randomUUID();
    ids[p.role] = id;
    insertUser.run(id,p.email,p.phone,hashPassword(demoPassword),p.role,'active');
    insertProfile.run(id,p.name,'Calabar, Cross River State');
  }
  const rider = ids.rider;
  db.prepare('INSERT OR IGNORE INTO system_settings (key,value) VALUES (?,?)').run('current_rider_agreement_version','1.0');
  db.prepare('INSERT OR IGNORE INTO system_settings (key,value) VALUES (?,?)').run('current_rider_agreement_text','STAGING DEMO AGREEMENT · This demonstration rider agreement is for staging use only and is not a legal operating contract. DigiTrans must replace it with the approved agreement before production. Riders agree to follow lawful delivery instructions, protect parcels and personal information, use safe riding practices, update delivery status truthfully, and report incidents promptly. Payouts are calculated using the published configuration and remain subject to reconciliation.');
  db.prepare(`INSERT OR IGNORE INTO riders (user_id,vehicle_type,vehicle_reg,vehicle_desc,bank_name,bank_account_name,bank_account_number,availability,approval_status)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(rider,'Motorcycle','CRS-123-XY','Blue motorcycle','Access Bank','Uwem Rider','0001234567','available','approved');
  db.prepare('INSERT OR IGNORE INTO rider_guarantors (id,rider_id,full_name,phone,address,relationship) VALUES (?,?,?,?,?,?)').run('demo-guarantor',rider,'Uduak Guarantor','+2348000000099','Calabar','Family friend');
  db.prepare('INSERT OR IGNORE INTO rider_agreements (id,rider_id,version,doc_ref) VALUES (?,?,?,?)').run('demo-rider-agreement',rider,'1.0','rider-agreement-v1');
  const vendor = ids.vendor;
  db.prepare(`INSERT OR IGNORE INTO vendors (user_id,business_name,category,contact_person,business_address,service_location,description,operating_hours,approval_status)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(vendor,'Calabar Kitchen','Restaurant','Ekemini Customer','Marian Road, Calabar','Marian','Fresh local meals and snacks','8am–9pm','approved');
  db.prepare(`INSERT OR IGNORE INTO investors (user_id,address,id_type,verification_status) VALUES (?,?,?,?)`).run(ids.investor,'Calabar','National ID','approved');
  db.prepare(`INSERT OR IGNORE INTO student_profiles (user_id,institution,matric_no,verification_status,expires_at) VALUES (?,?,?,?,?)`).run(ids.student,'University of Calabar','UNICAL-DEMO-01','approved','2027-12-31');
  db.prepare(`INSERT OR IGNORE INTO opportunities (id,title,description,category,min_investment,max_investment,duration_months,start_date,closing_date,maturity_date,return_structure,projected_return_pct,payment_terms,risk_disclosure,agreement_doc,eligibility,capacity,subscribed,status,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('opportunity-demo','Calabar Urban Mobility Fund','A demonstration opportunity for platform testing. Projections are illustrative only and are not an offer to invest.','Logistics',50000,500000,6,'2026-12-01','2026-12-31','2027-06-01','Illustrative, subject to final terms',8,'Not configured','Investment involves risk. This demo is not a public offer.','demo-agreement-v1','Verified investors only',10000000,0,'published',ids.investment_manager);
  db.prepare(`INSERT OR IGNORE INTO deliveries (id,reference,customer_id,pickup_address,dropoff_address,recipient_name,recipient_phone,package_category,package_desc,delivery_method,timing,status,fee,pricing_version_id,distance_km,fee_breakdown,channel,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('demo-delivery-active','DT-DEMO-1001',ids.customer,'Marian Road, Calabar','University of Calabar, UNICAL','Mfon Customer','+2348000000101','Documents','University documents','motorcycle','now','in_transit',1500,'pricing-v1',3,JSON.stringify({base_fee:800,distance_km:3,per_km:180,distance_charge:540,pricing_version:'Calabar v1'}),'app',ids.customer);
  db.prepare(`INSERT OR IGNORE INTO delivery_assignments (id,delivery_id,rider_id,status,reference,assigned_by) VALUES (?,?,?,?,?,?)`).run('demo-assignment-active','demo-delivery-active',rider,'accepted','ASG-DEMO-1001',ids.ops_officer);
  db.prepare(`INSERT OR IGNORE INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)`).run('demo-history-active-1','demo-delivery-active',null,'awaiting_assignment',ids.customer,'customer','Demo booking created');
  db.prepare(`INSERT OR IGNORE INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)`).run('demo-history-active-2','demo-delivery-active','awaiting_assignment','assigned',ids.ops_officer,'ops_officer','Demo rider assigned');
  db.prepare(`INSERT OR IGNORE INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)`).run('demo-history-active-3','demo-delivery-active','assigned','rider_accepted',rider,'rider','Demo rider accepted');
  db.prepare(`INSERT OR IGNORE INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)`).run('demo-history-active-4','demo-delivery-active','rider_accepted','in_transit',rider,'rider','Parcel collected');
  db.prepare(`INSERT OR IGNORE INTO deliveries (id,reference,customer_id,pickup_address,dropoff_address,recipient_name,recipient_phone,package_category,package_desc,delivery_method,timing,status,fee,pricing_version_id,distance_km,fee_breakdown,channel,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('demo-delivery-complete','DT-DEMO-1002',ids.customer,'State Housing, Calabar','Marian Market, Calabar','Amina Receiver','+2348000000102','Groceries','Small grocery parcel','bicycle','now','delivered',1200,'pricing-v1',2.2,JSON.stringify({base_fee:800,distance_km:2.2,per_km:180,pricing_version:'Calabar v1'}),'app',ids.customer);
  db.prepare(`INSERT OR IGNORE INTO delivery_assignments (id,delivery_id,rider_id,status,reference,assigned_by) VALUES (?,?,?,?,?,?)`).run('demo-assignment-complete','demo-delivery-complete',rider,'completed','ASG-DEMO-1002',ids.ops_officer);
  db.prepare(`INSERT OR IGNORE INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_id,actor_role,notes) VALUES (?,?,?,?,?,?,?)`).run('demo-history-complete','demo-delivery-complete',null,'delivered',rider,'rider','Demo completed delivery');
  db.prepare(`INSERT OR IGNORE INTO rider_earnings (id,rider_id,delivery_id,eligible_fee,commission_pct,rider_earnings,digitrans_share,reference,settlement_status) VALUES (?,?,?,?,?,?,?,?,?)`).run('demo-earning',rider,'demo-delivery-complete',1200,25,300,900,'EARN-DEMO-1002','pending');
  db.prepare(`INSERT OR IGNORE INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)`).run('demo-ledger-rider','LED-EARN-DEMO-1002','rider_earning',300,'demo-delivery-complete','delivery','Staging demo rider share');
  db.prepare(`INSERT OR IGNORE INTO market_runs (id,reference,customer_id,contact_name,contact_phone,delivery_location,budget_estimate,status,service_fee) VALUES (?,?,?,?,?,?,?,?,?)`).run('demo-market-run','MR-DEMO-1001',ids.customer,'Ekemini Customer','+2348000000013','Marian Road, Calabar',12000,'under_review',1500);
  db.prepare(`INSERT OR IGNORE INTO market_run_items (id,market_run_id,item_name,quantity,unit) VALUES (?,?,?,?,?)`).run('demo-market-item','demo-market-run','Fresh tomatoes',2,'basket');
  db.prepare(`INSERT OR IGNORE INTO waybills (id,reference,waybill_number,customer_id,sender_name,sender_phone,recipient_name,recipient_phone,destination_city,destination_address,origin,destination,item_category,item_desc,weight,status,fee,payment_status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('demo-waybill','WB-DEMO-1001','DWB-DEMO-1001',ids.customer,'Ekemini Customer','+2348000000013','Ada Recipient','+2348000000103','Lagos','Ikeja, Lagos','Calabar','Lagos','Documents','Printed documents',2.5,'in_transit',6500,'successful');
  db.prepare(`INSERT OR IGNORE INTO waybill_tracking_events (id,waybill_id,status,location,notes) VALUES (?,?,?,?,?)`).run('demo-waybill-event','demo-waybill','in_transit','Calabar','Staging demo parcel');
  }
  db.prepare('INSERT OR IGNORE INTO system_settings (key,value) VALUES (?,?)').run('current_rider_agreement_version','1.0');
  db.prepare('INSERT OR IGNORE INTO system_settings (key,value) VALUES (?,?)').run('platform_name','DigiTrans Logistics');
  db.prepare('INSERT OR IGNORE INTO system_settings (key,value) VALUES (?,?)').run('support_phone','+234 800 000 0000');
  if(process.env.NODE_ENV==='production'&&!db.prepare("SELECT id FROM users WHERE role='super_admin' LIMIT 1").get()){
    const email=process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase(),phone=process.env.BOOTSTRAP_ADMIN_PHONE?.trim(),password=process.env.BOOTSTRAP_ADMIN_PASSWORD||'';
    if(email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&phone&&phone.length>=8&&password.length>=12&&/[A-Z]/.test(password)&&/[a-z]/.test(password)&&/[0-9]/.test(password)&&/[!@#$%^&*]/.test(password)){
      const adminId=crypto.randomUUID();
      db.prepare("INSERT INTO users (id,email,phone,password_hash,role,status,email_verified,phone_verified) VALUES (?,?,?,?, 'super_admin','active',1,1)").run(adminId,email,phone,hashPassword(password));
      db.prepare('INSERT INTO profiles (user_id,full_name) VALUES (?,?)').run(adminId,process.env.BOOTSTRAP_ADMIN_NAME||'DigiTrans Administrator');
      console.log(`Production Super Administrator created: ${email}`);
    }
    if(!db.prepare("SELECT id FROM users WHERE role='super_admin' AND status='active' LIMIT 1").get())throw new Error('Production startup requires an active Super Administrator. Set valid BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PHONE, and a unique 12+ character BOOTSTRAP_ADMIN_PASSWORD before first startup.');
  }
  if(process.env.NODE_ENV==='production'&&!db.prepare("SELECT id FROM users WHERE role='super_admin' AND status='active' LIMIT 1").get())throw new Error('Production startup requires an active Super Administrator. Resolve the existing admin account or configure valid bootstrap credentials.');
  console.log(demo?`DigiTrans staging seed ready. Demo credentials: any seeded account / ${demoPassword}`:'DigiTrans production schema initialized. Calabar demo pricing and test accounts were not seeded.');
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  seedBase();
}
