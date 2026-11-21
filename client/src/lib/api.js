export class ApiError extends Error {
  constructor(message,status=500,details=null){super(message);this.status=status;this.details=details;}
}

const apiOrigin=String(import.meta.env.VITE_API_BASE_URL||'').trim().replace(/\/+$/,'');
const notifyConnection=event=>{if(typeof window!=='undefined')window.dispatchEvent(new Event(`digitrans:network-${event}`));};
export function apiUrl(path){
  if(/^https?:\/\//i.test(path))return path;
  const normalized=String(path||'').startsWith('/')?String(path):`/${path}`;
  return `${apiOrigin}/api${normalized}`;
}
export function mediaUrl(path){
  if(!path)return '';
  if(/^(https?:|data:|blob:)/i.test(path))return path;
  const normalized=String(path).startsWith('/')?String(path):`/${path}`;
  return `${apiOrigin}${normalized}`;
}

export async function api(path,options={}){
  const headers={...(options.body&&!(options.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(options.headers||{})};
  let res;
  try{
    res=await fetch(apiUrl(path),{credentials:'include',...options,headers,body:options.body&&!(options.body instanceof FormData)?JSON.stringify(options.body):options.body});
  }catch(error){
    if(error?.name==='AbortError')throw new ApiError('The request took too long. Please try again.',504,{cause:'timeout'});
    notifyConnection('error');
    throw new ApiError('DigiTrans services are temporarily unavailable. Please try again shortly.',503,{cause:error?.name||'network_error'});
  }
  const contentType=String(res.headers.get('content-type')||'').toLowerCase();
  if(!contentType.includes('application/json')){
    notifyConnection('error');
    throw new ApiError('DigiTrans account services are not connected to this deployment yet. Please try again shortly.',502,{contentType});
  }
  let payload={};try{payload=await res.json();}catch{}
  if(!res.ok)throw new ApiError(payload.error||'Something went wrong. Please try again.',res.status,payload.details||null);
  notifyConnection('restored');
  return payload;
}
export async function startCheckout(serviceType,recordId){
  const checkout=await api('/payments/initiate',{method:'POST',body:{serviceType,recordId}});
  if(!checkout.authorizationUrl)throw new ApiError('The payment provider did not return a checkout link.',502);
  window.location.assign(checkout.authorizationUrl);
  return checkout;
}
export async function upload(path,file,fields={},fileField='file'){
  const form=new FormData();for(const [k,v] of Object.entries(fields))form.append(k,String(v));form.append(fileField,file);
  let res;try{res=await fetch(apiUrl(path),{method:'POST',credentials:'include',body:form});}catch(error){notifyConnection('error');throw new ApiError('DigiTrans upload services are temporarily unavailable. Please try again shortly.',503,{cause:error?.name||'network_error'});}
  const contentType=String(res.headers.get('content-type')||'').toLowerCase();
  if(!contentType.includes('application/json')){notifyConnection('error');throw new ApiError('DigiTrans upload services are not connected to this deployment yet.',502,{contentType});}
  let payload={};try{payload=await res.json();}catch{}
  if(!res.ok)throw new ApiError(payload.error||'Upload failed.',res.status);notifyConnection('restored');return payload;
}
export const money=(value,opts={})=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0,...opts}).format(Number(value||0));
export const date=(value,opts={})=>value?new Intl.DateTimeFormat('en-NG',{day:'numeric',month:'short',year:'numeric',...opts}).format(new Date(value)):'-';
export const time=(value)=>value?new Intl.DateTimeFormat('en-NG',{hour:'numeric',minute:'2-digit'}).format(new Date(value)):'-';
export const statusLabel=(value='')=>value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
