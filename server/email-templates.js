import {ADMIN_ROLE_LABELS} from '../shared/roles.js';
import {SITE} from '../shared/site.js';

const BRAND=SITE.brandName;
const SUPPORT_EMAIL=SITE.email;
const PALETTE={navy:'#10283a',navyDeep:'#081d2b',teal:'#0e7c8b',mint:'#dff0ed',coral:'#f26c4f',ink:'#1b3445',muted:'#687b85',paper:'#f1f5f5',line:'#e1e9e8',cream:'#f5f2e8'};

function escapeHtml(value){
 return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
function actionHref(value){
 let url;
 try{url=new URL(String(value||''));}catch{throw new TypeError('A valid account action URL is required.');}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new TypeError('The account action URL must use HTTP or HTTPS without credentials.');
 return url.href;
}
function publicOrigin(value){
 let url;
 try{url=new URL(String(value||''));}catch{throw new TypeError('A public DigiTrans app URL is required for transactional email.');}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new TypeError('The DigiTrans app URL must be an HTTP or HTTPS origin.');
 return url.origin;
}
function greetingFor(name){
 const safeName=String(name||'').trim();
 return safeName?`Hi ${safeName},`:'Hello,';
}
function readableStatus(value){
 return String(value||'updated').replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());
}
function amountLabel(value){
 const amount=Number(value);
 if(!Number.isSafeInteger(amount)||amount<0)return '';
 return `₦${amount.toLocaleString('en-NG')}`;
}
function scheduledLabel(value){
 if(!value)return '';
 const date=new Date(value);
 if(Number.isNaN(date.getTime()))return '';
 return new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos'}).format(date);
}
function trackUrl(origin,reference){
 const value=String(reference||'').trim();
 return value?`${origin}/track?ref=${encodeURIComponent(value)}`:`${origin}/track`;
}
function customerAreaUrl(origin,area){return `${origin}/customer/${area}`;}

const authCopy={
 verify:{
  subject:'One quick step to get moving with DigiTrans',preheader:'Confirm your email to finish setting up your DigiTrans account.',
  eyebrow:'Your account is almost ready',title:'Let’s get you moving.',
  body:'Confirm your email address to finish setting up your DigiTrans account. Once your email is verified, you can sign in and follow the next steps for your account type.',
  action:'Verify my email',note:'For your security, this link is personal to you. If you did not create a DigiTrans account, you can safely ignore this message.',
  expiry:'This verification link is time-limited. If it has expired, request a fresh link from the sign-in page.',
  image:'email-verification.jpg',imageAlt:'A customer opening a DigiTrans email with a confirmation checkmark.',
 },
 recovery:{
  subject:'A secure link to reset your DigiTrans password',preheader:'Choose a new password for your DigiTrans account.',
  eyebrow:'Password recovery',title:'A fresh start, secured.',
  body:'We received a request to reset the password for your DigiTrans account. Use the button below to choose a new password.',
  action:'Reset my password',note:'If you did not ask to reset your password, no changes have been made. You can safely ignore this email.',
  expiry:'This secure link expires after a short time and can only be used once.',
  image:'password-reset.jpg',imageAlt:'A secure key and lock, representing a protected password reset.',
 },
};

