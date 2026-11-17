import {asyncRouter} from '../async-router.js';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requireRole, requirePermission, notify, audit } from '../auth.js';

const router=asyncRouter();
const id=()=>crypto.randomUUID();
const ref=p=>`${p}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

router.get('/opportunities',requireAuth,async (req, res) => {
  const rows=await db.prepare("SELECT id,title,description,category,min_investment,max_investment,duration_months,start_date,closing_date,maturity_date,return_structure,projected_return_pct,payment_terms,risk_disclosure,agreement_doc,eligibility,capacity,subscribed,status FROM opportunities WHERE status='published' ORDER BY created_at DESC").all();
  res.json({opportunities:rows});
});
router.get('/ops/opportunities',requireAuth,requirePermission('investments.read'),async (_req, res) => {
  res.json({opportunities:await db.prepare('SELECT * FROM opportunities ORDER BY created_at DESC').all()});
});

router.get('/investor/profile',requireAuth,requireRole('investor'),async (req, res) => {
  const row=(await db.prepare('SELECT address,id_type,id_number,verification_status FROM investors WHERE user_id=?').get(req.user.id))||{};
  res.json({profile:{...row,id_number:row.id_number?`••••${String(row.id_number).slice(-4)}`:null}});
});
router.patch('/investor/profile',requireAuth,requireRole('investor'),async (req, res) => {
  const existing=await db.prepare('SELECT id_type,id_number FROM investors WHERE user_id=?').get(req.user.id);
  const address=String(req.body?.address||'').trim(),idType=String(req.body?.idType||existing?.id_type||'').trim(),provided=String(req.body?.idNumber||'').trim(),idNumber=provided||existing?.id_number||'';
  if(address.length<4||!['national_id','passport','drivers_license','voter_id'].includes(idType)||idNumber.length<5||idNumber.length>40)return res.status(400).json({error:'Add your address and a supported identity document number.'});
  await db.prepare('UPDATE investors SET address=?,id_type=?,id_number=? WHERE user_id=?').run(address,idType,idNumber,req.user.id);
  res.json({message:'Investor verification details saved.'});
});

router.get('/investor/dashboard',requireAuth,requireRole('investor'),async (req, res) => {
  const profile=await db.prepare('SELECT verification_status FROM investors WHERE user_id=?').get(req.user.id);
  const investments=await db.prepare(`SELECT i.*,o.title opportunity_title,o.duration_months,o.projected_return_pct,
    COALESCE((SELECT SUM(projected_amount) FROM investment_earnings ie WHERE ie.investment_id=i.id),0) projected_earnings,
    COALESCE((SELECT SUM(actual_amount) FROM investment_earnings ie WHERE ie.investment_id=i.id AND ie.type='actual'),0) actual_earnings
    FROM investments i JOIN opportunities o ON o.id=i.opportunity_id WHERE i.investor_id=? ORDER BY i.created_at DESC`).all(req.user.id);
  const applications=await db.prepare(`SELECT a.*,o.title opportunity_title,o.duration_months FROM investment_applications a JOIN opportunities o ON o.id=a.opportunity_id WHERE a.investor_id=? ORDER BY a.created_at DESC`).all(req.user.id);
  const principal=investments.reduce((s,i)=>s+i.principal,0),projected=investments.reduce((s,i)=>s+i.projected_earnings,0),actual=investments.reduce((s,i)=>s+i.actual_earnings,0);
  res.json({verificationStatus:profile?.verification_status||'pending',stats:{principal,projected,actual,active:investments.filter(i=>['active','approaching_maturity'].includes(i.status)).length},investments,applications});
});

router.post('/investor/applications',requireAuth,requireRole('investor'),async (req, res) => {
  const user=await db.prepare('SELECT verification_status FROM investors WHERE user_id=?').get(req.user.id);
  if(user?.verification_status!=='approved')return res.status(403).json({error:'Complete investor verification before applying.'});
  const opportunityId=String(req.body?.opportunityId||''),amount=Math.round(Number(req.body?.amount||0));
  const opp=await db.prepare("SELECT * FROM opportunities WHERE id=? AND status='published'").get(opportunityId);
  if(!opp)return res.status(404).json({error:'This opportunity is not currently available.'});
  if(!Number.isSafeInteger(amount)||amount<opp.min_investment||(opp.max_investment&&amount>opp.max_investment))return res.status(400).json({error:`Investment amount must be between ₦${Number(opp.min_investment).toLocaleString()} and ₦${Number(opp.max_investment||opp.capacity||opp.min_investment).toLocaleString()}.`});
  if(opp.closing_date&&new Date(opp.closing_date)<new Date())return res.status(409).json({error:'The application period has closed.'});
  if(opp.capacity&&opp.subscribed+amount>opp.capacity)return res.status(409).json({error:'There is not enough capacity remaining.'});
  if(req.body?.acceptedTerms!==true||req.body?.acceptedRisk!==true)return res.status(400).json({error:'Review and accept the agreement and risk disclosure before applying.'});
  const idd=id(),reference=ref('INV'),agreementVersion=opp.agreement_doc||'terms-v1';
  const create=db.transaction(async () => {
    await db.prepare('INSERT INTO investment_applications (id,investor_id,opportunity_id,amount,reference) VALUES (?,?,?,?,?)').run(idd,req.user.id,opp.id,amount,reference);
    await db.prepare('INSERT INTO investment_agreements (id,application_id,version,doc_ref,accepted_at,method,session_ref) VALUES (?,?,?,?,now(),?,?)').run(id(),idd,agreementVersion,opp.agreement_doc||null,'click_accept',req.user.sessionId);
  });
  await create();await notify(req.user.id,'Investment application received',`Application ${reference} has been submitted.`,'investment',idd);
  await audit(req.user,'investment.application_created','investment_application',idd,null,{reference,opportunityId:opp.id,amount,agreementVersion},null,req.ip);
  res.status(201).json({id:idd,reference,status:'submitted',message:'Application received. Funding becomes available after approval.'});
});

router.post('/investor/withdrawals',requireAuth,requireRole('investor'),async (req, res) => {
  const investmentId=String(req.body?.investmentId||''),amount=Math.round(Number(req.body?.amount||0));
  const investment=await db.prepare('SELECT * FROM investments WHERE id=? AND investor_id=?').get(investmentId,req.user.id);
  if(!investment)return res.status(404).json({error:'Investment not found.'});
  if(!['matured','active','approaching_maturity'].includes(investment.status))return res.status(409).json({error:'This investment is not eligible for a withdrawal request.'});
  if(investment.maturity_date&&new Date(investment.maturity_date)>new Date())return res.status(409).json({error:'This investment has not reached its maturity date.'});
  if(!Number.isSafeInteger(amount)||amount<=0)return res.status(400).json({error:'Enter a valid withdrawal amount.'});
  const already=(await db.prepare("SELECT COALESCE(SUM(amount),0) total FROM investment_withdrawals WHERE investment_id=? AND status IN ('requested','under_review','approved','processing','paid')").get(investmentId)).total;
  const actual=(await db.prepare("SELECT COALESCE(SUM(actual_amount),0) total FROM investment_earnings WHERE investment_id=? AND type='actual'").get(investmentId)).total;
  const available=investment.principal+actual-already;
  if(amount>available)return res.status(400).json({error:'Withdrawal amount exceeds the available matured balance.'});
  const pending=await db.prepare("SELECT id FROM investment_withdrawals WHERE investment_id=? AND status IN ('requested','under_review','approved','processing')").get(investmentId);
  if(pending)return res.status(409).json({error:'There is already a pending withdrawal for this investment.'});
  const withdrawalId=id(),reference=ref('IW');
  await db.prepare('INSERT INTO investment_withdrawals (id,investment_id,investor_id,amount,reference) VALUES (?,?,?,?,?)').run(withdrawalId,investment.id,req.user.id,amount,reference);
  await db.prepare("UPDATE investments SET status='under_withdrawal_review' WHERE id=?").run(investment.id);
  await audit(req.user,'investment.withdrawal_requested','investment_withdrawal',withdrawalId,null,{amount,reference},null,req.ip);
  res.status(201).json({id:withdrawalId,reference,status:'requested',amount});
});

router.post('/ops/opportunities',requireAuth,requirePermission('investments.manage'),async (req, res) => {
  const d=req.body||{},title=String(d.title||'').trim(),description=String(d.description||'').trim(),min=Math.round(Number(d.minInvestment||0)),max=d.maxInvestment?Math.round(Number(d.maxInvestment)):null;
  if(title.length<3||description.length<20||!Number.isSafeInteger(min)||min<1000||max!==null&&(!Number.isSafeInteger(max)||max<min))return res.status(400).json({error:'Add a title, clear description and valid investment range.'});
  const duration=Math.round(Number(d.durationMonths));if(![6,12].includes(duration))return res.status(400).json({error:'The current configuration supports six- or twelve-month terms.'});
  const pct=Number(d.projectedReturnPct||0);if(!Number.isFinite(pct)||pct<0||pct>100)return res.status(400).json({error:'Projected returns must be between 0 and 100%. Include appropriate risk disclosure.'});
  const risk=String(d.riskDisclosure||'').trim();if(risk.length<20)return res.status(400).json({error:'Provide a clear risk disclosure of at least 20 characters.'});
  const oppId=id();
  await db.prepare(`INSERT INTO opportunities (id,title,description,category,min_investment,max_investment,duration_months,start_date,closing_date,maturity_date,return_structure,projected_return_pct,payment_terms,risk_disclosure,agreement_doc,eligibility,capacity,status,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'draft',?)`).run(oppId,title,description,String(d.category||'Logistics'),min,max,duration,d.startDate||null,d.closingDate||null,d.maturityDate||null,String(d.returnStructure||'Subject to approved agreement'),pct,String(d.paymentTerms||''),risk,String(d.agreementDoc||''),String(d.eligibility||'Verified investors only'),d.capacity?Math.round(Number(d.capacity)):null,req.user.id);
  await audit(req.user,'investment.opportunity_created','opportunity',oppId,null,{title,min,max,duration,pct},null,req.ip);res.status(201).json({id:oppId,status:'draft'});
});
router.post('/ops/opportunities/:id/status',requireAuth,requirePermission('investments.manage'),async (req, res) => {
  const o=await db.prepare('SELECT * FROM opportunities WHERE id=?').get(req.params.id);if(!o)return res.status(404).json({error:'Opportunity not found.'});
  const next=String(req.body?.status||''),reason=String(req.body?.reason||'').trim();
  if(next==='published'&&req.user.role!=='super_admin')return res.status(403).json({error:'Only an authorised Super Administrator can publish a reviewed investment opportunity.'});
  const allowed={draft:['under_review'],under_review:['draft','approved'],approved:['published','suspended'],published:['fully_subscribed','suspended','closed'],suspended:['approved','closed'],fully_subscribed:['closed'],closed:['archived']};
  if(!(allowed[o.status]||[]).includes(next))return res.status(409).json({error:`Cannot move opportunity from ${o.status} to ${next}.`});
  if(next==='published'&&(!o.risk_disclosure||!o.agreement_doc||!o.closing_date||!o.duration_months))return res.status(409).json({error:'A published offer requires approved risk disclosures, agreement and dates.'});
  await db.prepare("UPDATE opportunities SET status=?,updated_at=now() WHERE id=?").run(next,o.id);
  await audit(req.user,'investment.opportunity_status_changed','opportunity',o.id,{status:o.status},{status:next},reason,req.ip);
  res.json({status:next});
});
router.get('/ops/investment-applications',requireAuth,requirePermission('investments.read'),async (_req, res) => {
  const rows=await db.prepare(`SELECT a.*,o.title opportunity_title,o.duration_months,i.email investor_email,p.full_name investor_name,p.address FROM investment_applications a JOIN opportunities o ON o.id=a.opportunity_id JOIN users i ON i.id=a.investor_id JOIN profiles p ON p.user_id=i.id ORDER BY a.created_at DESC LIMIT 300`).all();
  res.json({applications:rows});
});
router.post('/ops/investment-applications/:id/decision',requireAuth,requirePermission('investments.manage'),async (req, res) => {
  const a=await db.prepare('SELECT * FROM investment_applications WHERE id=?').get(req.params.id);if(!a)return res.status(404).json({error:'Application not found.'});
  const status=String(req.body?.status||''),reason=String(req.body?.reason||'').trim();if(!['approved','rejected'].includes(status)||a.status!=='submitted'&&a.status!=='under_review')return res.status(409).json({error:'This application cannot be reviewed.'});
  await db.prepare('UPDATE investment_applications SET status=? WHERE id=?').run(status,a.id);
  await notify(a.investor_id,`Investment application ${status}`,reason||`Your application ${a.reference} is ${status}.`,'investment',a.id);
  await audit(req.user,`investment.application_${status}`,'investment_application',a.id,{status:a.status},{status},reason,req.ip);res.json({status});
});
router.get('/ops/investor-withdrawals',requireAuth,requirePermission('investments.read'),async (_req, res) => {
  res.json({withdrawals:await db.prepare(`SELECT w.*,o.title opportunity_title,p.full_name investor_name FROM investment_withdrawals w JOIN investments i ON i.id=w.investment_id JOIN opportunities o ON o.id=i.opportunity_id JOIN profiles p ON p.user_id=w.investor_id ORDER BY w.created_at DESC`).all()});
});
router.post('/ops/investor-withdrawals/:id/status',requireAuth,requirePermission('finance.manage'),async (req, res) => {
  const w=await db.prepare('SELECT * FROM investment_withdrawals WHERE id=?').get(req.params.id);if(!w)return res.status(404).json({error:'Withdrawal not found.'});
  const next=String(req.body?.status||''),reason=String(req.body?.reason||'').trim();
  const allowed={requested:['under_review','rejected'],under_review:['approved','rejected'],approved:['processing','rejected'],processing:['paid','failed']};
  if(!(allowed[w.status]||[]).includes(next))return res.status(409).json({error:`Cannot move withdrawal from ${w.status} to ${next}.`});
  const refOut=String(req.body?.payoutReference||'').trim();if(next==='paid'&&(refOut.length<4||req.body?.verified!==true))return res.status(400).json({error:'Provide a verified payout reference before marking as paid.'});
  const change=db.transaction(async () => {
    await db.prepare('UPDATE investment_withdrawals SET status=?,payout_reference=COALESCE(?,payout_reference) WHERE id=?').run(next,next==='paid'?refOut:null,w.id);
    if(next==='paid'){
      await db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`INV-WD-${w.reference}`,'investment_withdrawal',-w.amount,w.id,'investment_withdrawal',`Verified payout ${refOut}`);
      await db.prepare("UPDATE investments SET status='closed' WHERE id=?").run(w.investment_id);
    }
  });
  await change();await notify(w.investor_id,'Investment withdrawal '+next,reason||`Withdrawal ${w.reference} is ${next}.`,'investment',w.id);
  await audit(req.user,'investment.withdrawal_status_changed','investment_withdrawal',w.id,{status:w.status},{status:next,payoutReference:next==='paid'?refOut:null},reason,req.ip);res.json({status:next});
});
router.post('/ops/investments/:id/earnings',requireAuth,requirePermission('investments.manage'),async (req, res) => {
  const inv=await db.prepare('SELECT * FROM investments WHERE id=?').get(req.params.id);if(!inv)return res.status(404).json({error:'Investment not found.'});
  const amount=Math.round(Number(req.body?.amount||0)),reference=String(req.body?.reference||'').trim();
  if(!Number.isSafeInteger(amount)||amount<=0||reference.length<4)return res.status(400).json({error:'Enter a positive actual amount and supporting transaction reference.'});
  const earningId=id();
  const insert=db.transaction(async () => {
    await db.prepare("INSERT INTO investment_earnings (id,investment_id,projected_amount,actual_amount,type,reference) VALUES (?,?,0,?,'actual',?)").run(earningId,inv.id,amount,reference);
    await db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`LED-INV-${reference}`,'investment_earning',amount,inv.id,'investment',`Verified actual investment earnings: ${reference}`);
  });
  try{await insert();}catch{return res.status(409).json({error:'That actual earnings reference has already been recorded.'});}
  await notify(inv.investor_id,'Investment earnings recorded',`Verified actual earnings of ₦${amount.toLocaleString()} were recorded.`,'investment',inv.id);
  await audit(req.user,'investment.actual_earnings_recorded','investment',inv.id,null,{amount,reference},String(req.body?.reason||''),req.ip);res.status(201).json({id:earningId,amount,type:'actual'});
});

export default router;
