const RESEND_ENDPOINT='https://api.resend.com/emails';

export function isEmailConfigured(){
  return Boolean(String(process.env.RESEND_API_KEY||'').trim()&&String(process.env.RESEND_FROM_EMAIL||'').trim()&&String(process.env.APP_URL||'').trim());
}

export async function sendEmail({to,subject,html,text,replyTo},fetchImpl=fetch){
  const apiKey=String(process.env.RESEND_API_KEY||'').trim(),from=String(process.env.RESEND_FROM_EMAIL||'').trim();
  if(!apiKey||!from)throw Object.assign(new Error('Transactional email is not configured.'),{status:503});
  const payload={from,to,subject,...(html?{html}:{}),...(text?{text}:{}),...(replyTo?{reply_to:replyTo}:{})};
  const response=await fetchImpl(RESEND_ENDPOINT,{
    method:'POST',
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify(payload),
    signal:AbortSignal.timeout(10_000),
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok||typeof result?.id!=='string'||!result.id)throw Object.assign(new Error(result?.message||'The email provider could not accept the message.'),{status:502});
  return {id:result.id};
}
