import {asyncRouter} from '../async-router.js';
import crypto from 'node:crypto';
import db from '../db.js';
import {requireAuth,requireRole,requirePermission} from '../auth.js';
import {documentUpload,imageUpload} from '../uploads.js';
import {PRIVATE_BUCKETS,uploadPrivateObject,uploadPrivateImage,createPrivateSignedUrl,deletePrivateObject} from '../storage.js';

const router=asyncRouter();
const id=()=>crypto.randomUUID();
async function permissionFor(user,permission){
  if(user.role==='super_admin')return true;
  return !!(await db.prepare('SELECT 1 FROM public.role_permissions rp JOIN public.roles r ON r.id=rp.role_id JOIN public.permissions p ON p.id=rp.permission_id WHERE r.name=? AND p.key=?').get(user.role,permission));
}
function uploadError(err,res){
  if(err?.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'The file is too large. Choose a smaller file.'});
  return res.status(400).json({error:err?.message||'Unable to upload this file.'});
}
function uploadMiddleware(upload){
  return (req,res,next)=>upload.single('file')(req,res,err=>err?uploadError(err,res):next());
}
function objectOwner(path){return String(path||'').split('/')[0]||'';}
async function removeIfPresent(bucket,path,ownerId){
  if(!path)return;
  try{await deletePrivateObject(bucket,path,{authorized:true,ownerId});}catch(error){console.warn('Unused storage object cleanup failed:',error.message);}
}
async function storeDocument({req,res,bucket,table,ownerColumn,docType,allowedTypes}){
  if(!req.file)return res.status(400).json({error:'Choose a document to upload.'});
  const type=String(req.body?.docType||docType||'');
  if(allowedTypes&&!allowedTypes.includes(type))return res.status(400).json({error:'Choose a supported document type.'});
  const docId=id(),stored=await uploadPrivateObject(bucket,{ownerId:req.user.id,recordId:docId,file:req.file,authorized:true});
  try{
    await db.prepare(`INSERT INTO public.${table} (id,${ownerColumn},doc_type,file_path) VALUES (?,?,?,?)`).run(docId,req.user.id,type,stored.path);
  }catch(error){await removeIfPresent(bucket,stored.path,req.user.id);throw error;}
  res.status(201).json({id:docId,docType:type,status:'pending',message:'Document uploaded securely.'});
}

router.post('/rider/documents',requireAuth,requireRole('rider'),uploadMiddleware(documentUpload),async(req,res)=>storeDocument({req,res,bucket:PRIVATE_BUCKETS.rider,table:'rider_documents',ownerColumn:'rider_id',docType:'identity',allowedTypes:['national_id','drivers_license','voter_id','passport','vehicle_document','guarantor_id','other']}));
router.get('/rider/documents',requireAuth,requireRole('rider'),async(req,res)=>res.json({documents:await db.prepare('SELECT id,doc_type,status,created_at FROM public.rider_documents WHERE rider_id=? ORDER BY created_at DESC').all(req.user.id)}));

router.post('/vendor/documents',requireAuth,requireRole('vendor'),uploadMiddleware(documentUpload),async(req,res)=>storeDocument({req,res,bucket:PRIVATE_BUCKETS.vendor,table:'vendor_documents',ownerColumn:'vendor_id',docType:'business_registration',allowedTypes:['business_registration','business_permit','tax_document','other']}));
router.get('/vendor/documents',requireAuth,requireRole('vendor'),async(req,res)=>res.json({documents:await db.prepare('SELECT id,doc_type,status,created_at FROM public.vendor_documents WHERE vendor_id=? ORDER BY created_at DESC').all(req.user.id)}));

router.post('/investor/documents',requireAuth,requireRole('investor'),uploadMiddleware(documentUpload),async(req,res)=>storeDocument({req,res,bucket:PRIVATE_BUCKETS.investor,table:'investor_documents',ownerColumn:'investor_id',docType:'identity'}));
router.get('/investor/documents',requireAuth,requireRole('investor'),async(req,res)=>res.json({documents:await db.prepare('SELECT id,doc_type,status,created_at FROM public.investor_documents WHERE investor_id=? ORDER BY created_at DESC').all(req.user.id)}));

router.post('/student/documents',requireAuth,requireRole('student'),uploadMiddleware(documentUpload),async(req,res)=>storeDocument({req,res,bucket:PRIVATE_BUCKETS.identity,table:'student_documents',ownerColumn:'user_id',docType:'student_id'}));
router.get('/student/documents',requireAuth,requireRole('student'),async(req,res)=>res.json({documents:await db.prepare('SELECT id,doc_type,status,created_at FROM public.student_documents WHERE user_id=? ORDER BY created_at DESC').all(req.user.id)}));

