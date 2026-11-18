const BRAND='DigiTrans';
const PALETTE={navy:'#10283a',navyDeep:'#081d2b',teal:'#0e7c8b',mint:'#dff0ed',coral:'#f26c4f',ink:'#1b3445',muted:'#687b85',paper:'#f1f5f5',line:'#e1e9e8'};

function escapeHtml(value){
 return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
function actionHref(value){
 let url;
 try{url=new URL(String(value||''));}catch{throw new TypeError('A valid account action URL is required.');}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new TypeError('The account action URL must use HTTP or HTTPS without credentials.');
 return url.href;
}

const content={
 verify:{
  subject:'One quick step to get moving with DigiTrans',
  preheader:'Confirm your email to finish setting up your DigiTrans account.',
  eyebrow:'Your account is almost ready',
  title:'Let’s get you moving.',
  body:'Confirm your email address to finish setting up your DigiTrans account. Once your email is verified, you can sign in and follow the next steps for your account type.',
  action:'Verify my email',
  note:'For your security, this link is personal to you. If you did not create a DigiTrans account, you can safely ignore this message.',
  expiry:'This verification link is time-limited. If it has expired, request a fresh link from the sign-in page.',
 },
 recovery:{
  subject:'A secure link to reset your DigiTrans password',
  preheader:'Choose a new password for your DigiTrans account.',
  eyebrow:'Password recovery',
  title:'A fresh start, secured.',
  body:'We received a request to reset the password for your DigiTrans account. Use the button below to choose a new password.',
  action:'Reset my password',
  note:'If you did not ask to reset your password, no changes have been made. You can safely ignore this email.',
  expiry:'This secure link expires after a short time and can only be used once.',
 },
};

export function createAuthEmailTemplate({kind='verify',name='',actionUrl}={}){
 const copy=content[kind];
 if(!copy)throw new TypeError('Unknown DigiTrans account email type.');
 const href=actionHref(actionUrl),safeHref=escapeHtml(href);
 const safeName=String(name||'').trim();
 const greeting=safeName?`Hi ${escapeHtml(safeName)},`:'Hello,';
 const text=[greeting,'',copy.body,'',`${copy.action}: ${href}`,'',copy.expiry,'',copy.note,'','DigiTrans Logistics · Calabar, Cross River State'].join('\n');
 const html=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(copy.subject)}</title>
  <style>
    @media only screen and (max-width:600px){.email-wrap{width:100%!important}.email-card{padding:28px 22px!important}.email-title{font-size:32px!important}.email-shell{padding:16px 10px!important}.email-footer{padding:20px 14px!important}}
  </style>
</head>
<body style="margin:0;padding:0;background:${PALETTE.paper};font-family:Arial,Helvetica,sans-serif;color:${PALETTE.ink};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(copy.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${PALETTE.paper};border-collapse:collapse;">
   <tr><td class="email-shell" align="center" style="padding:38px 16px;">
    <table class="email-wrap" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;border-collapse:separate;border-spacing:0;">
     <tr><td style="overflow:hidden;border-radius:22px 22px 0 0;background:${PALETTE.navyDeep};padding:25px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
       <td align="left" style="vertical-align:middle;">
        <span style="display:inline-block;vertical-align:middle;width:31px;height:31px;border-radius:10px;background:${PALETTE.teal};color:#ffffff;text-align:center;line-height:31px;font-size:15px;font-weight:bold;">D</span>
        <span style="display:inline-block;vertical-align:middle;margin-left:9px;color:#ffffff;font-size:17px;font-weight:bold;letter-spacing:-.4px;">DigiTrans</span>
       </td>
       <td align="right" style="vertical-align:middle;color:#bdd2d7;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;">Calabar · Cross River</td>
      </tr></table>
     </td></tr>
     <tr><td class="email-card" style="padding:42px 46px 38px;background:#ffffff;border-left:1px solid ${PALETTE.line};border-right:1px solid ${PALETTE.line};">
      <div style="display:inline-block;margin:0 0 16px;border:1px solid #d8ece9;border-radius:999px;padding:7px 11px;background:#f1faf8;color:${PALETTE.teal};font-size:10px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(copy.eyebrow)}</div>
      <h1 class="email-title" style="margin:0;color:${PALETTE.navy};font-family:Arial,Helvetica,sans-serif;font-size:39px;font-weight:700;letter-spacing:-1.6px;line-height:1.08;">${escapeHtml(copy.title)}</h1>
      <p style="margin:23px 0 0;color:${PALETTE.ink};font-size:15px;line-height:1.65;">${greeting}</p>
      <p style="margin:9px 0 0;color:${PALETTE.muted};font-size:14px;line-height:1.8;">${escapeHtml(copy.body)}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 0;border-collapse:separate;"><tr><td align="center" bgcolor="${PALETTE.coral}" style="border-radius:12px;background:${PALETTE.coral};box-shadow:0 7px 18px rgba(242,108,79,.18);">
       <a href="${safeHref}" target="_blank" style="display:inline-block;border:1px solid ${PALETTE.coral};border-radius:12px;padding:15px 22px;color:#ffffff;font-size:14px;font-weight:bold;line-height:1;text-decoration:none;">${escapeHtml(copy.action)} &nbsp; &rarr;</a>
      </td></tr></table>
      <p style="margin:18px 0 0;color:#89979d;font-size:11px;line-height:1.65;">${escapeHtml(copy.expiry)}</p>
      <div style="height:1px;margin:25px 0 19px;background:${PALETTE.line};font-size:1px;line-height:1px;">&nbsp;</div>
      <p style="margin:0;color:#7d8c92;font-size:11px;line-height:1.7;">Button not working? Copy this link into your browser:</p>
      <p style="overflow-wrap:anywhere;margin:8px 0 0;color:${PALETTE.teal};font-size:11px;line-height:1.7;"><a href="${safeHref}" style="color:${PALETTE.teal};text-decoration:underline;">${safeHref}</a></p>
     </td></tr>
     <tr><td style="border:1px solid ${PALETTE.line};border-top:0;border-radius:0 0 22px 22px;background:#f8fbfa;padding:22px 30px;">
      <p style="margin:0;color:#6c7d84;font-size:11px;line-height:1.7;">${escapeHtml(copy.note)}</p>
      <table class="email-footer" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;border-top:1px solid ${PALETTE.line};padding-top:15px;"><tr>
       <td style="color:#809097;font-size:10px;line-height:1.6;">DigiTrans Logistics<br>Thoughtful movement, made local.</td>
       <td align="right" style="color:#9aa6aa;font-size:10px;line-height:1.6;">Need help?<br><a href="mailto:hello@digitrans.ng" style="color:${PALETTE.teal};text-decoration:none;">Talk to our team</a></td>
      </tr></table>
     </td></tr>
    </table>
   </td></tr>
  </table>
</body>
</html>`;
 return {subject:copy.subject,preheader:copy.preheader,html,text};
}
