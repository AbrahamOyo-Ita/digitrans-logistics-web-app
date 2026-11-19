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
  return {single(field){return async(req,_res,next)=>{try{const type=String(req.headers['content-type']||'');const boundary=type.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[1]||type.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[2];if(!boundary)throw new Error('Invalid multipart upload.');const chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks);if(raw.length>maxBytes+1024*1024){const error=new Error('The file is too large.');error.code='LIMIT_FILE_SIZE';throw error;}const marker=Buffer.from(`--${boundary}`);let cursor=0;while((cursor=raw.indexOf(marker,cursor))>=0){const start=cursor+marker.length;if(raw[start]===45&&raw[start+1]===45)break;const bodyStart=raw.indexOf(Buffer.from('\r\n\r\n'),start);if(bodyStart<0)break;const bodyEnd=raw.indexOf(marker,bodyStart+4);if(bodyEnd<0)break;const headerText=raw.subarray(start,bodyStart).toString('utf8');const body=raw.subarray(bodyStart+4,Math.max(bodyStart+4,bodyEnd-2));const disposition=headerText.match(/name="([^"]+)"/i)?.[1];const filename=headerText.match(/filename="([^"]*)"/i)?.[1];const mimetype=headerText.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim()||'application/octet-stream';if(disposition===field&&filename){if(!allowed.has(mimetype))throw new Error(message);if(body.length>maxBytes){const error=new Error('The file is too large.');error.code='LIMIT_FILE_SIZE';throw error;}req.file={fieldname:field,originalname:filename,mimetype,encoding:'7bit',buffer:body,size:body.length};}else if(disposition){req.body??={};req.body[disposition]=body.toString('utf8');}cursor=bodyEnd;}next();}catch(error){next(error);}};}};
}
export const documentUpload=buildUpload(allowedDocuments,10*1024*1024,'Upload a PDF, JPG, PNG or WebP file.');
export const imageUpload=buildUpload(allowedImages,5*1024*1024,'Upload a JPG, PNG or WebP image.');
export const publicSiteImageUpload=buildUpload(allowedImages,2*1024*1024,'Public banner images must be JPG, PNG or WebP files no larger than 2 MB.');
