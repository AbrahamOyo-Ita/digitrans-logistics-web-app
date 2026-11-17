import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';

const root=path.dirname(fileURLToPath(import.meta.url));
const configuredUploadRoot=process.env.UPLOADS_DIR;
if(process.env.NODE_ENV==='production'&&(!configuredUploadRoot||!path.isAbsolute(configuredUploadRoot)))throw new Error('UPLOADS_DIR must point to an absolute persistent volume path in production.');
export const uploadRoot=configuredUploadRoot?path.resolve(configuredUploadRoot):path.join(root,'..','uploads');
export const privateDir=path.join(uploadRoot,'private');
export const publicDir=path.join(uploadRoot,'public');
fs.mkdirSync(privateDir,{recursive:true});fs.mkdirSync(publicDir,{recursive:true});
const allowed={
  'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'
};
const signatures={
  'application/pdf':buffer=>buffer.subarray(0,5).toString('ascii')==='%PDF-',
  'image/jpeg':buffer=>buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff,
  'image/png':buffer=>buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),
  'image/webp':buffer=>buffer.length>=12&&buffer.subarray(0,4).toString('ascii')==='RIFF'&&buffer.subarray(8,12).toString('ascii')==='WEBP',
};
export function hasValidFileSignature(file){
  return Boolean(file?.buffer&&signatures[file.mimetype]?.(file.buffer));
}
function fileFilter(_req,file,cb){
  if(!allowed[file.mimetype])return cb(new Error('Upload a PDF, JPG, PNG or WebP file.'));
  cb(null,true);
}
export const documentUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1},fileFilter});
export const imageUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter:(_req,file,cb)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.mimetype))return cb(new Error('Upload a JPG, PNG or WebP image.'));cb(null,true);
}});
export function savePrivate(file){
  if(!file||!allowed[file.mimetype]||!hasValidFileSignature(file))throw Object.assign(new Error('The file content does not match an allowed document type.'),{status:400});
  const name=`${crypto.randomUUID()}${allowed[file.mimetype]}`;
  const full=path.join(privateDir,name);
  fs.writeFileSync(full,file.buffer,{flag:'wx'});
  return {name,path:`uploads/private/${name}`,mime:file.mimetype,size:file.size};
}
export function savePublic(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.mimetype)||!hasValidFileSignature(file))throw Object.assign(new Error('The image content does not match an allowed image type.'),{status:400});
  const ext=allowed[file.mimetype],name=`${crypto.randomUUID()}${ext}`;
  fs.writeFileSync(path.join(publicDir,name),file.buffer,{flag:'wx'});
  return {name,path:`/uploads/public/${name}`,mime:file.mimetype,size:file.size};
}
export function safeLocalPath(value){
  const name=path.basename(String(value||''));
  const result=path.resolve(privateDir,name);
  if(!result.startsWith(`${path.resolve(privateDir)}${path.sep}`))return null;
  return result;
}
