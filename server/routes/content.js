import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requirePermission, audit } from '../auth.js';
import { imageUpload, savePublic } from '../uploads.js';
import { isEmailConfigured, sendEmail } from '../email.js';

const router=Router();
const allowedSettings=['public_phone','public_email','public_address','public_about','public_home_hero_title','public_home_hero_text','public_service_areas','public_whatsapp'];
const upload=(req,res,next)=>imageUpload.single('image')(req,res,e=>{if(e)return res.status(e.code==='LIMIT_FILE_SIZE'?413:400).json({error:e.message});next();});

router.post('/public/contact',async(req,res)=>{
  const name=String(req.body?.name||'').trim(),email=String(req.body?.email||'').trim().toLowerCase(),phone=String(req.body?.phone||'').trim(),category=String(req.body?.category||'general').trim().replace(/[\r\n]+/g,' ').slice(0,80),message=String(req.body?.message||'').trim();
  if(name.length<2||name.length>100||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<10||message.length>3000)return res.status(400).json({error:'Enter your name, a valid email and a message of at least 10 characters.'});
  const id=crypto.randomUUID();db.prepare('INSERT INTO contact_messages (id,name,email,phone,category,message) VALUES (?,?,?,?,?,?)').run(id,name,email,phone||null,category.slice(0,80),message);
  if(process.env.CONTACT_RECIPIENT_EMAIL&&isEmailConfigured()){
    try{await sendEmail({to:process.env.CONTACT_RECIPIENT_EMAIL,replyTo:email,subject:`DigiTrans website enquiry · ${category.slice(0,80)}`,text:`From: ${name} <${email}>\nPhone: ${phone||'Not supplied'}\nCategory: ${category}\n\n${message}`});}
    catch(error){console.error('Contact enquiry email could not be delivered:',error.message);}
  }
  res.status(201).json({message:'Your enquiry has been received. Our team will be in touch.'});
});
router.get('/public/content',(_req,res)=>{
  const now=new Date().toISOString().slice(0,10);
  const banners=db.prepare("SELECT id,heading,description,image_path,link FROM banners WHERE active=1 AND (start_date IS NULL OR date(start_date)<=date(?)) AND (end_date IS NULL OR date(end_date)>=date(?)) ORDER BY sort_order,created_at DESC").all(now,now);
  const faqs=db.prepare('SELECT id,question,answer,category FROM faqs ORDER BY sort_order,created_at').all();
  const zones=db.prepare('SELECT id,name FROM service_zones WHERE active=1 ORDER BY name').all();
  const settings=db.prepare('SELECT key,value FROM system_settings WHERE key IN ('+allowedSettings.map(()=>'?').join(',')+')').all(...allowedSettings);
  res.json({banners,faqs,zones,settings:Object.fromEntries(settings.map(s=>[s.key,s.value]))});
});
router.get('/public/faqs',(_req,res)=>res.json({faqs:db.prepare('SELECT id,question,answer,category FROM faqs ORDER BY sort_order,created_at').all()}));
router.get('/public/banners',(_req,res)=>{
  const now=new Date().toISOString().slice(0,10);
  res.json({banners:db.prepare("SELECT id,heading,description,image_path,link FROM banners WHERE active=1 AND (start_date IS NULL OR date(start_date)<=date(?)) AND (end_date IS NULL OR date(end_date)>=date(?)) ORDER BY sort_order,created_at DESC").all(now,now)});
});