const deliveryProgressCopy={
 pending_confirmation:{title:'Your scheduled delivery is received',body:'We have received your scheduled delivery request. Our team will confirm it before the dispatch window opens.'},
 awaiting_assignment:{title:'Your delivery is in the queue',body:'Your delivery request is in our dispatch queue. We will let you know as soon as a rider is assigned.'},
 assigned:{title:'A rider has been assigned',body:'A rider has been assigned to your delivery. We will keep you posted as your parcel moves.'},
 rider_accepted:{title:'Your rider has accepted',body:'Your rider has accepted the delivery and is getting ready for pickup.'},
 rider_en_route_to_pickup:{title:'Your rider is on the way',body:'Your rider is on the way to collect the parcel.'},
 arrived_at_pickup:{title:'Your rider has arrived',body:'Your rider has arrived at the pickup point.'},
 package_collected:{title:'Your parcel is collected',body:'Your parcel has been collected and is ready for the journey.'},
 in_transit:{title:'Your parcel is on the move',body:'Your parcel is on its way. Follow its latest progress from the tracking page.'},
 arrived_at_destination:{title:'Your parcel has reached its destination',body:'Your parcel has reached the destination area and is moving through the final hand-off.'},
 out_for_delivery:{title:'Your parcel is on the final leg',body:'Your parcel is out for delivery and heading to its recipient.'},
 delivered:{title:'Your delivery is complete',body:'Your parcel has been delivered. Thanks for choosing DigiTrans.'},
 delivery_failed:{title:'We’re working on your delivery',body:'We could not complete this delivery just yet. Our operations team is reviewing the next step and will help get things moving.'},
 cancelled:{title:'Your delivery was cancelled',body:'This delivery has been cancelled. If you did not request that change, please contact our team.'},
 returned:{title:'Your parcel has been returned',body:'Your parcel has been returned. Contact our team if you need a hand with what comes next.'},
};
const marketRunCopy={
 submitted:{title:'Your Market Run is in the queue',body:'We have received your shopping request. Our team will review the list and send an update.'},
 under_review:{title:'Your Market Run is being reviewed',body:'Our team is reviewing your Market Run request and will share the next step shortly.'},
 awaiting_customer_approval:{title:'Your Market Run estimate is ready',body:'We have prepared an estimate for your Market Run. Review the total and approve it in your DigiTrans workspace when you are ready.'},
 approved:{title:'Your Market Run is approved',body:'Thanks for approving the estimate. Our team is preparing the next step.'},
 agent_assigned:{title:'Your Market Run has a shopper',body:'A DigiTrans shopper has been assigned to your request.'},
 shopping_in_progress:{title:'Your Market Run is underway',body:'Your shopping list is being picked up with care.'},
 awaiting_expense_review:{title:'Your shopping is complete',body:'Shopping is complete and the itemized expenses are being reviewed.'},
 expense_approved:{title:'Your Market Run costs are confirmed',body:'The reviewed shopping costs are confirmed. We are preparing the delivery hand-off.'},
 awaiting_delivery_assignment:{title:'Your Market Run is ready for delivery',body:'Your shopping is ready and waiting for a delivery rider.'},
 assigned_to_rider:{title:'Your Market Run is on the way',body:'A rider has been assigned to bring your Market Run to you.'},
 in_transit:{title:'Your Market Run is on the move',body:'Your Market Run is on its way. Follow the request in your DigiTrans workspace.'},
 delivered:{title:'Your Market Run is complete',body:'Your Market Run has been delivered. We hope everything is just right.'},
 cancelled:{title:'Your Market Run was cancelled',body:'This Market Run has been cancelled. Contact our team if you need help.'},
 rejected:{title:'An update on your Market Run',body:'We could not proceed with this Market Run request. Contact our team if you would like help with next steps.'},
};
const waybillCopy={
 submitted:{title:'Your waybill request is received',body:'We have received your parcel request. Our team will review the parcel details and confirm the next step.'},
 under_review:{title:'Your waybill is being reviewed',body:'Our team is reviewing your parcel and route details.'},
 awaiting_parcel_dropoff:{title:'Your parcel is ready for intake',body:'Your waybill is approved for the next intake step. Follow the instructions in your DigiTrans workspace.'},
 parcel_received:{title:'Your parcel has been received',body:'Your parcel is safely with our team. We will update you as it moves through processing.'},
 awaiting_payment:{title:'Your waybill is ready for payment',body:'Your parcel has been checked and the verified route charge is ready in your DigiTrans workspace.'},
 processed:{title:'Your parcel is processed',body:'Your parcel is processed and its waybill details are ready.'},
 ready_for_dispatch:{title:'Your parcel is ready to dispatch',body:'Your parcel is packed and ready for its journey.'},
 dispatched:{title:'Your parcel has been dispatched',body:'Your parcel is on its way from the origin city.'},
 in_transit:{title:'Your parcel is in transit',body:'Your parcel is moving between cities. Follow its progress from the tracking page.'},
 arrived_at_destination:{title:'Your parcel has arrived',body:'Your parcel has reached its destination city.'},
 awaiting_collection:{title:'Your parcel is ready for collection',body:'Your parcel has arrived and is ready for collection.'},
 out_for_final_delivery:{title:'Your parcel is out for delivery',body:'Your parcel is on the final leg to its recipient.'},
 delivered:{title:'Your parcel has been delivered',body:'Your waybill has been completed. Thanks for trusting DigiTrans with your parcel.'},
 delivery_failed:{title:'An update on your parcel',body:'We could not complete the parcel hand-off just yet. Our operations team is reviewing the next step.'},
 returned:{title:'Your parcel is being returned',body:'Your parcel is being returned. Contact our team if you need help.'},
 cancelled:{title:'Your waybill was cancelled',body:'This waybill has been cancelled. Contact our team if you need help.'},
 rejected:{title:'An update on your waybill',body:'We could not proceed with this waybill request. Contact our team for assistance.'},
};

