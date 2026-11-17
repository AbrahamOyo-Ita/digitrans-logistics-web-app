import {asyncRouter} from '../async-router.js';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requirePermission, notify, audit } from '../auth.js';

const router=asyncRouter();
const id=()=>crypto.randomUUID();
const ref=p=>`${p}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

router.get('/finance/summary',requireAuth,requirePermission('finance.read'),async (_req, res) => {
  const earnings=await db.prepare("SELECT COUNT(*) deliveries,COALESCE(SUM(rider_earnings),0) rider_payable,COALESCE(SUM(digitrans_share),0) platform_share,COALESCE(SUM(eligible_fee),0) fees FROM rider_earnings").get();
  const pending=await db.prepare("SELECT COUNT(*) records,COALESCE(SUM(rider_earnings),0) total FROM rider_earnings WHERE settlement_status='pending'").get();
  const outstanding=await db.prepare("SELECT COUNT(*) records,COALESCE(SUM(amount),0) total FROM withdrawal_requests WHERE status IN ('requested','under_review','approved','processing')").get();
  const payments=await db.prepare("SELECT status,COUNT(*) count,COALESCE(SUM(amount),0) total FROM payments GROUP BY status").all();
  const marketExpenses=await db.prepare("SELECT COUNT(*) count,COALESCE(SUM(amount),0) total FROM market_run_expenses WHERE status='pending'").get();
  res.json({earnings,pending,outstanding,payments,marketExpenses});
});

router.get('/finance/earnings',requireAuth,requirePermission('finance.read'),async (req, res) => {
  const rows=await db.prepare(`SELECT e.*,p.full_name rider_name,d.reference delivery_reference,d.created_at delivered_at FROM rider_earnings e JOIN profiles p ON p.user_id=e.rider_id JOIN deliveries d ON d.id=e.delivery_id ORDER BY e.created_at DESC LIMIT 300`).all();
  res.json({earnings:rows});
});
router.get('/finance/ledger',requireAuth,requirePermission('finance.read'),async (req, res) => {
  const rows=await db.prepare('SELECT * FROM financial_ledger ORDER BY created_at DESC LIMIT 500').all();
  res.json({ledger:rows});
});

router.post('/finance/settlements',requireAuth,requirePermission('finance.manage'),async (req, res) => {
  const cutoff=req.body?.throughDate ? String(req.body.throughDate) : new Date().toISOString().slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)||Number.isNaN(Date.parse(cutoff)))return res.status(400).json({error:'Choose a valid settlement cutoff date.'});
  const eligible=(await db.prepare(`SELECT e.id,e.rider_id,e.rider_earnings,
    COALESCE((SELECT SUM(si.amount) FROM rider_settlement_items si JOIN rider_settlements s ON s.id=si.settlement_id WHERE si.earnings_id=e.id AND s.status IN ('pending','approved','paid')),0) settled,
    COALESCE((SELECT SUM(wi.amount) FROM rider_withdrawal_items wi JOIN withdrawal_requests w ON w.id=wi.withdrawal_id WHERE wi.earnings_id=e.id AND w.status IN ('requested','under_review','approved','processing','paid')),0) withdrawn
    FROM rider_earnings e WHERE e.created_at::date<=?::date ORDER BY e.created_at,e.id`).all(cutoff)).map(e=>({...e,available:Math.max(0,e.rider_earnings-e.settled-e.withdrawn)})).filter(e=>e.available>0);
  if(!eligible.length)return res.status(409).json({error:'There are no unreconciled earnings for that date.'});
  const grouped=new Map();for(const e of eligible){const list=grouped.get(e.rider_id)||[];list.push(e);grouped.set(e.rider_id,list);}
  const settlementIds=[];
  const create=db.transaction(async () => {
    for(const [riderId,rows] of grouped){
      const settlementId=id();settlementIds.push(settlementId);
      const total=rows.reduce((sum,e)=>sum+e.available,0);
      await db.prepare('INSERT INTO rider_settlements (id,settlement_date,total_payable) VALUES (?,?,?)').run(settlementId,cutoff,total);
      for(const e of rows)await db.prepare('INSERT INTO rider_settlement_items (settlement_id,rider_id,earnings_id,amount) VALUES (?,?,?,?)').run(settlementId,riderId,e.id,e.available);
    }
  });
  await create();
  await audit(req.user,'rider.settlements_created','settlement',settlementIds.join(','),null,{count:settlementIds.length,cutoff},null,req.ip);
  res.status(201).json({settlements:await db.prepare(`SELECT s.*,p.full_name rider_name,COUNT(si.earnings_id) delivery_count FROM rider_settlements s JOIN rider_settlement_items si ON si.settlement_id=s.id JOIN profiles p ON p.user_id=si.rider_id WHERE s.id IN (${settlementIds.map(()=>'?').join(',')}) GROUP BY s.id,p.full_name`).all(...settlementIds)});
});
router.get('/finance/settlements',requireAuth,requirePermission('finance.read'),async (_req, res) => {
  const rows=await db.prepare(`SELECT s.*,p.full_name rider_name,si.rider_id,COUNT(si.earnings_id) delivery_count FROM rider_settlements s JOIN rider_settlement_items si ON si.settlement_id=s.id JOIN profiles p ON p.user_id=si.rider_id GROUP BY s.id,si.rider_id,p.full_name ORDER BY s.created_at DESC LIMIT 200`).all();
  res.json({settlements:rows});
});
router.post('/finance/settlements/:id/approve',requireAuth,requirePermission('finance.manage'),async (req, res) => {
  const s=await db.prepare('SELECT * FROM rider_settlements WHERE id=?').get(req.params.id);
  if(!s)return res.status(404).json({error:'Settlement not found.'});
  if(s.status!=='pending')return res.status(409).json({error:'Only pending settlements can be approved.'});
  await db.prepare("UPDATE rider_settlements SET status='approved' WHERE id=?").run(s.id);
  await audit(req.user,'settlement.approved','settlement',s.id,{status:s.status},{status:'approved'},String(req.body?.reason||'Finance review'),req.ip);
  res.json({status:'approved'});
});
router.post('/finance/settlements/:id/payout',requireAuth,requirePermission('finance.manage'),async (req, res) => {
  const s=await db.prepare('SELECT * FROM rider_settlements WHERE id=?').get(req.params.id);
  if(!s)return res.status(404).json({error:'Settlement not found.'});
  if(s.status!=='approved')return res.status(409).json({error:'Settlement must be approved before payout.'});
  const payoutRef=String(req.body?.payoutReference||'').trim();
  if(payoutRef.length<4||req.body?.verified!==true)return res.status(400).json({error:'Enter the payout provider reference and confirm that the payout has been independently verified.'});
  const items=await db.prepare('SELECT * FROM rider_settlement_items WHERE settlement_id=?').all(s.id);
  const paid=db.transaction(async () => {
    await db.prepare("UPDATE rider_settlements SET status='paid',payout_reference=? WHERE id=?").run(payoutRef,s.id);
    for(const item of items){
      await db.prepare(`UPDATE rider_earnings SET settlement_status=CASE WHEN rider_earnings<=
        COALESCE((SELECT SUM(si.amount) FROM rider_settlement_items si JOIN rider_settlements st ON st.id=si.settlement_id WHERE si.earnings_id=rider_earnings.id AND st.status='paid'),0)+
        COALESCE((SELECT SUM(wi.amount) FROM rider_withdrawal_items wi JOIN withdrawal_requests wr ON wr.id=wi.withdrawal_id WHERE wi.earnings_id=rider_earnings.id AND wr.status='paid'),0)
        THEN 'paid' ELSE 'pending' END WHERE id=?`).run(item.earnings_id);
      await db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`SET-${s.id}-${item.earnings_id}`,'rider_payout',-item.amount,item.earnings_id,'rider_earning',`Verified payout ${payoutRef}`);
      await notify(item.rider_id,'Rider settlement paid',`Your settlement of ₦${item.amount.toLocaleString()} has been recorded.`,'finance',s.id);
    }
  });
  await paid();await audit(req.user,'settlement.paid','settlement',s.id,{status:s.status},{status:'paid',payoutReference:payoutRef},'Provider payout verified',req.ip);
  res.json({status:'paid',payoutReference:payoutRef});
});

router.get('/finance/withdrawals',requireAuth,requirePermission('finance.read'),async (_req, res) => {
  const rows=await db.prepare(`SELECT w.*,p.full_name rider_name,u.phone FROM withdrawal_requests w JOIN profiles p ON p.user_id=w.rider_id JOIN users u ON u.id=w.rider_id ORDER BY w.created_at DESC LIMIT 200`).all();
  res.json({withdrawals:rows});
});
router.post('/finance/withdrawals/:id/status',requireAuth,requirePermission('finance.manage'),async (req, res) => {
  const w=await db.prepare('SELECT * FROM withdrawal_requests WHERE id=?').get(req.params.id);
  if(!w)return res.status(404).json({error:'Withdrawal request not found.'});
  const next=String(req.body?.status||''),reason=String(req.body?.reason||'').trim();
  const allowed={requested:['under_review','rejected'],under_review:['approved','rejected'],approved:['processing','rejected'],processing:['paid','failed']};
  if(!(allowed[w.status]||[]).includes(next))return res.status(409).json({error:`Cannot move a withdrawal from ${w.status} to ${next}.`});
  const payoutReference=String(req.body?.payoutReference||'').trim();
  if(next==='paid'&&(!payoutReference||req.body?.verified!==true))return res.status(400).json({error:'A provider payout reference and independent verification are required.'});
  const update=db.transaction(async () => {
    await db.prepare('UPDATE withdrawal_requests SET status=?,payout_reference=COALESCE(?,payout_reference) WHERE id=?').run(next,next==='paid'?payoutReference:null,w.id);
    if(next==='paid'){
      await db.prepare('INSERT INTO financial_ledger (id,reference,type,amount,related_id,related_type,description) VALUES (?,?,?,?,?,?,?)').run(id(),`WD-${w.reference}`,'rider_withdrawal',-w.amount,w.id,'withdrawal',`Verified payout ${payoutReference}`);
      const items=await db.prepare('SELECT earnings_id FROM rider_withdrawal_items WHERE withdrawal_id=?').all(w.id);
      for(const item of items)await db.prepare(`UPDATE rider_earnings SET settlement_status=CASE WHEN rider_earnings<=
        COALESCE((SELECT SUM(si.amount) FROM rider_settlement_items si JOIN rider_settlements st ON st.id=si.settlement_id WHERE si.earnings_id=rider_earnings.id AND st.status='paid'),0)+
        COALESCE((SELECT SUM(wi.amount) FROM rider_withdrawal_items wi JOIN withdrawal_requests wr ON wr.id=wi.withdrawal_id WHERE wi.earnings_id=rider_earnings.id AND wr.status='paid'),0)
        THEN 'paid' ELSE 'pending' END WHERE id=?`).run(item.earnings_id);
    }
  });
  await update();await notify(w.rider_id,'Withdrawal '+next,reason||`Your withdrawal request is ${next}.`,'finance',w.id);
  await audit(req.user,'withdrawal.status_changed','withdrawal',w.id,{status:w.status},{status:next,payoutReference:next==='paid'?payoutReference:null},reason,req.ip);
  res.json({status:next});
});

router.get('/finance/market-expenses',requireAuth,requirePermission('finance.read'),async (req, res) => {
  const rows=await db.prepare(`SELECT e.*,m.reference market_reference,m.customer_id,m.status market_status FROM market_run_expenses e JOIN market_runs m ON m.id=e.market_run_id ORDER BY e.created_at DESC LIMIT 200`).all();
  res.json({expenses:rows});
});
router.post('/finance/market-expenses/:id/decision',requireAuth,requirePermission('finance.manage'),async (req, res) => {
  const expense=await db.prepare('SELECT * FROM market_run_expenses WHERE id=?').get(req.params.id);
  if(!expense)return res.status(404).json({error:'Expense not found.'});
  const status=String(req.body?.status||''),reason=String(req.body?.reason||'').trim();
  if(!['approved','rejected'].includes(status)||expense.status!=='pending')return res.status(409).json({error:'This expense cannot be reviewed.'});
  await db.prepare('UPDATE market_run_expenses SET status=? WHERE id=?').run(status,expense.id);
  const total=(await db.prepare("SELECT COALESCE(SUM(amount),0) total FROM market_run_expenses WHERE market_run_id=? AND status='approved'").get(expense.market_run_id)).total;
  await db.prepare('UPDATE market_runs SET estimated_items_cost=?,updated_at=now() WHERE id=?').run(total,expense.market_run_id);
  await audit(req.user,`market_expense.${status}`,'market_run_expense',expense.id,{status:expense.status},{status,amount:expense.amount},reason,req.ip);
  res.json({status,approvedExpenses:total});
});

router.get('/finance/payments',requireAuth,requirePermission('finance.read'),async (_req, res) => res.json({payments:await db.prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT 300').all()}));

export default router;
