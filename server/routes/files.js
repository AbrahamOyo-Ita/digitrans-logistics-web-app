import { Router } from 'express';
import fs from 'fs';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requireRole, requirePermission } from '../auth.js';
import { documentUpload, imageUpload, savePrivate, safeLocalPath } from '../uploads.js';

const router=Router();
const id=()=>crypto.randomUUID();
function permissionFor(user,permission){
  if(user.role==='super_admin')return true;
  return !!db.prepare(`SELECT 1 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.name=? AND p.key=?`).get(user.role,permission);
}
function uploadError(err,res){
  if(err?.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'The file is too large. Choose a smaller file.'});
  return res.status(400).json({error:err?.message||'Unable to upload this file.'});
}

router.post('/rider/documents',requireAuth,requireRole('rider'),(req,res,next)=>documentUpload.single('file')(req,res,err=>err?uploadError(err,res):next()),(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Choose a document to upload.'});
  const type=String(req.body?.docType||'');
  if(!['national_id','drivers_license','voter_id','passport','vehicle_document','guarantor_id','other'].includes(type))return res.status(400).json({error:'Choose a supported document type.'});
  const file=savePrivate(req.file),docId=id();
  db.prepare('INSERT INTO rider_documents (id,rider_id,doc_type,file_path) VALUES (?,?,?,?)').run(docId,req.user.id,type,file.path);
  res.status(201).json({id:docId,docType:type,status:'pending',message:'Document uploaded securely.'});
});
router.get('/rider/documents',requireAuth,requireRole('rider'),(req,res)=>res.json({documents:db.prepare('SELECT id,doc_type,status,created_at FROM rider_documents WHERE rider_id=? ORDER BY created_at DESC').all(req.user.id)}));

router.post('/vendor/documents',requireAuth,requireRole('vendor'),(req,res,next)=>documentUpload.single('file')(req,res,err=>err?uploadError(err,res):next()),(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Choose a document to upload.'});
  const type=String(req.body?.docType||'business_registration');
  if(!['business_registration','business_permit','tax_document','other'].includes(type))return res.status(400).json({error:'Choose a supported business document type.'});
  const file=savePrivate(req.file),docId=id();
  db.prepare('INSERT INTO vendor_documents (id,vendor_id,doc_type,file_path) VALUES (?,?,?,?)').run(docId,req.user.id,type,file.path);
  res.status(201).json({id:docId,docType:type,status:'pending'});
});
router.get('/vendor/documents',requireAuth,requireRole('vendor'),(req,res)=>res.json({documents:db.prepare('SELECT id,doc_type,status,created_at FROM vendor_documents WHERE vendor_id=? ORDER BY created_at DESC').all(req.user.id)}));

router.post('/investor/documents',requireAuth,requireRole('investor'),(req,res,next)=>documentUpload.single('file')(req,res,err=>err?uploadError(err,res):next()),(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Choose an identity document to upload.'});
  const file=savePrivate(req.file),docId=id();
  db.prepare('INSERT INTO investor_documents (id,investor_id,doc_type,file_path) VALUES (?,?,?,?)').run(docId,req.user.id,String(req.body?.docType||'identity').slice(0,60),file.path);
  res.status(201).json({id:docId,status:'pending'});
});
router.get('/investor/documents',requireAuth,requireRole('investor'),(req,res)=>res.json({documents:db.prepare('SELECT id,doc_type,status,created_at FROM investor_documents WHERE investor_id=? ORDER BY created_at DESC').all(req.user.id)}));

router.post('/student/documents',requireAuth,requireRole('student'),(req,res,next)=>documentUpload.single('file')(req,res,err=>err?uploadError(err,res):next()),(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Choose your current student ID document.'});
  const file=savePrivate(req.file),docId=id();
  db.prepare('INSERT INTO student_documents (id,user_id,doc_type,file_path) VALUES (?,?,?,?)').run(docId,req.user.id,String(req.body?.docType||'student_id').slice(0,60),file.path);
  res.status(201).json({id:docId,status:'pending'});
});
router.get('/student/documents',requireAuth,requireRole('student'),(req,res)=>res.json({documents:db.prepare('SELECT id,doc_type,status,created_at FROM student_documents WHERE user_id=? ORDER BY created_at DESC').all(req.user.id)}));

