-- Idempotent launch catalogue only: no identities, passwords, deliveries, finance rows, or legacy files.
-- User accounts and business records are created by the application through Supabase Auth and API workflows.

INSERT INTO public.roles(id,name,description) VALUES
 ('customer','customer','Customer'),
 ('student','student','Student Customer'),
 ('rider','rider','Rider'),
 ('vendor','vendor','Vendor'),
 ('investor','investor','Investor'),
 ('ops_officer','ops_officer','Operations Officer'),
 ('rider_manager','rider_manager','Rider Manager'),
 ('vendor_manager','vendor_manager','Vendor Manager'),
 ('finance_officer','finance_officer','Finance Officer'),
 ('investment_manager','investment_manager','Investment Manager'),
 ('super_admin','super_admin','Super Administrator')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description;

INSERT INTO public.permissions(id,key,description) VALUES
 ('users.read','users.read','Read user accounts'),
 ('users.manage','users.manage','Manage user accounts'),
 ('students.review','students.review','Review student applications'),
 ('riders.review','riders.review','Review rider applications'),
 ('vendors.review','vendors.review','Review vendor applications'),
 ('deliveries.read','deliveries.read','Read deliveries'),
 ('deliveries.create','deliveries.create','Create deliveries'),
 ('deliveries.assign','deliveries.assign','Assign deliveries'),
 ('deliveries.update','deliveries.update','Update delivery status'),
 ('pricing.read','pricing.read','Read pricing'),
 ('pricing.manage','pricing.manage','Manage pricing'),
 ('market_runs.manage','market_runs.manage','Manage Market Runs'),
 ('waybills.manage','waybills.manage','Manage waybills'),
 ('finance.read','finance.read','Read financial records'),
 ('finance.manage','finance.manage','Manage financial operations'),
 ('investments.read','investments.read','Read investments'),
 ('investments.manage','investments.manage','Manage investment applications'),
 ('content.manage','content.manage','Manage public content'),
 ('settings.manage','settings.manage','Manage platform settings'),
 ('audit.read','audit.read','Read audit history'),
 ('admin.manage','admin.manage','Manage roles and administrators'),
 ('support.manage','support.manage','Manage support tickets'),
 ('accounts.suspend','accounts.suspend','Suspend accounts')
ON CONFLICT (id) DO UPDATE SET key=EXCLUDED.key,description=EXCLUDED.description;

INSERT INTO public.role_permissions(role_id,permission_id) VALUES
 ('ops_officer','users.read'),('ops_officer','students.review'),('ops_officer','riders.review'),
 ('ops_officer','deliveries.read'),('ops_officer','deliveries.create'),('ops_officer','deliveries.assign'),
 ('ops_officer','deliveries.update'),('ops_officer','market_runs.manage'),('ops_officer','waybills.manage'),
 ('ops_officer','support.manage'),
 ('rider_manager','users.read'),('rider_manager','riders.review'),('rider_manager','deliveries.read'),
 ('rider_manager','deliveries.assign'),('rider_manager','deliveries.update'),('rider_manager','support.manage'),
 ('vendor_manager','users.read'),('vendor_manager','vendors.review'),('vendor_manager','deliveries.read'),
 ('vendor_manager','support.manage'),
 ('finance_officer','finance.read'),('finance_officer','finance.manage'),('finance_officer','deliveries.read'),
 ('finance_officer','investments.read'),
 ('investment_manager','investments.read'),('investment_manager','investments.manage'),('investment_manager','finance.read'),
 ('super_admin','users.read'),('super_admin','users.manage'),('super_admin','students.review'),
 ('super_admin','riders.review'),('super_admin','vendors.review'),('super_admin','deliveries.read'),
 ('super_admin','deliveries.create'),('super_admin','deliveries.assign'),('super_admin','deliveries.update'),
 ('super_admin','pricing.read'),('super_admin','pricing.manage'),('super_admin','market_runs.manage'),
 ('super_admin','waybills.manage'),('super_admin','finance.read'),('super_admin','finance.manage'),
 ('super_admin','investments.read'),('super_admin','investments.manage'),('super_admin','content.manage'),
 ('super_admin','settings.manage'),('super_admin','audit.read'),('super_admin','admin.manage'),
 ('super_admin','support.manage'),('super_admin','accounts.suspend')
ON CONFLICT (role_id,permission_id) DO NOTHING;