function detailsFor(eventType,payload){
 const rows=[];
 const add=(label,value)=>{if(value!==undefined&&value!==null&&String(value).trim())rows.push({label,value:String(value)});};
 if(eventType==='delivery_order_placed'||eventType==='delivery_status'){
  add('Delivery reference',payload.reference);
  if(eventType==='delivery_status')add('Latest update',readableStatus(payload.status||payload.newStatus));
  const scheduled=scheduledLabel(payload.scheduledAt||payload.scheduled_at);
  if(scheduled)add('Scheduled for',scheduled);
  const fee=amountLabel(payload.fee);if(fee)add('Delivery fare',fee);
 }else if(eventType==='rider_assignment'){
  add('Delivery reference',payload.reference);
  add('Assignment reference',payload.assignmentReference);
 }else if(eventType==='payment_confirmed'||eventType==='payment_review'){
  add('Payment reference',payload.paymentReference||payload.reference);
  const amount=amountLabel(payload.amount);if(amount)add('Amount',amount);
  add('For',payload.serviceReference||readableStatus(payload.serviceType||'service'));
  if(eventType==='payment_review')add('Status','Operations review');
 }else if(eventType==='market_run_status'){
  add('Market Run reference',payload.reference);
  const status=payload.status||payload.newStatus;
  if(status)add('Latest update',readableStatus(status));
  const total=amountLabel(payload.finalTotal??payload.final_total);
  if(total&&['awaiting_customer_approval','approved','agent_assigned','shopping_in_progress'].includes(status))add('Estimate',total);
 }else if(eventType==='waybill_status'){
  add('Waybill number',payload.waybillNumber||payload.waybill_number||payload.reference);
  add('Route',[payload.origin,payload.destinationCity||payload.destination_city].filter(Boolean).join(' → '));
  const status=payload.status||payload.newStatus;
  if(status)add('Latest update',readableStatus(status));
 }
 return rows;
}

