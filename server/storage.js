import crypto from 'node:crypto';
import {getSupabaseAdmin,readSupabaseConfig} from './supabase.js';

export const PRIVATE_BUCKETS=Object.freeze({
  identity:'identity-documents',
  rider:'rider-documents',
  vendor:'vendor-documents',
  investor:'investor-documents',
  deliveryProof:'delivery-proof',
  marketRunReceipt:'market-run-receipts',
});
export const PUBLIC_SITE_BUCKET='public-site-assets';
const allowedDocuments=new Map([
  ['application/pdf','.pdf'],['image/jpeg','.jpg'],['image/png','.png'],['image/webp','.webp'],
]);
const allowedImages=new Map([
  ['image/jpeg','.jpg'],['image/png','.png'],['image/webp','.webp'],
]);
const privateBucketNames=new Set(Object.values(PRIVATE_BUCKETS));
let storageClientProvider=getSupabaseAdmin;
const signatures={
  'application/pdf':buffer=>buffer.subarray(0,5).toString('ascii')==='%PDF-',
  'image/jpeg':buffer=>buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff,
  'image/png':buffer=>buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),
  'image/webp':buffer=>buffer.length>=12&&buffer.subarray(0,4).toString('ascii')==='RIFF'&&buffer.subarray(8,12).toString('ascii')==='WEBP',
};

function storageError(error){
  const status=Number(error?.statusCode||error?.status)||0;
  if(status===404)return Object.assign(new Error('Stored file not found.'),{status:404});
  if(status===413)return Object.assign(new Error('The file is too large.'),{status:413});
  if(status===409)return Object.assign(new Error('A file already exists at that path.'),{status:409});
  return Object.assign(new Error('Secure file storage is temporarily unavailable.'),{status:status>=500||!status?503:400});
}
function safeSegment(value,label){
  const segment=String(value||'');
  if(!/^[A-Za-z0-9_-]{1,80}$/.test(segment)||segment==='.'||segment==='..')throw Object.assign(new Error(`${label} is invalid.`),{status:400});
  return segment;
}
function safeOwnerId(value){
  const owner=safeSegment(value,'Owner ID');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(owner))throw Object.assign(new Error('Owner ID is invalid.'),{status:400});
  return owner.toLowerCase();
}
function safeObjectPath(value){
  const path=String(value||'');
  if(path.startsWith('/')||path.includes('\\')||path.split('/').some(part=>!part||part==='.'||part==='..')||path.length>512)throw Object.assign(new Error('Stored file path is invalid.'),{status:400});
  return path;
}
function validateUpload(file,allowed,maxBytes){
  if(!file?.buffer||!Buffer.isBuffer(file.buffer))throw Object.assign(new Error('Choose a file to upload.'),{status:400});
  const extension=allowed.get(String(file.mimetype||''));
  if(!extension||!signatures[file.mimetype]?.(file.buffer))throw Object.assign(new Error('The file content does not match an allowed file type.'),{status:400});
  if(file.buffer.length<1||file.buffer.length>maxBytes)throw Object.assign(new Error('The file exceeds the allowed size.'),{status:413});
  return {extension,mimeType:file.mimetype,size:file.buffer.length};
}
function ensurePrivateBucket(bucket){
  if(!privateBucketNames.has(bucket))throw Object.assign(new Error('Private storage bucket is not allowed.'),{status:400});
}
function requireAuthorization(authorized){
  if(authorized!==true)throw Object.assign(new Error('File access is not authorized.'),{status:403});
}
function ensureOwnerPath(objectPath,ownerId){
  const owner=safeOwnerId(ownerId);
  if(objectPath.split('/')[0]!==owner)throw Object.assign(new Error('The requested file is not available.'),{status:404});
}

export function configureStorageForTests(provider){storageClientProvider=provider||getSupabaseAdmin;}

export function makePrivateObjectPath({ownerId,recordId,extension}){
  const owner=safeOwnerId(ownerId),record=safeSegment(recordId,'Record ID');
  if(!/^\.[a-z0-9]{2,5}$/.test(extension))throw Object.assign(new Error('File extension is invalid.'),{status:400});
  return `${owner}/${record}/${crypto.randomUUID()}${extension}`;
}

export async function uploadPrivateObject(bucket,{ownerId,recordId,file,authorized=false}){
  ensurePrivateBucket(bucket);
  requireAuthorization(authorized);
  const imageOnly=bucket===PRIVATE_BUCKETS.deliveryProof||bucket===PRIVATE_BUCKETS.marketRunReceipt;
  const {extension,mimeType,size}=validateUpload(file,imageOnly?allowedImages:allowedDocuments,imageOnly?5*1024*1024:10*1024*1024);
  const path=makePrivateObjectPath({ownerId,recordId,extension});
  try{
    const {data,error}=await storageClientProvider().storage.from(bucket).upload(path,file.buffer,{contentType:mimeType,upsert:false,cacheControl:'0'});
    if(error)throw storageError(error);
    return {path:data.path,bucket,mimeType,size};
  }catch(error){if(error?.status)throw error;throw storageError(error);}
}