INSERT INTO public.service_zones(id,name,description,active,supported_services) VALUES
 ('zone-01','Calabar Municipal','DigiTrans delivery service area in Calabar Municipal, Calabar',1,'local,market_runs'),
 ('zone-02','Marian','DigiTrans delivery service area in Marian, Calabar',1,'local,market_runs'),
 ('zone-03','UNICAL','DigiTrans delivery service area in UNICAL, Calabar',1,'local,market_runs'),
 ('zone-04','Etta Agbor','DigiTrans delivery service area in Etta Agbor, Calabar',1,'local,market_runs'),
 ('zone-05','State Housing','DigiTrans delivery service area in State Housing, Calabar',1,'local,market_runs'),
 ('zone-06','8 Miles','DigiTrans delivery service area in 8 Miles, Calabar',1,'local,market_runs'),
 ('zone-07','Akim','DigiTrans delivery service area in Akim, Calabar',1,'local,market_runs'),
 ('zone-08','Big Qua','DigiTrans delivery service area in Big Qua, Calabar',1,'local,market_runs'),
 ('zone-09','Atimbo & Nyahasang','DigiTrans delivery service area in Atimbo & Nyahasang, Calabar',1,'local,market_runs'),
 ('zone-10','Goldie','DigiTrans delivery service area in Goldie, Calabar',1,'local,market_runs'),
 ('zone-11','Watt Market & Duke Town','DigiTrans delivery service area in Watt Market & Duke Town, Calabar',1,'local,market_runs'),
 ('zone-12','Anantigha & Ikot Ishie','DigiTrans delivery service area in Anantigha & Ikot Ishie, Calabar',1,'local,market_runs')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,active=EXCLUDED.active,supported_services=EXCLUDED.supported_services;

INSERT INTO public.pricing_versions(id,version,base_fee,per_km,min_fee,student_flat,vendor_discount_pct,scheduled_surcharge,special_charge,rider_commission_pct,market_runs_fee) VALUES
 ('pricing-calabar-v1','Calabar Standard v1.0',500,250,1000,500,10,300,0,25,1500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.waybill_pricing(id,origin,destination,weight_band,price,category) VALUES
 ('wb-cal-ph-b5','Calabar','Port Harcourt','below_5kg',1500,'general'),
 ('wb-cal-ph-5_10','Calabar','Port Harcourt','5_10kg',3000,'general'),
 ('wb-cal-ph-a10','Calabar','Port Harcourt','above_10kg',4500,'general'),
 ('wb-ph-cal-b5','Port Harcourt','Calabar','below_5kg',1500,'general'),
 ('wb-ph-cal-5_10','Port Harcourt','Calabar','5_10kg',3000,'general'),
 ('wb-ph-cal-a10','Port Harcourt','Calabar','above_10kg',4500,'general'),
 ('wb-cal-obd-b5','Calabar','Obudu','below_5kg',1500,'general'),
 ('wb-cal-obd-5_10','Calabar','Obudu','5_10kg',3000,'general'),
 ('wb-cal-obd-a10','Calabar','Obudu','above_10kg',4500,'general'),
 ('wb-obd-cal-b5','Obudu','Calabar','below_5kg',1500,'general'),
 ('wb-obd-cal-5_10','Obudu','Calabar','5_10kg',3000,'general'),
 ('wb-obd-cal-a10','Obudu','Calabar','above_10kg',4500,'general')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faqs(id,question,answer,category,sort_order) VALUES
 ('faq-1','Where does DigiTrans deliver?','We provide local delivery throughout supported areas in Calabar and intercity parcel service on selected routes. Check availability when booking.','Services',1),
 ('faq-2','How do I track a delivery?','Use the unique delivery reference on your dashboard or enter it on our tracking page. Updates appear as your parcel moves through each delivery stage.','Tracking',2),
 ('faq-3','Can I schedule a delivery?','Yes. Choose Schedule delivery during booking and select a future date and time. Scheduled deliveries are dispatched in their authorised window.','Bookings',3),
 ('faq-4','How do Market Runs work?','Send a shopping list, review the estimate and approve it. Our team procures approved items, records expenses and arranges delivery.','Market Runs',4),
 ('faq-5','How do I become a rider?','Register as a rider, submit your identity, vehicle and guarantor details, and accept the current rider agreement. Our rider team will review your application.','Riders',5),
 ('faq-6','What items are prohibited?','Dangerous goods, illegal items, weapons, live animals and other restricted goods cannot be carried. Contact support if you are unsure about an item.','Safety',6)
ON CONFLICT (id) DO UPDATE SET question=EXCLUDED.question,answer=EXCLUDED.answer,category=EXCLUDED.category,sort_order=EXCLUDED.sort_order;

INSERT INTO public.system_settings(key,value) VALUES
 ('platform_name','DigiTrans Logistics'),
 ('public_email','digitransdeliveryandlogistics@gmail.com'),
 ('public_address','No 2, Ituebange Street, Nyahasang, Atimbo, Calabar Municipal, Cross River State, Nigeria'),
 ('current_rider_agreement_version','1.0'),
 ('current_rider_agreement_text','DigiTrans Logistics Rider Operating Agreement (v1.0): By accepting this agreement, you confirm that all personal, vehicle, and guarantor details submitted are accurate, you will handle customer parcels with care and integrity, comply with road safety laws and DigiTrans prohibited-items rules, collect proof of delivery before completing orders, and maintain verified active status prior to accepting dispatch assignments.')
ON CONFLICT (key) DO NOTHING;