function transactionalCopy(eventType,payload){
 const reference=String(payload.reference||payload.paymentReference||payload.payment_reference||'').trim();
 if(eventType==='delivery_order_placed'){
  const scheduled=payload.status==='pending_confirmation'||payload.timing==='scheduled';
  return {
   subject:`${scheduled?'Scheduled delivery received':'Delivery request received'}${reference?` · ${reference}`:''}`,
   preheader:scheduled?'Your scheduled request is in. We will confirm it before dispatch.':'Your delivery request is in the DigiTrans dispatch queue.',
   eyebrow:scheduled?'Scheduled delivery':'Order received',
   title:scheduled?'Your booking is with us.':'We’re getting your delivery moving.',
   body:scheduled?'We have received your scheduled delivery request. Our team will confirm it before the dispatch window opens.':'We have received your delivery request and added it to the dispatch queue. We will email you when a rider is assigned.',
   action:'Track your delivery',image:'delivery-confirmation.jpg',imageAlt:'A customer and courier completing a parcel hand-off.',
   hrefFor:origin=>trackUrl(origin,reference),
   note:'Keep this email for your reference. You will receive another update as your delivery progresses.',
  };
 }
 if(eventType==='delivery_status'){
  const status=String(payload.status||payload.newStatus||'updated');
  const copy=deliveryProgressCopy[status]||{title:`Delivery ${readableStatus(status)}`,body:`Your delivery status is now ${readableStatus(status).toLowerCase()}. Follow the latest progress using the tracking link below.`};
  const exception=['delivery_failed','cancelled','returned'].includes(status);
  const completed=status==='delivered';
  return {
   subject:`${copy.title}${reference?` · ${reference}`:''}`,preheader:copy.body,eyebrow:exception?'Delivery needs attention':completed?'Delivery complete':'Delivery progress',
   title:copy.title,body:copy.body,action:exception?'Get help':'Track your delivery',
   image:exception?'delivery-exception.jpg':completed?'delivery-confirmation.jpg':'delivery-progress.jpg',
   imageAlt:exception?'A DigiTrans support specialist helping with a parcel update.':completed?'A successful parcel hand-off.':'A DigiTrans rider carrying a parcel along a delivery route.',
   hrefFor:origin=>exception?`${origin}/contact`:trackUrl(origin,reference),
   note:exception?'Our local support team is here if you need help with this update.':'We will keep you posted as your delivery progresses.',
  };
 }
 if(eventType==='rider_assignment'){
  return {
   subject:`A delivery is ready in your queue${reference?` · ${reference}`:''}`,preheader:'A new DigiTrans delivery has been assigned to you.',
   eyebrow:'New assignment',title:'A new delivery is yours to pick up.',
   body:'A delivery has been assigned to you. Open your rider workspace to review the job and choose your next step.',
   action:'Open rider workspace',image:'delivery-progress.jpg',imageAlt:'A DigiTrans rider carrying a parcel along a delivery route.',
   hrefFor:origin=>`${origin}/rider/jobs`,note:'Please keep customer addresses and contact details inside your secure DigiTrans workspace.',
  };
 }
 if(eventType==='payment_confirmed'||eventType==='payment_review'){
  const review=eventType==='payment_review';
  const serviceType=String(payload.serviceType||payload.service_type||'delivery').replaceAll('_',' ');
  const amount=amountLabel(payload.amount);
  const body=review
   ?`We received${amount?` your payment of ${amount}`:''}${payload.serviceReference?` for ${serviceType} ${payload.serviceReference}`:''}. It needs an operations review before the service can continue. We will send another update when the review is complete.`
   :`Your payment${amount?` of ${amount}`:''}${payload.serviceReference?` for ${serviceType} ${payload.serviceReference}`:''} has been confirmed. Thank you.`;
  const refValue=String(payload.serviceReference||'').trim();
  const service=String(payload.serviceType||payload.service_type||'').toLowerCase();
  const image=review?'delivery-exception.jpg':'payment-confirmed.jpg';
  return {
   subject:`${review?'Payment received — review in progress':'Payment confirmed'}${reference?` · ${reference}`:''}`,
   preheader:review?'Your payment reached us and is with the operations team.':'Your DigiTrans payment has been verified.',
   eyebrow:review?'Payment review':'Payment confirmed',
   title:review?'Payment received. Review is underway.':'Payment confirmed. You’re all set.',body,
   action:review?'Contact our team':service==='investment'?'View your account':service==='market_run'?'View your Market Run':'Track your service',
   image,imageAlt:review?'A DigiTrans support specialist helping resolve a parcel update.':'A parcel and secure payment receipt with a confirmation checkmark.',
   hrefFor:origin=>review?`${origin}/contact`:service==='investment'?`${origin}/investor`:service==='market_run'?customerAreaUrl(origin,'market'):trackUrl(origin,refValue),
   note:review?'Please do not pay again while this review is in progress. Contact our team if you need assistance.':'Keep this confirmation for your records. Your service updates will arrive as it progresses.',
  };
 }
 if(eventType==='market_run_status'){
  const status=String(payload.status||payload.newStatus||'updated');
  const copy=marketRunCopy[status]||{title:`Your Market Run: ${readableStatus(status)}`,body:`Your Market Run status is now ${readableStatus(status).toLowerCase()}.`};
  const exception=['cancelled','rejected'].includes(status);
  return {
   subject:`${copy.title}${reference?` · ${reference}`:''}`,preheader:copy.body,
   eyebrow:exception?'Market Run update':'Market Run progress',title:copy.title,
   body:status==='awaiting_customer_approval'&&amountLabel(payload.finalTotal??payload.final_total)?`${copy.body} The estimate is ${amountLabel(payload.finalTotal??payload.final_total)}.`:copy.body,
   action:status==='awaiting_customer_approval'?'Review estimate':exception?'Get help':'View Market Run',
   image:exception?'delivery-exception.jpg':'market-run.jpg',
   imageAlt:exception?'A DigiTrans support specialist helping with a customer request.':'A local shopper and courier preparing a basket of market goods.',
   hrefFor:origin=>exception?`${origin}/contact`:customerAreaUrl(origin,'market'),
   note:exception?'Contact our team if you have questions about this request.':'We will keep you updated as your shopping request moves along.',
  };
 }
 if(eventType==='waybill_status'){
  const status=String(payload.status||payload.newStatus||'updated');
  const copy=waybillCopy[status]||{title:`Your waybill: ${readableStatus(status)}`,body:`Your parcel status is now ${readableStatus(status).toLowerCase()}. Follow its progress using the tracking link below.`};
  const exception=['delivery_failed','returned','cancelled','rejected'].includes(status);
  const completed=status==='delivered';
  return {
   subject:`${copy.title}${reference?` · ${reference}`:''}`,preheader:copy.body,
   eyebrow:exception?'Waybill update':completed?'Parcel delivered':'Parcel progress',title:copy.title,body:copy.body,
   action:exception?'Get help':status==='awaiting_payment'?'View payment details':'Track your parcel',
   image:exception?'delivery-exception.jpg':completed?'delivery-confirmation.jpg':'waybill-dispatch.jpg',
   imageAlt:exception?'A DigiTrans support specialist helping with a parcel update.':completed?'A parcel hand-off has been completed.':'A parcel being prepared for an intercity journey.',
   hrefFor:origin=>exception?`${origin}/contact`:status==='awaiting_payment'?customerAreaUrl(origin,'waybills'):trackUrl(origin,payload.waybillNumber||payload.waybill_number||reference),
   note:exception?'Our support team can help with any questions about this parcel update.':'Follow the latest parcel timeline from the tracking page.',
  };
 }
 throw new TypeError('Unknown DigiTrans transactional email event.');
}