export async function uploadPrivateImage(bucket,{ownerId,recordId,file,authorized=false}){
  ensurePrivateBucket(bucket);
  requireAuthorization(authorized);
  const {extension,mimeType,size}=validateUpload(file,allowedImages,5*1024*1024);
  const path=makePrivateObjectPath({ownerId,recordId,extension});
  try{
    const {data,error}=await storageClientProvider().storage.from(bucket).upload(path,file.buffer,{contentType:mimeType,upsert:false,cacheControl:'0'});
    if(error)throw storageError(error);
    return {path:data.path,bucket,mimeType,size};
  }catch(error){if(error?.status)throw error;throw storageError(error);}
}

export async function createPrivateSignedUrl(bucket,objectPath,{authorized=false,ownerId,expiresIn=900}={}){
  ensurePrivateBucket(bucket);
  const path=safeObjectPath(objectPath);
  if(authorized!==true)throw Object.assign(new Error('File access is not authorized.'),{status:403});
  if(ownerId===undefined)throw Object.assign(new Error('Stored file owner is required.'),{status:400});
  ensureOwnerPath(path,ownerId);
  const ttl=Number(expiresIn);
  if(!Number.isInteger(ttl)||ttl<30||ttl>900)throw Object.assign(new Error('Signed URL expiry must be from 30 to 900 seconds.'),{status:400});
  try{
    const {data,error}=await storageClientProvider().storage.from(bucket).createSignedUrl(path,ttl);
    if(error)throw storageError(error);
    return {signedUrl:data.signedUrl,expiresIn:ttl};
  }catch(error){if(error?.status)throw error;throw storageError(error);}
}

export async function deletePrivateObject(bucket,objectPath,{authorized=false,ownerId}={}){
  ensurePrivateBucket(bucket);
  const path=safeObjectPath(objectPath);
  if(authorized!==true)throw Object.assign(new Error('File access is not authorized.'),{status:403});
  if(ownerId===undefined)throw Object.assign(new Error('Stored file owner is required.'),{status:400});
  ensureOwnerPath(path,ownerId);
  try{
    const {error}=await storageClientProvider().storage.from(bucket).remove([path]);
    if(error)throw storageError(error);
    return {deleted:true};
  }catch(error){if(error?.status)throw error;throw storageError(error);}
}

export async function uploadPublicSiteImage({recordId,file,authorized=false}){
  requireAuthorization(authorized);
  const {extension,mimeType,size}=validateUpload(file,allowedImages,2*1024*1024);
  const record=safeSegment(recordId,'Record ID');
  const path=`${record}/${crypto.randomUUID()}${extension}`;
  try{
    const {data,error}=await storageClientProvider().storage.from(PUBLIC_SITE_BUCKET).upload(path,file.buffer,{contentType:mimeType,upsert:false,cacheControl:'3600'});
    if(error)throw storageError(error);
    const {data:publicData}=storageClientProvider().storage.from(PUBLIC_SITE_BUCKET).getPublicUrl(data.path);
    return {path:data.path,publicUrl:publicData.publicUrl,mimeType,size};
  }catch(error){if(error?.status)throw error;throw storageError(error);}
}

export async function deletePublicSiteImage(publicUrl,{authorized=false}={}){
  requireAuthorization(authorized);
  let parsed;
  try{parsed=new URL(String(publicUrl||''));}catch{throw Object.assign(new Error('Stored public image URL is invalid.'),{status:400});}
  const {url:projectUrl}=readSupabaseConfig();
  const prefix=`${new URL(projectUrl).origin}/storage/v1/object/public/${PUBLIC_SITE_BUCKET}/`;
  if(parsed.origin!==new URL(projectUrl).origin||!parsed.href.startsWith(prefix))throw Object.assign(new Error('Stored public image URL is outside the DigiTrans public-assets bucket.'),{status:400});
  const objectPath=safeObjectPath(decodeURIComponent(parsed.pathname.slice(`/storage/v1/object/public/${PUBLIC_SITE_BUCKET}/`.length)));
  try{
    const {error}=await storageClientProvider().storage.from(PUBLIC_SITE_BUCKET).remove([objectPath]);
    if(error)throw storageError(error);
    return {deleted:true};
  }catch(error){if(error?.status)throw error;throw storageError(error);}
}
