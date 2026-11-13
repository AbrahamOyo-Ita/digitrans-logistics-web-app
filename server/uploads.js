import multer from 'multer';

const allowedDocuments=new Set(['application/pdf','image/jpeg','image/png','image/webp']);
const allowedImages=new Set(['image/jpeg','image/png','image/webp']);
const signatures={
  'application/pdf':buffer=>buffer.subarray(0,5).toString('ascii')==='%PDF-',
  'image/jpeg':buffer=>buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff,
  'image/png':buffer=>buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),
  'image/webp':buffer=>buffer.length>=12&&buffer.subarray(0,4).toString('ascii')==='RIFF'&&buffer.subarray(8,12).toString('ascii')==='WEBP',
};
export function hasValidFileSignature(file){return Boolean(file?.buffer&&signatures[file.mimetype]?.(file.buffer));}
function buildUpload(allowed,maxBytes,message){
  return multer({storage:multer.memoryStorage(),limits:{fileSize:maxBytes,files:1},fileFilter(_req,file,callback){
    if(!allowed.has(file.mimetype))return callback(new Error(message));
    callback(null,true);
  }});
}
export const documentUpload=buildUpload(allowedDocuments,10*1024*1024,'Upload a PDF, JPG, PNG or WebP file.');
export const imageUpload=buildUpload(allowedImages,5*1024*1024,'Upload a JPG, PNG or WebP image.');
export const publicSiteImageUpload=buildUpload(allowedImages,2*1024*1024,'Public banner images must be JPG, PNG or WebP files no larger than 2 MB.');