function renderEmail({subject,preheader,eyebrow,title,body,action,actionUrl,greeting,imageUrl,imageAlt,note,expiry='',details=[],plainText}){
 const safeSubject=escapeHtml(subject),safePreheader=escapeHtml(preheader),safeEyebrow=escapeHtml(eyebrow),safeTitle=escapeHtml(title);
 const safeBody=escapeHtml(body),safeAction=escapeHtml(action),safeActionUrl=escapeHtml(actionUrl),safeNote=escapeHtml(note),safeGreeting=escapeHtml(greeting);
 const detailHtml=details.length?`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:25px 0 0;border-collapse:collapse;border-top:1px solid ${PALETTE.line};">${details.map(row=>`<tr><td style="width:42%;padding:11px 12px 11px 0;border-bottom:1px solid ${PALETTE.line};color:${PALETTE.muted};font-size:11px;line-height:1.5;vertical-align:top;">${escapeHtml(row.label)}</td><td align="right" style="padding:11px 0;border-bottom:1px solid ${PALETTE.line};color:${PALETTE.ink};font-size:12px;font-weight:bold;line-height:1.5;overflow-wrap:anywhere;vertical-align:top;">${escapeHtml(row.value)}</td></tr>`).join('')}</table>`:'';
 const expiryHtml=expiry?`<p style="margin:18px 0 0;color:#89979d;font-size:11px;line-height:1.65;">${escapeHtml(expiry)}</p>`:'';
 const imageHtml=imageUrl?`<tr><td align="center" bgcolor="${PALETTE.cream}" style="padding:9px 22px 0;background:${PALETTE.cream};"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" width="520" border="0" style="display:block;width:100%;max-width:520px;height:auto;margin:0 auto;border:0;outline:none;color:${PALETTE.muted};font-family:Arial,Helvetica,sans-serif;font-size:12px;text-decoration:none;"></td></tr>`:'';
 const text=[greeting,'',body,...(details.length?['',...details.map(row=>`${row.label}: ${row.value}`)]:[]),'',`${action}: ${actionUrl}`,...(expiry?['',expiry]:[]),'',note,'','DigiTrans Logistics','Thoughtful movement, made local.',`Need help? ${SUPPORT_EMAIL}`].join('\n');
 const html=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeSubject}</title>
  <style>
    @media only screen and (max-width:600px){.email-shell{padding:16px 8px!important}.email-wrap{width:100%!important}.email-card{padding:30px 22px!important}.email-title{font-size:32px!important}.email-header{padding:21px 22px!important}.email-footer{padding:20px 22px!important}.email-location{display:none!important}}
  </style>
