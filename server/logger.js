const SENSITIVE_KEY=/(?:authorization|cookie|password|passphrase|secret|token|api.?key|(?:database|db).?url|connection.?string|credential|private.?key|service.?role|email|phone|full.?name|address|client.?ip|remote.?ip)/i;
const SENSITIVE_ASSIGNMENT=/\b(password|passphrase|secret|token|api[_ -]?key|authorization|cookie|connection[_ -]?string|(?:database|db)[_ -]?url|service[_ -]?role(?:[_ -]?key)?|phone)\b(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi;
const SENSITIVE_QUERY=/([?&](?:email|phone|token|token_hash|access_token|refresh_token|api_key|key|secret|code|password)=)[^&#\s]*/gi;
const EMAIL_ADDRESS=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_NUMBER=/(?<!\w)\+?\d[\d\s().-]{6,}\d(?!\w)/g;
const BEARER=/\bBearer\s+[^\s,;]+/gi;
const MAX_DEPTH=5;

function sanitizeString(value){
 return String(value)
  .replace(BEARER,'Bearer [REDACTED]')
  .replace(SENSITIVE_ASSIGNMENT,'$1$2[REDACTED]')
  .replace(SENSITIVE_QUERY,'$1[REDACTED]')
  .replace(EMAIL_ADDRESS,'[REDACTED_EMAIL]')
  .replace(PHONE_NUMBER,'[REDACTED_PHONE]');
}

function cleanValue(value,key='',depth=0,seen=new WeakSet()){
 if(SENSITIVE_KEY.test(key))return '[REDACTED]';
 if(value==null||typeof value==='boolean'||typeof value==='number')return value;
 if(typeof value==='string')return sanitizeString(value).slice(0,4000);
 if(typeof value==='bigint')return String(value);
 if(typeof value==='function'||typeof value==='symbol')return `[${typeof value}]`;
 if(value instanceof Error){
  const result={name:sanitizeString(value.name||'Error'),message:sanitizeString(value.message||'Request failed.')};
  if(value.code&&/^[A-Za-z0-9_.-]{1,80}$/.test(String(value.code)))result.code=String(value.code);
  if(Number.isInteger(Number(value.status)))result.status=Number(value.status);
  return result;
 }
 if(value instanceof URL)return sanitizeString(value.origin+value.pathname);
 if(Buffer.isBuffer(value)||ArrayBuffer.isView(value))return `[binary ${value.byteLength} bytes]`;
 if(depth>=MAX_DEPTH)return '[MAX_DEPTH]';
 if(seen.has(value))return '[Circular]';
 seen.add(value);
 if(Array.isArray(value))return value.slice(0,50).map(item=>cleanValue(item,'',depth+1,seen));
 const entries=Object.entries(value).slice(0,80).map(([childKey,childValue])=>[childKey,cleanValue(childValue,childKey,depth+1,seen)]);
 return Object.fromEntries(entries);
}

export function createLogger({sink}={}){
 const emit=(level,event,fields={})=>{
  const record={...cleanValue(fields),timestamp:new Date().toISOString(),level,event:sanitizeString(event).slice(0,120)};
  const line=JSON.stringify(record);
  if(sink){sink(line,record);return record;}
  const output=level==='error'?console.error:level==='warn'?console.warn:console.info;
  output.call(console,line);
  return record;
 };
 return Object.freeze({
  info:(event,fields)=>emit('info',event,fields),
  warn:(event,fields)=>emit('warn',event,fields),
  error:(event,fields)=>emit('error',event,fields),
 });
}

export const logger=createLogger();