router.post('/rider/jobs/:deliveryId/proof-upload',requireAuth,requireRole('rider'),uploadMiddleware(imageUpload),async(req,res)=>{
  const assigned=await db.prepare(`SELECT d.status FROM public.deliveries d JOIN public.delivery_assignments da ON da.delivery_id=d.id WHERE d.id=? AND da.rider_id=? AND da.status IN ('accepted','assigned')`).get(req.params.deliveryId,req.user.id);
  if(!assigned)return res.status(404).json({error:'Delivery not found.'});
  if(!req.file)return res.status(400).json({error:'Choose a delivery photo.'});
  const recipient=String(req.body?.recipientName||'').trim();if(recipient.length<2)return res.status(400).json({error:'Enter the recipient name.'});
  const existing=await db.prepare('SELECT id,photo_path FROM public.delivery_proof WHERE delivery_id=?').get(req.params.deliveryId);
  const proofId=existing?.id||id(),stored=await uploadPrivateImage(PRIVATE_BUCKETS.deliveryProof,{ownerId:req.user.id,recordId:req.params.deliveryId,file:req.file,authorized:true});
  try{
    if(existing)await db.prepare('UPDATE public.delivery_proof SET recipient_name=?,photo_path=?,notes=? WHERE id=?').run(recipient,stored.path,String(req.body?.notes||'').slice(0,500),existing.id);
    else await db.prepare('INSERT INTO public.delivery_proof (id,delivery_id,recipient_name,photo_path,notes) VALUES (?,?,?,?,?)').run(proofId,req.params.deliveryId,recipient,stored.path,String(req.body?.notes||'').slice(0,500));
  }catch(error){await removeIfPresent(PRIVATE_BUCKETS.deliveryProof,stored.path,req.user.id);throw error;}
  if(existing?.photo_path)await removeIfPresent(PRIVATE_BUCKETS.deliveryProof,existing.photo_path,req.user.id);
  res.status(201).json({message:'Photo proof saved securely.'});
});

router.post('/ops/market-runs/:runId/expenses/:expenseId/receipt',requireAuth,requirePermission('market_runs.manage'),uploadMiddleware(imageUpload),async(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Choose a receipt image.'});
  const expense=await db.prepare('SELECT id,receipt_path FROM public.market_run_expenses WHERE id=? AND market_run_id=?').get(req.params.expenseId,req.params.runId);
  if(!expense)return res.status(404).json({error:'Expense not found.'});
  const stored=await uploadPrivateImage(PRIVATE_BUCKETS.marketRunReceipt,{ownerId:req.user.id,recordId:expense.id,file:req.file,authorized:true});
  try{await db.prepare('UPDATE public.market_run_expenses SET receipt_path=? WHERE id=?').run(stored.path,expense.id);}
  catch(error){await removeIfPresent(PRIVATE_BUCKETS.marketRunReceipt,stored.path,req.user.id);throw error;}
  if(expense.receipt_path)await removeIfPresent(PRIVATE_BUCKETS.marketRunReceipt,expense.receipt_path,objectOwner(expense.receipt_path));
  res.json({message:'Receipt uploaded securely.'});
});

router.get('/private-files/:fileId',requireAuth,async(req,res)=>{
  const key=req.params.fileId;
  let row,storagePath,bucket,ownerId,allowed=false;
  row=await db.prepare('SELECT id,rider_id,file_path FROM public.rider_documents WHERE id=?').get(key);
  if(row){storagePath=row.file_path;bucket=PRIVATE_BUCKETS.rider;ownerId=row.rider_id;allowed=req.user.id===row.rider_id||await permissionFor(req.user,'riders.review');}
  if(!row){row=await db.prepare('SELECT id,vendor_id,file_path FROM public.vendor_documents WHERE id=?').get(key);if(row){storagePath=row.file_path;bucket=PRIVATE_BUCKETS.vendor;ownerId=row.vendor_id;allowed=req.user.id===row.vendor_id||await permissionFor(req.user,'vendors.review');}}
  if(!row){row=await db.prepare('SELECT id,user_id,file_path FROM public.student_documents WHERE id=?').get(key);if(row){storagePath=row.file_path;bucket=PRIVATE_BUCKETS.identity;ownerId=row.user_id;allowed=req.user.id===row.user_id||await permissionFor(req.user,'students.review');}}
  if(!row){row=await db.prepare('SELECT id,investor_id,file_path FROM public.investor_documents WHERE id=?').get(key);if(row){storagePath=row.file_path;bucket=PRIVATE_BUCKETS.investor;ownerId=row.investor_id;allowed=req.user.id===row.investor_id||await permissionFor(req.user,'investments.manage');}}
  if(!row){row=await db.prepare(`SELECT p.id,p.photo_path,d.customer_id,d.vendor_id,da.rider_id FROM public.delivery_proof p JOIN public.deliveries d ON d.id=p.delivery_id LEFT JOIN public.delivery_assignments da ON da.delivery_id=d.id AND da.status IN ('accepted','completed') WHERE p.id=?`).get(key);if(row?.photo_path){storagePath=row.photo_path;bucket=PRIVATE_BUCKETS.deliveryProof;ownerId=row.rider_id||objectOwner(storagePath);allowed=req.user.id===row.customer_id||req.user.id===row.vendor_id||req.user.id===row.rider_id||await permissionFor(req.user,'deliveries.read');}}
  if(!row){row=await db.prepare('SELECT e.id,e.receipt_path,m.customer_id FROM public.market_run_expenses e JOIN public.market_runs m ON m.id=e.market_run_id WHERE e.id=?').get(key);if(row?.receipt_path){storagePath=row.receipt_path;bucket=PRIVATE_BUCKETS.marketRunReceipt;ownerId=objectOwner(storagePath);allowed=req.user.id===row.customer_id||await permissionFor(req.user,'market_runs.manage')||await permissionFor(req.user,'finance.read');}}
  if(!allowed||!storagePath||!bucket)return res.status(404).json({error:'File not found.'});
  const {signedUrl}=await createPrivateSignedUrl(bucket,storagePath,{authorized:true,ownerId,expiresIn:120});
  res.setHeader('Cache-Control','private, no-store');res.setHeader('Referrer-Policy','no-referrer');
  res.redirect(302,signedUrl);
});

export default router;