</head>
<body style="margin:0;padding:0;background:${PALETTE.paper};font-family:Arial,Helvetica,sans-serif;color:${PALETTE.ink};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${safePreheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${PALETTE.paper};border-collapse:collapse;">
   <tr><td class="email-shell" align="center" style="padding:38px 16px;">
    <table class="email-wrap" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;border-collapse:separate;border-spacing:0;">
     <tr><td class="email-header" style="border-radius:20px 20px 0 0;background:${PALETTE.navyDeep};padding:24px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
       <td align="left" style="vertical-align:middle;">
        <span style="display:inline-block;width:31px;height:31px;border-radius:10px;background:${PALETTE.teal};color:#ffffff;text-align:center;line-height:31px;font-size:15px;font-weight:bold;">D</span>
        <span style="display:inline-block;vertical-align:middle;margin-left:9px;color:#ffffff;font-size:17px;font-weight:bold;letter-spacing:-.4px;">${BRAND}</span>
       </td>
       <td class="email-location" align="right" style="vertical-align:middle;color:#bdd2d7;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;">Calabar · Cross River</td>
      </tr></table>
     </td></tr>
     <tr><td style="overflow:hidden;background:#ffffff;border-left:1px solid ${PALETTE.line};border-right:1px solid ${PALETTE.line};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
       ${imageHtml}
       <tr><td class="email-card" style="padding:34px 46px 40px;background:#ffffff;">
        <div style="display:inline-block;margin:0 0 15px;border:1px solid #d8ece9;border-radius:999px;padding:7px 11px;background:#f1faf8;color:${PALETTE.teal};font-size:10px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;">${safeEyebrow}</div>
        <h1 class="email-title" style="margin:0;color:${PALETTE.navy};font-family:Arial,Helvetica,sans-serif;font-size:37px;font-weight:700;letter-spacing:-1.3px;line-height:1.12;">${safeTitle}</h1>
        <p style="margin:21px 0 0;color:${PALETTE.ink};font-size:14px;line-height:1.6;">${safeGreeting}</p>
        <p style="margin:8px 0 0;color:${PALETTE.muted};font-size:14px;line-height:1.8;">${safeBody}</p>
        ${detailHtml}
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:27px 0 0;border-collapse:separate;"><tr><td align="center" bgcolor="${PALETTE.coral}" style="border-radius:11px;background:${PALETTE.coral};">
         <a href="${safeActionUrl}" target="_blank" style="display:inline-block;border:1px solid ${PALETTE.coral};border-radius:11px;padding:15px 21px;background:${PALETTE.coral};color:#ffffff;font-size:13px;font-weight:bold;line-height:1.2;text-decoration:none;">${safeAction} &nbsp; &rarr;</a>
        </td></tr></table>
        ${expiryHtml}
        <div style="height:1px;margin:25px 0 17px;background:${PALETTE.line};font-size:1px;line-height:1px;">&nbsp;</div>
        <p style="margin:0;color:#7d8c92;font-size:11px;line-height:1.65;">Button not working? Copy this link into your browser:</p>
        <p style="overflow-wrap:anywhere;margin:7px 0 0;color:${PALETTE.teal};font-size:11px;line-height:1.7;"><a href="${safeActionUrl}" style="color:${PALETTE.teal};text-decoration:underline;">${safeActionUrl}</a></p>
       </td></tr>
      </table>
     </td></tr>
     <tr><td class="email-footer" style="border:1px solid ${PALETTE.line};border-top:0;border-radius:0 0 20px 20px;background:#f8fbfa;padding:22px 30px;">
      <p style="margin:0;color:#6c7d84;font-size:11px;line-height:1.7;">${safeNote}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:17px;border-collapse:collapse;border-top:1px solid ${PALETTE.line};"><tr>
       <td style="padding-top:14px;color:#809097;font-size:10px;line-height:1.7;">DigiTrans Logistics<br>${escapeHtml(SITE.shortAddress)}</td>
       <td align="right" style="padding-top:14px;color:#9aa6aa;font-size:10px;line-height:1.7;">Need help?<br><a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:${PALETTE.teal};text-decoration:none;">Talk to our team</a></td>
      </tr></table>
     </td></tr>
     <tr><td align="center" style="padding:17px 20px 0;color:#98a5a9;font-size:9px;line-height:1.7;">You’re receiving this service email because of an update to your DigiTrans account or delivery.</td></tr>
    </table>
   </td></tr>
  </table>