router.post('/rider/jobs/:deliveryId/proof-upload',requireAuth,requireRole('rider'),(req,res,next)=>imageUpload.single('file')(req,res,err=>err?uploadError(err,res):next()),(req,res)=>{
  const assigned=db.prepare(`SELECT d.status FROM deliveries d JOIN delivery_assignments da ON da.delivery_id=d.id WHERE d.id=? AND da.rider_id=? AND da.status IN ('accepted','assigned')`).get(req.params.deliveryId,req.user.id);
  if(!assigned)return res.status(404).json({error:'Delivery not found.'});
  if(!req.file)return res.status(400).json({error:'Choose a delivery photo.'});
  const recipient=String(req.body?.recipientName||'').trim();if(recipient.length<2)return res.status(400).json({error:'Enter the recipient name.'});
  const file=savePrivate(req.file),existing=db.prepare('SELECT id FROM delivery_proof WHERE delivery_id=?').get(req.params.deliveryId);
  if(existing)db.prepare('UPDATE delivery_proof SET recipient_name=?,photo_path=?,notes=? WHERE id=?').run(recipient,file.path,String(req.body?.notes||'').slice(0,500),existing.id);
  else db.prepare('INSERT INTO delivery_proof (id,delivery_id,recipient_name,photo_path,notes) VALUES (?,?,?,?,?)').run(id(),req.params.deliveryId,recipient,file.path,String(req.body?.notes||'').slice(0,500));
  res.status(201).json({message:'Photo proof saved securely.'});
});

router.post('/ops/market-runs/:runId/expenses/:expenseId/receipt',requireAuth,requirePermission('market_runs.manage'),(req,res,next)=>imageUpload.single('file')(req,res,err=>err?uploadError(err,res):next()),(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Choose a receipt image.'});
  const e=db.prepare('SELECT id FROM market_run_expenses WHERE id=? AND market_run_id=?').get(req.params.expenseId,req.params.runId);
  if(!e)return res.status(404).json({error:'Expense not found.'});
  const file=savePrivate(req.file);
  db.prepare('UPDATE market_run_expenses SET receipt_path=? WHERE id=?').run(file.path,e.id);
  res.json({message:'Receipt uploaded securely.'});
});

router.get('/private-files/:fileId',requireAuth,(req,res)=>{
  const key=req.params.fileId;
  let filePath=null,mime='application/octet-stream',allowed=false;
  let row=db.prepare('SELECT id,rider_id,file_path FROM rider_documents WHERE id=?').get(key);
  if(row){filePath=row.file_path;allowed=req.user.id===row.rider_id||permissionFor(req.user,'riders.review');}
  if(!row){row=db.prepare('SELECT id,vendor_id,file_path FROM vendor_documents WHERE id=?').get(key);if(row){filePath=row.file_path;allowed=req.user.id===row.vendor_id||permissionFor(req.user,'vendors.review');}}
  if(!row){row=db.prepare('SELECT id,user_id,file_path FROM student_documents WHERE id=?').get(key);if(row){filePath=row.file_path;allowed=req.user.id===row.user_id||permissionFor(req.user,'students.review');}}
  if(!row){row=db.prepare('SELECT id,investor_id,file_path FROM investor_documents WHERE id=?').get(key);if(row){filePath=row.file_path;allowed=req.user.id===row.investor_id||permissionFor(req.user,'investments.manage');}}
  if(!row){row=db.prepare('SELECT p.id,p.photo_path,d.customer_id,d.vendor_id,da.rider_id FROM delivery_proof p JOIN deliveries d ON d.id=p.delivery_id LEFT JOIN delivery_assignments da ON da.delivery_id=d.id AND da.status IN (\'accepted\',\'completed\') WHERE p.id=?').get(key);if(row?.photo_path){filePath=row.photo_path;allowed=req.user.id===row.customer_id||req.user.id===row.vendor_id||req.user.id===row.rider_id||permissionFor(req.user,'deliveries.read');}}
  if(!row){row=db.prepare('SELECT e.id,e.receipt_path,m.customer_id FROM market_run_expenses e JOIN market_runs m ON m.id=e.market_run_id WHERE e.id=?').get(key);if(row?.receipt_path){filePath=row.receipt_path;allowed=req.user.id===row.customer_id||permissionFor(req.user,'market_runs.manage')||permissionFor(req.user,'finance.read');}}
  if(!allowed||!filePath)return res.status(404).json({error:'File not found.'});
  const full=safeLocalPath(filePath);if(!full||!fs.existsSync(full))return res.status(404).json({error:'File not found.'});
  const ext=full.split('.').pop().toLowerCase();mime=ext==='pdf'?'application/pdf':ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg';
  res.setHeader('Content-Type',mime);res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Disposition',mime==='application/pdf'?'inline':'inline');
  res.sendFile(full);
});

export default router;
