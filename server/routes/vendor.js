import {Router} from 'express';
import db from '../db.js';
import {requireAuth,requireRole,audit} from '../auth.js';
const router=Router();
router.get('/vendor/dashboard',requireAuth,requireRole('vendor'),(req,res)=>{
 const vendor=db.prepare('SELECT * FROM vendors WHERE user_id=?').get(req.user.id);
 const counts=db.prepare(`SELECT SUM(CASE WHEN status NOT IN ('delivered','cancelled','returned','delivery_failed') THEN 1 ELSE 0 END) active,SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) completed,SUM(CASE WHEN status='awaiting_assignment' THEN 1 ELSE 0 END) awaiting FROM deliveries WHERE vendor_id=?`).get(req.user.id);
 const recent=db.prepare(`SELECT id,reference,pickup_address,dropoff_address,recipient_name,status,fee,created_at FROM deliveries WHERE vendor_id=? ORDER BY created_at DESC LIMIT 5`).all(req.user.id);
 res.json({vendor:{business_name:vendor?.business_name,category:vendor?.category,contact_person:vendor?.contact_person,business_address:vendor?.business_address,service_location:vendor?.service_location,description:vendor?.description,operating_hours:vendor?.operating_hours,approval_status:vendor?.approval_status,rejection_reason:vendor?.rejection_reason},counts,recent});
});
router.get('/vendor/profile',requireAuth,requireRole('vendor'),(req,res)=>{
 const profile=db.prepare('SELECT business_name,category,contact_person,business_address,service_location,description,operating_hours,approval_status,rejection_reason FROM vendors WHERE user_id=?').get(req.user.id);
 res.json({profile});
});
router.patch('/vendor/profile',requireAuth,requireRole('vendor'),(req,res)=>{
 const p=db.prepare('SELECT * FROM vendors WHERE user_id=?').get(req.user.id);if(!p)return res.status(404).json({error:'Business profile not found.'});
 const d=req.body||{},name=String(d.businessName??p.business_name).trim(),contact=String(d.contactPerson??p.contact_person??'').trim(),businessAddress=String(d.businessAddress??p.business_address??'').trim();
 if(name.length<2||contact.length<2||businessAddress.length<4)return res.status(400).json({error:'Business name, contact person and business address are required.'});
 db.prepare('UPDATE vendors SET business_name=?,category=?,contact_person=?,business_address=?,service_location=?,description=?,operating_hours=? WHERE user_id=?').run(name,String(d.category??p.category??''),contact,businessAddress,String(d.serviceLocation??p.service_location??''),String(d.description??p.description??'').slice(0,1000),String(d.operatingHours??p.operating_hours??''),req.user.id);
 audit(req.user,'vendor.profile_updated','vendor',req.user.id,p,{business_name:name,category:d.category},null,req.ip);res.json({message:'Business profile saved.'});
});
export default router;