</body>
</html>`;
 return {html,text:plainText||text};
}

export function createAdminInviteEmailTemplate({name='',email='',role='',actionUrl}={}){
 const href=actionHref(actionUrl),roleLabel=ADMIN_ROLE_LABELS[String(role||'')]||'DigiTrans administrator';
 const subject='You’re invited to join DigiTrans Logistics';
 const body=`DigiTrans Logistics has invited you to join the Admin Dashboard as a ${roleLabel}. Create a password known only to you to securely activate your administrator account. Your inviter will never see or set your password.`;
 const note='This personal, one-time invitation link expires after a short time. If you were not expecting this invitation, do not use or forward the link; contact your DigiTrans administrator.';
 const details=[{label:'Administrator position',value:roleLabel},{label:'Invited email',value:String(email||'').trim().toLowerCase()}];
 const greeting=greetingFor(name);
 const expiry='This secure setup link is time-limited and can only be used once. If it has expired, ask your Super Administrator to resend your invitation.';
 const text=[greeting,'',body,...details.map(row=>`${row.label}: ${row.value}`),'',`Set my password: ${href}`,'',expiry,'',note,'','DigiTrans Logistics · Calabar, Cross River State',`Need help? ${SUPPORT_EMAIL}`].join('\n');
 const {html}=renderEmail({
  subject,preheader:'Set a private password to activate your DigiTrans administrator account.',
  eyebrow:'Administrator invitation',title:'You’re invited to the team.',body,action:'Set my password',actionUrl:href,
  greeting,note,expiry,details,plainText:text,
 });
 return {subject,preheader:'Set a private password to activate your DigiTrans administrator account.',html,text};
}

export function createAuthEmailTemplate({kind='verify',name='',actionUrl}={}){
 const copy=authCopy[kind];
 if(!copy)throw new TypeError('Unknown DigiTrans account email type.');
 const href=actionHref(actionUrl),origin=new URL(href).origin;
 const greeting=greetingFor(name);
 const text=[greeting,'',copy.body,'',`${copy.action}: ${href}`,'',copy.expiry,'',copy.note,'','DigiTrans Logistics · Calabar, Cross River State'].join('\n');
 const {html}=renderEmail({
  subject:copy.subject,preheader:copy.preheader,eyebrow:copy.eyebrow,title:copy.title,body:copy.body,
  action:copy.action,actionUrl:href,greeting,imageUrl:new URL(`/images/email/${copy.image}`,origin).href,
  imageAlt:copy.imageAlt,note:copy.note,expiry:copy.expiry,plainText:text,
 });
 return {subject:copy.subject,preheader:copy.preheader,html,text};
}

export function createTransactionalEmailTemplate({eventType,name='',payload={},baseUrl=process.env.APP_URL}={}){
 const origin=publicOrigin(baseUrl),data=payload&&typeof payload==='object'?payload:{};
 const copy=transactionalCopy(String(eventType||''),data);
 const actionUrl=actionHref(copy.hrefFor(origin));
 const greeting=greetingFor(name);
 const details=detailsFor(eventType,data);
 const text=[greeting,'',copy.body,...(details.length?['',...details.map(row=>`${row.label}: ${row.value}`)]:[]),'',`${copy.action}: ${actionUrl}`,'',copy.note,'','DigiTrans Logistics · Calabar, Cross River State',`Need help? ${SUPPORT_EMAIL}`].join('\n');
 const {html}=renderEmail({
  subject:copy.subject,preheader:copy.preheader,eyebrow:copy.eyebrow,title:copy.title,body:copy.body,
  action:copy.action,actionUrl,greeting,imageUrl:new URL(`/images/email/${copy.image}`,origin).href,
  imageAlt:copy.imageAlt,note:copy.note,details,plainText:text,
 });
 return {subject:copy.subject,preheader:copy.preheader,html,text};
}

export function createContactEnquiryEmailTemplate({enquiryId='',name='',email='',phone='',category='General',message='',baseUrl=process.env.APP_URL||SITE.canonicalOrigin}={}){
 const origin=publicOrigin(baseUrl);
 const safeCategory=String(category||'General').trim().slice(0,80)||'General';
 const safeName=String(name||'Website visitor').trim();
 const safeEmail=String(email||'').trim().toLowerCase();
 const actionUrl=actionHref(enquiryId?`${origin}/ops/contact?focus=${encodeURIComponent(enquiryId)}`:`${origin}/ops/contact`);
 const subject=`DigiTrans website enquiry · ${safeCategory}${safeName?` (${safeName})`:''}`;
 const body=String(message||'').trim();
 const details=[
  {label:'Sender name',value:safeName},
  {label:'Sender email',value:safeEmail},
  {label:'Phone',value:String(phone||'').trim()||'Not supplied'},
  {label:'Category',value:safeCategory},
 ];
 const greeting='Hello DigiTrans support team,';
 const note='Reply directly to this email to respond to the sender, or open the Admin Dashboard to review and track enquiry status.';
 const text=[greeting,'','A new enquiry was submitted on the DigiTrans Logistics website.',...details.map(row=>`${row.label}: ${row.value}`),'',body,'',`Review in Admin Dashboard: ${actionUrl}`,'',note,'',`DigiTrans Logistics · ${SITE.address}`].join('\n');
 const {html}=renderEmail({
  subject,
  preheader:`New website enquiry from ${safeName} (${safeCategory}).`,
  eyebrow:'Website enquiry',
  title:'New message from the public contact form.',
  body,
  action:'Open enquiry in dashboard',
  actionUrl,
  greeting,
  note,
  details,
  plainText:text,
 });
 return {subject,preheader:`New website enquiry from ${safeName} (${safeCategory}).`,html,text};
}

export function createSupportRequestEmailTemplate({ticketId='',reference='',requesterName='',requesterEmail='',requesterRole='',category='general',description='',relatedSummary='',isReply=false,baseUrl=process.env.APP_URL||SITE.canonicalOrigin}={}){
 const origin=publicOrigin(baseUrl);
 const refText=String(reference||ticketId||'').trim();
 const actionUrl=actionHref(ticketId?`${origin}/ops/support?ticket=${encodeURIComponent(ticketId)}`:`${origin}/ops/support`);
 const subject=`${isReply?'Support reply received':'New DigiTrans support request'}${refText?` · ${refText}`:''}`;
 const body=String(description||'').trim();
 const details=[
  {label:'Ticket reference',value:refText||'Support ticket'},
  {label:'Requester',value:String(requesterName||'DigiTrans account').trim()},
  {label:'Account role',value:readableStatus(requesterRole||'customer')},
  ...(requesterEmail?[{label:'Requester email',value:String(requesterEmail).trim().toLowerCase()}]:[]),
  {label:'Category',value:readableStatus(category||'general')},
  ...(relatedSummary?[{label:'Linked record',value:String(relatedSummary)}]:[]),
 ];
 const greeting='Hello DigiTrans support team,';
 const note='Open the Admin Dashboard support desk to reply inside the customer ticket conversation and keep an audit trail.';
 const text=[greeting,'',isReply?'A user posted a follow-up reply on an active support ticket.':'A logged-in DigiTrans user opened a new support ticket.',...details.map(row=>`${row.label}: ${row.value}`),'',body,'',`Open support desk: ${actionUrl}`,'',note,'',`DigiTrans Logistics · ${SITE.address}`].join('\n');
 const {html}=renderEmail({
  subject,
  preheader:`${refText||'Support ticket'} · ${String(requesterName||'DigiTrans user').trim()}`,
  eyebrow:isReply?'Support ticket reply':'New support ticket',
  title:isReply?`Follow-up reply on ${refText||'support ticket'}.`:`New ticket ${refText||''} needs review.`,
  body,
  action:'Open ticket in dashboard',
  actionUrl,
  greeting,
  note,
  details,
  plainText:text,
 });
 return {subject,preheader:`${refText||'Support ticket'} · ${String(requesterName||'DigiTrans user').trim()}`,html,text};
}