router.get('/ops/content/banners',requireAuth,requirePermission('content.manage'),(_req,res)=>res.json({banners:db.prepare('SELECT * FROM banners ORDER BY sort_order,created_at DESC').all()}));
router.post('/ops/content/banners',requireAuth,requirePermission('content.manage'),upload,(req,res)=>{
  const d=req.body||{},heading=String(d.heading||'').trim(),description=String(d.description||'').trim(),link=String(d.link||'').trim();
  if(heading.length<3||heading.length>120)return res.status(400).json({error:'Banner heading must be 3–120 characters.'});
  if(link&&!/^\/(?!\/)|^https:\/\//i.test(link))return res.status(400).json({error:'Use a relative link or a secure HTTPS URL.'});
  const start=d.startDate?String(d.startDate):null,end=d.endDate?String(d.endDate):null;
  if(start&&end&&Date.parse(end)<Date.parse(start))return res.status(400).json({error:'Banner end date must follow its start date.'});
  let image=null;
  if(req.file){try{image=savePublic(req.file).path;}catch(e){return res.status(400).json({error:e.message});}}
  const id=crypto.randomUUID();
  db.prepare('INSERT INTO banners (id,heading,description,image_path,link,start_date,end_date,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?)').run(id,heading,description,image,link||null,start,end,d.active==='false'?0:1,Number(d.sortOrder)||0);
  audit(req.user,'banner.created','banner',id,null,{heading,active:d.active!=='false'},null,req.ip);res.status(201).json({id});
});
router.patch('/ops/content/banners/:id',requireAuth,requirePermission('content.manage'),upload,(req,res)=>{
  const b=db.prepare('SELECT * FROM banners WHERE id=?').get(req.params.id);if(!b)return res.status(404).json({error:'Banner not found.'});
  const d=req.body||{},heading=String(d.heading??b.heading).trim(),description=String(d.description??b.description??''),link=String(d.link??b.link??'').trim();
  if(heading.length<3||heading.length>120)return res.status(400).json({error:'Banner heading must be 3–120 characters.'});
  if(link&&!/^\/(?!\/)|^https:\/\//i.test(link))return res.status(400).json({error:'Use a relative link or a secure HTTPS URL.'});
  let image=b.image_path;if(req.file){try{image=savePublic(req.file).path;}catch(e){return res.status(400).json({error:e.message});}}
  const active=d.active===undefined?b.active:(d.active==='true'||d.active===true?1:0);
  db.prepare('UPDATE banners SET heading=?,description=?,image_path=?,link=?,start_date=?,end_date=?,active=?,sort_order=? WHERE id=?').run(heading,description,image,link||null,d.startDate??b.start_date,d.endDate??b.end_date,active,Number(d.sortOrder??b.sort_order)||0,b.id);
  audit(req.user,'banner.updated','banner',b.id,b,{heading,active},null,req.ip);res.json({ok:true});
});
router.delete('/ops/content/banners/:id',requireAuth,requirePermission('content.manage'),(req,res)=>{
  const b=db.prepare('SELECT * FROM banners WHERE id=?').get(req.params.id);if(!b)return res.status(404).json({error:'Banner not found.'});
  db.prepare('DELETE FROM banners WHERE id=?').run(b.id);audit(req.user,'banner.deleted','banner',b.id,b,null,'Removed from public website',req.ip);res.json({ok:true});
});
router.get('/ops/content/faqs',requireAuth,requirePermission('content.manage'),(_req,res)=>res.json({faqs:db.prepare('SELECT * FROM faqs ORDER BY sort_order,created_at').all()}));
router.post('/ops/content/faqs',requireAuth,requirePermission('content.manage'),(req,res)=>{
  const q=String(req.body?.question||'').trim(),a=String(req.body?.answer||'').trim();if(q.length<5||a.length<10)return res.status(400).json({error:'Add a clear question and answer.'});
  const id=crypto.randomUUID();db.prepare('INSERT INTO faqs (id,question,answer,category,sort_order) VALUES (?,?,?,?,?)').run(id,q.slice(0,300),a.slice(0,3000),String(req.body?.category||'General').slice(0,60),Number(req.body?.sortOrder)||0);audit(req.user,'faq.created','faq',id,null,{question:q},null,req.ip);res.status(201).json({id});
});
router.patch('/ops/content/faqs/:id',requireAuth,requirePermission('content.manage'),(req,res)=>{
  const f=db.prepare('SELECT * FROM faqs WHERE id=?').get(req.params.id);if(!f)return res.status(404).json({error:'FAQ not found.'});
  const q=String(req.body?.question??f.question).trim(),a=String(req.body?.answer??f.answer).trim();if(q.length<5||a.length<10)return res.status(400).json({error:'Add a clear question and answer.'});
  db.prepare('UPDATE faqs SET question=?,answer=?,category=?,sort_order=? WHERE id=?').run(q,a,String(req.body?.category??f.category),Number(req.body?.sortOrder??f.sort_order)||0,f.id);audit(req.user,'faq.updated','faq',f.id,f,req.body,null,req.ip);res.json({ok:true});
});
router.delete('/ops/content/faqs/:id',requireAuth,requirePermission('content.manage'),(req,res)=>{const f=db.prepare('SELECT * FROM faqs WHERE id=?').get(req.params.id);if(!f)return res.status(404).json({error:'FAQ not found.'});db.prepare('DELETE FROM faqs WHERE id=?').run(f.id);audit(req.user,'faq.deleted','faq',f.id,f,null,null,req.ip);res.json({ok:true});});
router.patch('/ops/content/settings',requireAuth,requirePermission('content.manage'),(req,res)=>{
  const updates=req.body||{},result={};
  for(const [key,value] of Object.entries(updates)){
    if(!allowedSettings.includes(key))return res.status(400).json({error:`Setting ${key} cannot be changed here.`});
    const str=String(value??'').trim();if(str.length>1200)return res.status(400).json({error:`${key} is too long.`});
    if(['public_email'].includes(key)&&str&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str))return res.status(400).json({error:'Enter a valid public email address.'});
    db.prepare('INSERT INTO system_settings (key,value,updated_at) VALUES (?,?,datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').run(key,str);result[key]=str;
  }
  audit(req.user,'public_content.settings_updated','system_settings','public_content',null,result,null,req.ip);res.json({settings:result});
});

router.get('/ops/contact-messages',requireAuth,requirePermission('support.manage'),(_req,res)=>res.json({messages:db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 300').all()}));
router.post('/ops/contact-messages/:id/status',requireAuth,requirePermission('support.manage'),(req,res)=>{
  const status=String(req.body?.status||'');if(!['new','contacted','resolved','spam'].includes(status))return res.status(400).json({error:'Invalid enquiry status.'});
  const msg=db.prepare('SELECT * FROM contact_messages WHERE id=?').get(req.params.id);if(!msg)return res.status(404).json({error:'Enquiry not found.'});
  db.prepare('UPDATE contact_messages SET status=? WHERE id=?').run(status,msg.id);audit(req.user,'contact_message.status_changed','contact_message',msg.id,{status:msg.status},{status},String(req.body?.reason||''),req.ip);res.json({status});
});

export default router;
