import React,{useEffect,useMemo,useRef,useState} from 'react';
import {api,money,date,statusLabel,upload,mediaUrl} from '../lib/api';
import {useApiData} from '../lib/hooks';
import {downloadCsv} from '../lib/csv';
import {focusRecordElement} from '../lib/focus-record';
import {workspacePath} from '../../../shared/workspace-links.js';
import Icon from '../components/Icon';
import {Badge,Button,Card,Empty,Field,Input,Loading,Modal,PageTitle,Select,Textarea,StatCard} from '../components/UI';
import {ADMIN_ROLE_IDS,ADMIN_ROLE_LABELS,APP_ROLES} from '../../../shared/roles.js';
import {PERMISSION_DEPENDENCIES,normalizePermissionKeys,removePermissionAndDependents} from '../../../shared/permissions.js';

const hasPermission=(user,key)=>user?.role==='super_admin'||(user?.permissions||[]).includes(key);
const roleLabel=role=>ADMIN_ROLE_LABELS[role]||String(role||'').replaceAll('_',' ');

const formatWaitAge=minutes=>{
 const m=Math.max(0,Number(minutes)||0);
 if(m<1)return 'just now';
 if(m<60)return `${m}m waiting`;
 const h=Math.round(m/60);
 if(h<24)return `${h}h waiting`;
 return `${Math.round(h/24)}d waiting`;
};

const attentionCategories=[
 {key:'all',label:'All'},
 {key:'urgent',label:'Urgent'},
 {key:'deliveries',label:'Deliveries'},
 {key:'marketRuns',label:'Market Runs'},
 {key:'waybills',label:'Waybills'},
 {key:'verifications',label:'Verifications'},
 {key:'finance',label:'Finance'},
 {key:'investments',label:'Investments'},
 {key:'support',label:'Support'},
];

export function NeedsAttentionSection({navigate,limit=0,compact=false,title='Needs attention'}){
 const {data,loading,error,reload}=useApiData('/ops/attention');
 const [category,setCategory]=useState('all');
 const items=data?.items||[],summary=data?.summary||{};
 const filtered=useMemo(()=>{
  if(category==='all')return items;
  if(category==='urgent')return items.filter(item=>item.severity==='high');
  return items.filter(item=>item.category===category);
 },[items,category]);
 const visible=limit>0?filtered.slice(0,limit):filtered;
 return <Card className={compact?'mt-6':''}>
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
   <div>
    <div className="flex flex-wrap items-center gap-2">
     <h2 className="text-sm font-bold text-ink">{title}</h2>
     {!loading&&<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${summary.urgent?'bg-rose-50 text-rose-700':'bg-brand-50 text-brand-700'}`}>{summary.total||0} open{summary.urgent?` · ${summary.urgent} urgent`:''}</span>}
    </div>
    <p className="mt-1 text-[10px] text-slate-400">Actionable delays, approvals and unresolved exceptions scoped to your permissions.</p>
   </div>
   <div className="flex flex-wrap gap-2">
    {compact&&items.length>0&&<Button size="sm" variant="ghost" onClick={()=>navigate('/ops/attention')}>Open full queue</Button>}
    <Button size="sm" variant="outline" icon="refresh" onClick={reload}>Refresh</Button>
   </div>
  </div>
  {!loading&&items.length>0&&<div className="mb-4 flex flex-wrap gap-1.5">{attentionCategories.map(cat=>{
   const count=cat.key==='all'?items.length:Number(summary[cat.key]||0);
   if(cat.key!=='all'&&count===0)return null;
   const active=category===cat.key;
   return <button key={cat.key} type="button" onClick={()=>setCategory(cat.key)} className={`rounded-full px-3 py-1 text-[10px] font-bold transition ${active?'bg-brand-800 text-white':'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{cat.label} ({count})</button>;
  })}</div>}
  {loading?<Loading label="Checking operational queues…"/>:error?<p className="text-xs text-rose-600">{error}</p>:!visible.length?<Empty compact={compact} icon="check" title="Nothing needs attention" description="No blocked deliveries, pending approvals, or unreviewed items match this view."/>:<div className="space-y-2">{visible.map(item=><div key={item.key} className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${item.severity==='high'?'border-rose-200/80 bg-rose-50/40':'border-slate-200 bg-white'}`}>
   <div className="min-w-0">
    <div className="flex flex-wrap items-center gap-2">
     <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${item.severity==='high'?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-800'}`}>{item.severity==='high'?'Urgent':'Needs review'}</span>
     <p className="text-xs font-bold text-ink">{item.title}</p>
     <span className="text-[10px] text-slate-400">{formatWaitAge(item.ageMinutes)}</span>
    </div>
    <p className="mt-1 truncate text-[11px] text-slate-500">{item.subtitle}</p>
   </div>
   <Button size="sm" variant={item.severity==='high'?'primary':'outline'} onClick={()=>navigate(item.href)}>{item.actionLabel||'Open'}</Button>
  </div>)}</div>}
 </Card>;
}

export function NeedsAttentionView({navigate}){
 return <><PageTitle eyebrow="Action queue" title="Needs attention" description="Prioritized operational items, pending approvals, and overdue reviews for your role."/><NeedsAttentionSection navigate={navigate}/></>;
}

export function OpsOverview({navigate,user}){
 const {data,loading,error,reload}=useApiData('/ops/dashboard');
 if(loading)return <Loading/>;
 if(error)return <Card><p className="text-sm text-rose-600">{error}</p></Card>;
 const permissions=new Set(user?.permissions||[]),can=key=>user?.role==='super_admin'||permissions.has(key);
 const stats=data?.stats||{};
 const allCards=[
  ['Active deliveries',stats.activeDeliveries,'truck','blue','/ops/deliveries','deliveries.read'],
  ['Awaiting assignment',stats.pendingDeliveries,'clock','gold','/ops/deliveries','deliveries.read'],
  ['Completed deliveries',stats.completedDeliveries,'check','green','/ops/deliveries','deliveries.read'],
  ['Scheduled',stats.scheduledDeliveries,'clock','purple','/ops/deliveries','deliveries.read'],
  ['Pending rider review',stats.pendingRiders,'bike','gold','/ops/riders','riders.review'],
  ['Vendor applications',stats.pendingVendors,'users','blue','/ops/vendors','vendors.review'],
  ['Student verification',stats.pendingStudents,'shield','purple','/ops/students','students.review'],
  ['Pending Market Runs',stats.pendingMarketRuns,'bag','gold','/ops/market','market_runs.manage'],
  ['Pending waybills',stats.pendingWaybills,'box','blue','/ops/waybills','waybills.manage'],
 ];
 const cards=allCards.filter(card=>can(card[5])&&card[1]!==undefined);
 const fastActions=[
  ['Manual booking','plus','/ops/booking',['deliveries.create']],
  ['Assign deliveries','bike','/ops/deliveries',['deliveries.assign']],
  ['Review riders','shield','/ops/riders',['riders.review']],
  ['Service pricing','settings','/ops/pricing',['pricing.read','pricing.manage']],
 ].filter(([, , ,required])=>required.every(can));
 return <><PageTitle eyebrow="Operations control centre" title="The day, at a glance." description="Operational figures refreshed from the DigiTrans records you are authorised to access." action={<Button variant="outline" icon="refresh" onClick={reload}>Refresh</Button>}/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,icon,tone,path])=><StatCard key={label} label={label} value={value??0} icon={icon} tone={tone} onClick={()=>navigate(path)}/>)}</div><NeedsAttentionSection navigate={navigate} limit={6} compact/><div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><Card><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">Latest bookings</h2><p className="mt-1 text-[10px] text-slate-400">Recently created deliveries.</p></div><Button size="sm" variant="ghost" onClick={()=>navigate('/ops/deliveries')}>Open queue</Button></div>{data.recent?.length?<div className="space-y-2">{data.recent.map(delivery=><div key={delivery.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-xs font-bold text-ink">{delivery.reference}</p><p className="mt-1 text-[10px] text-slate-500">{delivery.manual_customer_name||delivery.recipient_name}</p></div><div className="flex items-center gap-3"><Badge status={delivery.status}/><span className="text-xs font-bold text-ink">{money(delivery.fee)}</span></div></div>)}</div>:<Empty icon="truck" title="No delivery requests"/>}</Card><div className="space-y-5">{can('finance.read')&&<Card className="bg-brand-950 text-white"><p className="text-[9px] font-bold uppercase tracking-widest text-white/45">Finance snapshot</p><div className="mt-3 grid grid-cols-2 gap-3"><div><p className="text-[10px] text-white/45">Rider earnings</p><p className="mt-1 text-lg font-bold">{money(stats.riderEarnings)}</p></div><div><p className="text-[10px] text-white/45">Outstanding settlement</p><p className="mt-1 text-lg font-bold">{money(stats.outstandingSettlements)}</p></div></div><Button size="sm" variant="gold" className="mt-4" onClick={()=>navigate('/ops/finance')}>Open finance</Button></Card>}{fastActions.length>0&&<Card><h2 className="text-sm font-bold text-ink">Fast actions</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{fastActions.map(([label,icon,path])=><button key={label} onClick={()=>navigate(path)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-semibold text-slate-600 hover:border-brand-200 hover:bg-brand-50"><Icon name={icon} size={15}/>{label}</button>)}</div></Card>}</div></div></>;
}

function DocsModal({kind,ownerId,onClose,showToast}){
 const [documents,setDocuments]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const base=kind==='rider'?`/rider/applications/${ownerId}/documents`:kind==='vendor'?`/ops/vendors/${ownerId}/documents`:kind==='student'?`/ops/students/${ownerId}/documents`:`/ops/investors/${ownerId}/documents`;
 useEffect(()=>{api(base).then(d=>setDocuments(d.documents||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[base]);
 const review=async(doc,status)=>{try{const p=kind==='rider'?`${base}/${doc.id}/status`:`${base}/${doc.id}/status`;await api(p,{method:'POST',body:{status,reason:'Reviewed by operations'}});setDocuments(prev=>prev.map(x=>x.id===doc.id?{...x,status}:x));showToast?.({title:'Document reviewed',message:`${statusLabel(doc.doc_type)} · ${status}`});}catch(e){showToast?.({type:'error',message:e.message});}};
 return <Modal title="Verification documents" description="Private files are visible only to authorised reviewers." onClose={onClose}><div className="space-y-3">{loading?<Loading/>:error?<p className="text-xs text-rose-600">{error}</p>:!documents.length?<Empty icon="file" title="No documents uploaded" description="The applicant must upload a supporting file."/>:documents.map(doc=><div key={doc.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-ink">{statusLabel(doc.doc_type)}</p><p className="mt-1 text-[9px] text-slate-400">{date(doc.created_at)}</p></div><Badge status={doc.status}/></div><div className="mt-3 flex gap-2"><a href={mediaUrl(`/api/private-files/${doc.id}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-brand-700">Open file <Icon name="external" size={12}/></a>{doc.status==='pending'&&<><Button size="sm" variant="soft" onClick={()=>review(doc,'approved')}>Approve</Button><Button size="sm" variant="outline" className="text-rose-600" onClick={()=>review(doc,'rejected')}>Reject</Button></>}</div></div>)}</div></Modal>;
}
function AppDecision({kind,userId,onClose,showToast}){
 const [status,setStatus]=useState('approved'),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');const path=kind==='rider'?`/rider/applications/${userId}/decision`:kind==='vendor'?`/ops/vendors/${userId}/decision`:kind==='student'?`/ops/students/${userId}/decision`:`/ops/investors/${userId}/decision`;try{await api(path,{method:'POST',body:{status,reason}});showToast?.({title:`${statusLabel(kind)} ${status}`,message:'Decision saved and applicant notified.'});onClose(true);}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <Modal title={`Review ${kind} application`} description="The decision is recorded in the audit log." onClose={()=>onClose(false)}><form onSubmit={submit} className="space-y-4"><Field label="Decision"><Select value={status} onChange={e=>setStatus(e.target.value)}><option value="approved">Approve</option><option value="rejected">Reject</option></Select></Field><Field label="Reason / message"><Textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain the decision…"/></Field>{error&&<p className="text-xs text-rose-600">{error}</p>}<Button type="submit" loading={busy} className="w-full">Record decision</Button></form></Modal>;
}
export function ApplicationsView({kind,showToast,locationSearch=''}){
 const focusId=new URLSearchParams(locationSearch).get('focus')||'';
 const path=kind==='rider'?'/rider/applications':kind==='vendor'?'/ops/vendors?status=pending':kind==='student'?'/ops/students':'/ops/investors';
 const {data,loading,error,reload}=useApiData(path);const [docs,setDocs]=useState(null),[decision,setDecision]=useState(null),[search,setSearch]=useState('');
 const raw=kind==='rider'?data?.riders||[]:kind==='vendor'?data?.vendors||[]:kind==='student'?data?.students||[]:data?.investors||[];const idField=kind==='rider'?'id':'user_id';
 const rows=useMemo(()=>{
  const q=search.trim().toLowerCase();
  if(!q)return raw;
  return raw.filter(r=>`${r.full_name||''} ${r.business_name||''} ${r.email||''} ${r.phone||''} ${r.institution||''}`.toLowerCase().includes(q));
 },[raw,search]);
 useEffect(()=>{if(focusId&&!loading&&rows.some(r=>r[idField]===focusId))focusRecordElement(focusId);},[focusId,loading,rows,idField]);
 const title=kind==='rider'?'Rider applications':kind==='vendor'?'Vendor applications':kind==='student'?'Student verification':'Investor verification';
 const detail=r=>kind==='rider'?[['Vehicle',r.vehicle_type],['Registration',r.vehicle_reg],['Address',r.address],['Documents',r.document_count],['Agreement',r.agreement_current?'Accepted':'Missing']]:kind==='vendor'?[['Business',r.business_name],['Category',r.category],['Address',r.business_address],['Documents',r.document_count]]:kind==='student'?[['Institution',r.institution],['Student ID',r.matric_no],['Expires',r.expires_at]]:[['Address',r.address],['ID type',r.id_type],['Documents',r.document_count]];
 return <><PageTitle eyebrow="Account review" title={title} description="Review submitted information and private documents before changing account status." action={<Button variant="outline" icon="refresh" onClick={reload}>Refresh</Button>}/><Card padding="p-4" className="mb-4"><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search applicant name, email, phone…"/></Card>{loading?<Loading/>:error?<Card><p className="text-sm text-rose-600">{error}</p></Card>:!rows.length?<Empty icon="shield" title="No applications need review" description="New applications appear when submitted."/>:<div className="grid gap-4 xl:grid-cols-2">{rows.map(r=><Card key={r[idField]} data-record-id={r[idField]} padding="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-ink">{r.full_name||r.business_name}</p><p className="mt-1 text-[10px] text-slate-400">{r.email} · {r.phone}</p></div><Badge status={kind==='student'?r.verification_status:r.approval_status||r.verification_status}/></div><div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">{detail(r).map(([k,v])=><div key={k} className="flex justify-between gap-3 text-xs"><span className="text-slate-400">{k}</span><span className="text-right font-semibold text-ink">{v||'-'}</span></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>setDocs({kind,ownerId:r[idField]})}>Review documents</Button><Button size="sm" onClick={()=>setDecision({kind,id:r[idField]})}>Review application</Button></div></Card>)}</div>}{docs&&<DocsModal kind={docs.kind} ownerId={docs.ownerId} showToast={showToast} onClose={()=>setDocs(null)}/ >}{decision&&<AppDecision kind={decision.kind} userId={decision.id} showToast={showToast} onClose={refresh=>{setDecision(null);if(refresh)reload();}}/>}</>;
}

const accountCsvColumns=[
 {key:'full_name',label:'Full name'},
 {key:'business_name',label:'Business name'},
 {key:'email',label:'Email'},
 {key:'phone',label:'Phone'},
 {key:'role',label:'Role'},
 {key:'status',label:'Account status'},
 {key:'created_at',label:'Joined at'},
];

export function AccountsView({user,showToast,locationSearch=''}){
 const focusId=new URLSearchParams(locationSearch).get('focus')||'';
 const [role,setRole]=useState(''),[search,setSearch]=useState(''),[selected,setSelected]=useState(null);const path=`/ops/users?limit=100${role?`&role=${role}`:''}${search?`&search=${encodeURIComponent(search)}`:''}`;const {data,loading,error,reload}=useApiData(path);
 const users=data?.users||[];
 useEffect(()=>{if(focusId&&!loading&&users.some(u=>u.id===focusId))focusRecordElement(focusId);},[focusId,loading,users]);
 const canManage=hasPermission(user,'accounts.suspend')||hasPermission(user,'users.manage');
 const canManageAccount=account=>canManage&&account.id!==user?.id&&(account.role!=='super_admin'||user?.role==='super_admin');
 return <><PageTitle eyebrow="Account directory" title="Accounts & verification" description="Status changes require an assigned account-management permission. Super Administrator accounts are protected from other positions." action={<Button variant="outline" icon="download" disabled={loading||!users.length} onClick={()=>downloadCsv('digitrans-accounts.csv',users,accountCsvColumns)}>Download CSV</Button>}/><Card className="mb-5"><div className="grid gap-3 sm:grid-cols-[200px_1fr]"><Select value={role} onChange={e=>setRole(e.target.value)}><option value="">All account types</option>{['customer','student','rider','vendor','investor','ops_officer','rider_manager','vendor_manager','finance_officer','investment_manager'].map(x=><option key={x} value={x}>{statusLabel(x)}</option>)}</Select><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, phone or business…"/></div></Card>{loading?<Loading/>:error?<Card><p className="text-sm text-rose-600">{error}</p></Card>:!users.length?<Empty icon="users" title="No matching accounts"/>:<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-400"><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Joined</th>{canManage&&<th className="px-4 py-3"/>}</tr></thead><tbody>{users.map(u=><tr key={u.id} data-record-id={u.id} className="border-b border-slate-50 text-xs"><td className="px-4 py-3"><p className="font-bold text-ink">{u.full_name||u.business_name}</p><p className="mt-1 text-[10px] text-slate-400">{u.email} · {u.phone}</p></td><td className="px-4 py-3 text-slate-500">{statusLabel(u.role)}</td><td className="px-4 py-3"><Badge status={u.status}/></td><td className="px-4 py-3 text-[10px] text-slate-500">{statusLabel(u.rider_status||u.vendor_status||u.investor_status||'-')}</td><td className="px-4 py-3 text-slate-400">{date(u.created_at)}</td>{canManage&&<td className="px-4 py-3">{canManageAccount(u)&&<Button size="sm" variant="outline" onClick={()=>setSelected(u)}>Manage</Button>}</td>}</tr>)}</tbody></table></div>}{selected&&<AccountStatus user={selected} done={()=>{setSelected(null);reload();}} showToast={showToast} onClose={()=>setSelected(null)}/>}</>;
}
function AccountStatus({user,onClose,done,showToast}){
 const [status,setStatus]=useState(user.status),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const submit=async e=>{e.preventDefault();setBusy(true);try{await api(`/ops/users/${user.id}/status`,{method:'POST',body:{status,reason}});showToast?.({title:'Account updated',message:`${user.full_name} · ${status}`});done();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <Modal title="Account status" description={`${user.full_name} · ${statusLabel(user.role)}`} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Status"><Select value={status} onChange={e=>setStatus(e.target.value)}>{['active','suspended','rejected','deactivated','archived'].map(s=><option key={s}>{s}</option>)}</Select></Field><Field label="Reason"><Textarea value={reason} onChange={e=>setReason(e.target.value)}/></Field><p className="rounded-xl bg-amber-50 p-3 text-[10px] leading-5 text-amber-900">Suspending an account blocks its authenticated sessions. This action is logged.</p>{error&&<p className="text-xs text-rose-600">{error}</p>}<Button type="submit" className="w-full" loading={busy}>Update status</Button></form></Modal>;
}

function ConfirmPayout({item,type,onClose,onDone}){
 const [reference,setReference]=useState(''),[verified,setVerified]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const submit=async e=>{e.preventDefault();setBusy(true);try{const path=type==='settlement'?`/finance/settlements/${item.id}/payout`:type==='investor'?`/ops/investor-withdrawals/${item.id}/status`:`/finance/withdrawals/${item.id}/status`;await api(path,{method:'POST',body:{status:'paid',payoutReference:reference,verified}});onDone();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <Modal title="Record verified payout" description={`Amount ${money(item.total_payable??item.amount)} · ${item.reference||item.payout_reference||''}`} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Payout provider reference" required><Input value={reference} onChange={e=>setReference(e.target.value)} required minLength={4} placeholder="Provider transfer reference"/></Field><label className="flex items-start gap-2 text-xs leading-5 text-slate-600"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)} className="mt-1 accent-[#214c32]"/>I independently verified this payout against the provider or bank reconciliation record.</label><p className="rounded-xl bg-amber-50 p-3 text-[10px] leading-5 text-amber-900">The payout will be added to the append-only ledger. Do not confirm based on a browser redirect alone.</p>{error&&<p className="text-xs text-rose-600">{error}</p>}<Button type="submit" loading={busy} disabled={!verified} className="w-full">Record payout as paid</Button></form></Modal>;
}
const financeEarningsColumns=[
 {key:'rider_name',label:'Rider'},
 {key:'delivery_reference',label:'Delivery reference'},
 {key:'eligible_fee',label:'Eligible fee (NGN)'},
 {key:'rider_earnings',label:'Rider share (NGN)'},
 {key:'digitrans_share',label:'Platform share (NGN)'},
 {key:'settlement_status',label:'Settlement status'},
 {key:'created_at',label:'Recorded at'},
];

const financeSettlementColumns=[
 {key:'rider_name',label:'Rider'},
 {key:'settlement_date',label:'Cutoff date'},
 {key:'delivery_count',label:'Deliveries'},
 {key:'total_payable',label:'Total payable (NGN)'},
 {key:'status',label:'Status'},
 {key:'payout_reference',label:'Payout reference'},
 {key:'created_at',label:'Created at'},
];

export function FinanceView({showToast,user,locationSearch=''}){
 const focusId=new URLSearchParams(locationSearch).get('focus')||'';
 const [draft,setDraft]=useState({search:'',status:'',from:'',to:''}),[filters,setFilters]=useState({});
 const filterParams=useMemo(()=>{
  const p=new URLSearchParams();
  for(const [k,v] of Object.entries(filters))if(v)p.set(k,v);
  return p.toString();
 },[filters]);
 const suffix=filterParams?`?${filterParams}`:'';
 const earnParams=useMemo(()=>{
  const p=new URLSearchParams({limit:'100'});
  if(filters.search)p.set('search',filters.search);
  if(filters.status&&['pending','settled'].includes(filters.status))p.set('settlementStatus',filters.status);
  if(filters.from)p.set('from',filters.from);
  if(filters.to)p.set('to',filters.to);
  return p.toString();
 },[filters]);
 const summary=useApiData('/finance/summary'),settle=useApiData(`/finance/settlements${suffix}`),withdraw=useApiData(`/finance/withdrawals${suffix}`),earn=useApiData(`/finance/earnings?${earnParams}`);const [payout,setPayout]=useState(null),[working,setWorking]=useState(''),canManage=hasPermission(user,'finance.manage');
 useEffect(()=>{if(focusId&&!settle.loading&&!withdraw.loading&&!earn.loading)focusRecordElement(focusId);},[focusId,settle.loading,withdraw.loading,earn.loading]);
 const invalidRange=draft.from&&draft.to&&draft.from>draft.to;
 const applyFilters=e=>{e.preventDefault();if(invalidRange)return;setFilters(Object.fromEntries(Object.entries(draft).filter(([,v])=>v)));};
 const clearFilters=()=>{setDraft({search:'',status:'',from:'',to:''});setFilters({});};
 const refresh=()=>{summary.reload();settle.reload();withdraw.reload();earn.reload();};
 const createSettlement=async()=>{setWorking('create');try{const d=await api('/finance/settlements',{method:'POST',body:{throughDate:new Date().toISOString().slice(0,10)}});showToast?.({title:'Settlement batch created',message:`${d.settlements?.length||0} rider records awaiting review.`});refresh();}catch(e){showToast?.({type:'error',message:e.message});}finally{setWorking('');}};
 const setSettlement=async(s,status)=>{setWorking(s.id);try{await api(`/finance/settlements/${s.id}/approve`,{method:'POST',body:{reason:'Reviewed by Finance'}});showToast?.({title:'Settlement approved',message:money(s.total_payable)});refresh();}catch(e){showToast?.({type:'error',message:e.message});}finally{setWorking('');}};
 const setWithdrawal=async(w,status)=>{setWorking(w.id);try{await api(`/finance/withdrawals/${w.id}/status`,{method:'POST',body:{status,reason:`Finance review: ${status}`}});showToast?.({title:'Withdrawal updated',message:`${w.reference} · ${status}`});refresh();}catch(e){showToast?.({type:'error',message:e.message});}finally{setWorking('');}};
 const s=summary.data||{};
 const earnings=earn.data?.earnings||[],settlements=settle.data?.settlements||[],withdrawals=withdraw.data?.withdrawals||[];
 return <><PageTitle eyebrow="Finance & reconciliation" title="Rider earnings & payouts" description="Review backend-calculated earnings, reconcile settlement batches and record verified payouts." action={<div className="flex flex-wrap gap-2"><Button variant="outline" icon="download" disabled={earn.loading||!earnings.length} onClick={()=>downloadCsv('digitrans-rider-earnings-ledger.csv',earnings,financeEarningsColumns)}>Export earnings</Button><Button variant="outline" icon="download" disabled={settle.loading||!settlements.length} onClick={()=>downloadCsv('digitrans-settlements.csv',settlements,financeSettlementColumns)}>Export settlements</Button>{canManage&&<Button icon="plus" loading={working==='create'} onClick={createSettlement}>Create settlement batch</Button>}</div>}/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Eligible delivery fees" value={money(s.earnings?.fees)} icon="truck"/><StatCard label="Rider payable" value={money(s.earnings?.rider_payable)} icon="wallet" tone="gold"/><StatCard label="DigiTrans share" value={money(s.earnings?.platform_share)} icon="chart" tone="green"/><StatCard label="Unsettled rider earnings" value={money(s.pending?.total)} icon="clock" tone="blue"/></div>
  <Card className="mt-5"><form onSubmit={applyFilters} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="Search"><Input value={draft.search} onChange={e=>setDraft({...draft,search:e.target.value})} placeholder="Rider, reference, payout ref…"/></Field><Field label="Status"><Select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="">All statuses</option>{['pending','requested','under_review','approved','processing','paid','settled','rejected'].map(v=><option key={v} value={v}>{statusLabel(v)}</option>)}</Select></Field><Field label="From date"><Input type="date" value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></Field><Field label="To date"><Input type="date" value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></Field></div>{invalidRange&&<p className="text-xs text-rose-600">The start date must be on or before the end date.</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={clearFilters}>Clear</Button><Button type="submit" disabled={!!invalidRange}>Apply filters</Button></div></form></Card>
  <div className="mt-6 grid gap-5 xl:grid-cols-2"><Card><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">Settlement batches</h2><p className="mt-1 text-[10px] text-slate-400">A batch is one rider’s eligible earnings through a cutoff date.</p></div><Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Refresh</Button></div>{settle.loading?<Loading/>:settlements.length?<div className="space-y-2">{settlements.map(x=><div key={x.id} data-record-id={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div><p className="text-xs font-bold text-ink">{x.rider_name} · {money(x.total_payable)}</p><p className="mt-1 text-[10px] text-slate-400">{x.settlement_date} · {x.delivery_count} deliveries{x.payout_reference?` · ${x.payout_reference}`:''}</p></div><div className="flex items-center gap-2"><Badge status={x.status}/>{x.status==='pending'&&canManage&&<Button size="sm" variant="soft" loading={working===x.id} onClick={()=>setSettlement(x,'approved')}>Approve</Button>}{x.status==='approved'&&canManage&&<Button size="sm" onClick={()=>setPayout({item:x,type:'settlement'})}>Record payout</Button>}</div></div>)}</div>:<Empty icon="wallet" title="No settlement batches" description="Create a batch from unallocated, completed delivery earnings."/>}</Card><Card><div className="mb-4"><h2 className="text-sm font-bold text-ink">Rider withdrawals</h2><p className="mt-1 text-[10px] text-slate-400">Requests reserve individual earning balances until resolved.</p></div>{withdraw.loading?<Loading/>:withdrawals.length?<div className="space-y-2">{withdrawals.map(w=><div key={w.id} data-record-id={w.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div><p className="text-xs font-bold text-ink">{w.rider_name} · {money(w.amount)}</p><p className="mt-1 text-[10px] text-slate-400">{w.reference} · {w.destination_account}</p></div><div className="flex items-center gap-2"><Badge status={w.status}/>{w.status==='requested'&&canManage&&<Button size="sm" variant="soft" loading={working===w.id} onClick={()=>setWithdrawal(w,'under_review')}>Review</Button>}{w.status==='under_review'&&canManage&&<Button size="sm" variant="soft" onClick={()=>setWithdrawal(w,'approved')}>Approve</Button>}{w.status==='approved'&&canManage&&<Button size="sm" variant="outline" onClick={()=>setWithdrawal(w,'processing')}>Processing</Button>}{w.status==='processing'&&canManage&&<Button size="sm" onClick={()=>setPayout({item:w,type:'withdrawal'})}>Verify payout</Button>}</div></div>)}</div>:<Empty icon="wallet" title="No withdrawal requests" description="Rider requests will appear here."/>}</Card></div><Card className="mt-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">Recent earnings ledger</h2><p className="mt-1 text-[10px] text-slate-400">Commission uses the pricing version attached to each delivery.</p></div><Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Refresh</Button></div>{earn.loading?<Loading/>:earnings.length?<div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-400"><th className="pb-3">Rider</th><th className="pb-3">Delivery</th><th className="pb-3">Eligible fee</th><th className="pb-3">Rider share</th><th className="pb-3">Platform share</th><th className="pb-3">Settlement</th></tr></thead><tbody>{earnings.slice(0,100).map(e=><tr key={e.id} data-record-id={e.id} className="border-b border-slate-50 text-xs"><td className="py-3 font-semibold text-ink">{e.rider_name}</td><td className="py-3 text-slate-500">{e.delivery_reference}</td><td className="py-3">{money(e.eligible_fee)}</td><td className="py-3 font-bold text-ink">{money(e.rider_earnings)}</td><td className="py-3">{money(e.digitrans_share)}</td><td className="py-3"><Badge status={e.settlement_status}/></td></tr>)}</tbody></table></div>:<Empty icon="chart" title="No earnings recorded" description="Earnings are created after a delivery is completed."/>}</Card>{payout&&<ConfirmPayout item={payout.item} type={payout.type} onClose={()=>setPayout(null)} onDone={()=>{showToast?.({title:'Payout recorded',message:'The verified payment is now in the financial ledger.'});setPayout(null);refresh();}}/>}</>;
}

export function PricingView({showToast,user}){
 const {data,loading,error,reload}=useApiData('/ops/pricing');const [busy,setBusy]=useState(false),[err,setErr]=useState('');const current=data?.versions?.[0],canManagePricing=hasPermission(user,'pricing.manage'),canManageSettings=hasPermission(user,'settings.manage');
 const save=async e=>{e.preventDefault();setBusy(true);setErr('');const f=Object.fromEntries(new FormData(e.currentTarget));try{const r=await api('/ops/pricing',{method:'POST',body:Object.fromEntries(Object.entries(f).map(([k,v])=>[k,Number(v)]))});showToast?.({title:'Pricing version created',message:r.version});reload();}catch(e){setErr(e.message);}finally{setBusy(false);}};
 const saveRate=async e=>{e.preventDefault();setBusy(true);const f=Object.fromEntries(new FormData(e.currentTarget));try{await api('/ops/waybill-rates',{method:'POST',body:{...f,price:Number(f.price)}});showToast?.({title:'Waybill route updated',message:`${f.origin} → ${f.destination}`});reload();}catch(e){setErr(e.message);}finally{setBusy(false);}};
 const [zoneName,setZoneName]=useState(''),[zoneBusy,setZoneBusy]=useState(false);
 const addZone=async e=>{e.preventDefault();setZoneBusy(true);try{await api('/ops/zones',{method:'POST',body:{name:zoneName,description:`DigiTrans service area · ${zoneName}`,active:true}});setZoneName('');showToast?.({title:'Service area added',message:zoneName});reload();}catch(e){setErr(e.message);}finally{setZoneBusy(false);}};
 return <><PageTitle eyebrow="Authoritative server configuration" title="Pricing & service areas" description="New pricing is versioned. Existing bookings keep the price calculated at creation."/>{loading?<Loading/>:error?<Card><p className="text-sm text-rose-600">{error}</p></Card>:<div className="grid max-w-6xl gap-5 xl:grid-cols-[1fr_1fr]"><Card><div className="flex items-start justify-between"><div><h2 className="text-sm font-bold text-ink">Create pricing version</h2><p className="mt-1 text-[10px] text-slate-400">Current: {current?.version||'Not configured'}</p></div><Badge status={current?'active':'needs setup'}/></div>{canManagePricing&&<form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">{[['baseFee','Base fee (₦)',current?.base_fee??800],['perKm','Per km (₦)',current?.per_km??180],['minFee','Minimum fare (₦)',current?.min_fee??1000],['studentFlat','Student fare (₦)',current?.student_flat??800],['vendorDiscountPct','Vendor discount (%)',current?.vendor_discount_pct??0],['scheduledSurcharge','Scheduled surcharge (₦)',current?.scheduled_surcharge??0],['specialCharge','Special surcharge (₦)',current?.special_charge??0],['riderCommissionPct','Rider share (%)',current?.rider_commission_pct??25],['marketRunsFee','Market Runs fee (₦)',current?.market_runs_fee??1500]].map(([name,label,value])=><Field key={name} label={label} required><Input name={name} type="number" min="0" step="0.01" defaultValue={value} required/></Field>)}{err&&<p className="text-xs text-rose-600 sm:col-span-2">{err}</p>}<div className="sm:col-span-2"><Button type="submit" loading={busy}>Save new pricing version</Button></div></form>}{!canManagePricing&&<p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Read-only access. A pricing administrator can publish new pricing versions.</p>}{current&&<div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pricing history</p><div className="space-y-2">{data.versions.slice(0,5).map(v=><div key={v.id} className="flex items-center justify-between text-xs"><span className="font-semibold text-ink">{v.version}</span><span className="text-slate-500">{money(v.base_fee)} base · {money(v.per_km)}/km · {v.rider_commission_pct}% rider</span></div>)}</div></div>}</Card><div className="space-y-5"><Card><h2 className="text-sm font-bold text-ink">Waybill route rate</h2><p className="mt-1 text-[10px] text-slate-400">Add or update an origin, destination and weight band.</p>{canManagePricing&&<form onSubmit={saveRate} className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Origin" required><Input name="origin" defaultValue="Calabar" required/></Field><Field label="Destination" required><Input name="destination" required placeholder="City"/></Field><Field label="Weight band"><Select name="weightBand"><option value="below_5kg">Below 5kg</option><option value="5_10kg">5–10kg</option><option value="above_10kg">Above 10kg</option></Select></Field><Field label="Price (₦)" required><Input name="price" type="number" min="0" required/></Field><div className="sm:col-span-2"><Button type="submit" size="sm" loading={busy}>Save route rate</Button></div></form>}<div className="mt-4 max-h-44 space-y-1 overflow-auto border-t border-slate-100 pt-3">{data.waybillRates?.map(r=><div key={r.id} className="flex justify-between text-[10px] text-slate-500"><span>{r.origin} → {r.destination} · {statusLabel(r.weight_band)}</span><span className="font-bold text-ink">{money(r.price)}</span></div>)}</div></Card><Card><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">Service zones</h2><p className="mt-1 text-[10px] text-slate-400">Inactive areas are not available to bookings.</p></div><Badge status={data.zones?.some(z=>z.active)?'active':'needs setup'}/></div>{canManagePricing&&<form onSubmit={addZone} className="mt-4 flex gap-2"><Input value={zoneName} onChange={e=>setZoneName(e.target.value)} placeholder="Add a service area" required/><Button type="submit" loading={zoneBusy} icon="plus">Add</Button></form>}<div className="mt-4 flex flex-wrap gap-2">{data.zones?.map(z=><button key={z.id} onClick={async()=>{if(!canManagePricing)return;try{await api(`/ops/zones/${z.id}`,{method:'PATCH',body:{active:!z.active}});reload();}catch(e){showToast?.({type:'error',message:e.message});}}} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${z.active?'border-brand-200 bg-brand-50 text-brand-800':'border-slate-200 bg-slate-100 text-slate-400'}`}>{z.name} · {z.active?'On':'Off'}</button>)}</div></Card>{canManageSettings&&<RiderAgreement/>}</div></div>}</>;
}
function RiderAgreement(){
 const [data,setData]=useState({version:'',text:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');useEffect(()=>{api('/ops/rider-agreement').then(setData).catch(()=>{});},[]);
 const save=async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await api('/ops/rider-agreement',{method:'POST',body:data});setData({...data,version:r.version});}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <Card><h2 className="text-sm font-bold text-ink">Current rider agreement</h2><p className="mt-1 text-[10px] leading-5 text-slate-400">Changing the version requires active riders to review and accept it again.</p><form onSubmit={save} className="mt-4 space-y-3"><Field label="Version"><Input value={data.version} onChange={e=>setData({...data,version:e.target.value})} placeholder="e.g. 1.1" required/></Field><Field label="Approved agreement text" hint="At least 100 characters; attach the signed source document in your legal records."><Textarea value={data.text} onChange={e=>setData({...data,text:e.target.value})} minLength={100} required/></Field>{error&&<p className="text-xs text-rose-600">{error}</p>}<Button type="submit" size="sm" loading={busy}>Publish rider agreement</Button></form></Card>;
}

const opsWaybillColumns=[
 {key:'reference',label:'Reference'},
 {key:'waybill_number',label:'Waybill number'},
 {key:'status',label:'Status'},
 {key:'payment_status',label:'Payment status'},
 {key:'origin',label:'Origin'},
 {key:'destination_city',label:'Destination'},
 {key:'sender_name',label:'Sender'},
 {key:'recipient_name',label:'Recipient'},
 {key:'weight',label:'Weight (kg)'},
 {key:'fee',label:'Fee (NGN)'},
 {key:'created_at',label:'Created at'},
];

const opsWithdrawalColumns=[
 {key:'reference',label:'Reference'},
 {key:'rider_name',label:'Rider'},
 {key:'amount',label:'Amount (NGN)'},
 {key:'destination_account',label:'Destination'},
 {key:'status',label:'Status'},
 {key:'payout_reference',label:'Payout reference'},
 {key:'created_at',label:'Requested at'},
];

const opsInvAppColumns=[
 {key:'reference',label:'Reference'},
 {key:'investor_name',label:'Investor'},
 {key:'investor_email',label:'Email'},
 {key:'opportunity_title',label:'Opportunity'},
 {key:'amount',label:'Amount (NGN)'},
 {key:'status',label:'Status'},
 {key:'created_at',label:'Applied at'},
];

const opsInvWdColumns=[
 {key:'reference',label:'Reference'},
 {key:'investor_name',label:'Investor'},
 {key:'opportunity_title',label:'Opportunity'},
 {key:'amount',label:'Amount (NGN)'},
 {key:'status',label:'Status'},
 {key:'payout_reference',label:'Payout reference'},
 {key:'created_at',label:'Requested at'},
];

export function OpsWaybills({showToast,user,navigate,locationSearch=''}){
 const focusId=new URLSearchParams(locationSearch).get('focus')||'';
 const [draft,setDraft]=useState({search:'',status:'',paymentStatus:'',from:'',to:''}),[filters,setFilters]=useState({}),[page,setPage]=useState(1);
 const path=useMemo(()=>{
  const p=new URLSearchParams({page:String(page),limit:'50'});
  for(const [k,v] of Object.entries(filters))if(v)p.set(k,v);
  return `/ops/waybills?${p.toString()}`;
 },[page,filters]);
 const {data,loading,error,reload}=useApiData(path);const [busy,setBusy]=useState(''),canReconcile=hasPermission(user,'finance.manage');
 const waybills=data?.waybills||[],pages=Number(data?.pages||0);
 useEffect(()=>{if(focusId&&!loading&&waybills.some(w=>w.id===focusId))focusRecordElement(focusId);},[focusId,loading,waybills]);
 const invalidRange=draft.from&&draft.to&&draft.from>draft.to;
 const apply=e=>{e.preventDefault();if(invalidRange)return;setPage(1);setFilters(Object.fromEntries(Object.entries(draft).filter(([,v])=>v)));};
 const clear=()=>{setDraft({search:'',status:'',paymentStatus:'',from:'',to:''});setFilters({});setPage(1);};
 const updates={submitted:['under_review','awaiting_parcel_dropoff','parcel_received','cancelled','rejected'],under_review:['awaiting_parcel_dropoff','parcel_received','rejected','cancelled'],awaiting_parcel_dropoff:['parcel_received','cancelled'],parcel_received:['awaiting_payment','paid','cancelled'],awaiting_payment:['paid','cancelled'],paid:['processed'],processed:['ready_for_dispatch'],ready_for_dispatch:['dispatched'],dispatched:['in_transit'],in_transit:['arrived_at_destination','delivery_failed'],arrived_at_destination:['awaiting_collection','out_for_final_delivery','delivered'],awaiting_collection:['delivered','returned'],out_for_final_delivery:['delivered','delivery_failed'],delivery_failed:['returned','out_for_final_delivery']};
 const change=async(w,status)=>{setBusy(w.id);try{await api(`/ops/waybills/${w.id}/status`,{method:'POST',body:{status,location:w.destination_city,notes:['rejected','cancelled','delivery_failed','returned'].includes(status)?'Operations review required':'Operations status update'}});showToast?.({title:'Waybill updated',message:`${w.reference} · ${statusLabel(status)}`});reload();}catch(e){showToast?.({type:'error',message:e.message});}finally{setBusy('');}};
 const reconcile=async w=>{const ref=window.prompt('Enter the verified provider or cash reconciliation reference:');if(!ref)return;try{await api(`/ops/waybills/${w.id}/payment`,{method:'POST',body:{providerReference:ref,verified:window.confirm('Have you independently verified the payment?')}});showToast?.({title:'Payment reconciled',message:w.reference});reload();}catch(e){showToast?.({type:'error',message:e.message});}};
 return <><PageTitle eyebrow="Intercity operations" title="Waybill desk" description="Review intake, reconcile verified payment and move parcels through dispatch milestones." action={<div className="flex flex-wrap gap-2"><Button variant="outline" icon="download" disabled={loading||!waybills.length} onClick={()=>downloadCsv('digitrans-ops-waybills.csv',waybills,opsWaybillColumns)}>Download CSV</Button><Button variant="outline" icon="refresh" onClick={reload}>Refresh</Button></div>}/>
  <Card className="mb-4"><form onSubmit={apply} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Field label="Search"><Input value={draft.search} onChange={e=>setDraft({...draft,search:e.target.value})} placeholder="Waybill #, ref, sender, city…"/></Field><Field label="Status"><Select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="">All statuses</option>{['submitted','under_review','awaiting_parcel_dropoff','parcel_received','awaiting_payment','paid','processed','ready_for_dispatch','dispatched','in_transit','arrived_at_destination','awaiting_collection','out_for_final_delivery','delivered','delivery_failed','returned','cancelled','rejected'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field><Field label="Payment"><Select value={draft.paymentStatus} onChange={e=>setDraft({...draft,paymentStatus:e.target.value})}><option value="">All payment statuses</option>{['pending','initiated','successful','under_review','failed'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field><Field label="From date"><Input type="date" value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></Field><Field label="To date"><Input type="date" value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></Field></div>{invalidRange&&<p className="text-xs text-rose-600">The start date must be on or before the end date.</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={clear}>Clear</Button><Button type="submit" disabled={!!invalidRange}>Apply filters</Button></div></form></Card>
  {loading?<Loading/>:error?<Card><p className="text-sm text-rose-600">{error}</p></Card>:!waybills.length?<Empty icon="box" title="No waybill requests"/>:<div className="space-y-3">{waybills.map(w=><Card key={w.id} data-record-id={w.id} padding="p-4 sm:p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink">{w.waybill_number||w.reference}</p><Badge status={w.status}/></div><p className="mt-1 text-xs text-slate-500">{w.origin} → {w.destination_city} · {w.weight} kg · {money(w.fee)}</p><p className="mt-1 text-[10px] text-slate-400">{w.sender_name} · {w.sender_phone} → {w.recipient_name} · {w.recipient_phone}</p><p className="mt-1 text-[10px] text-slate-400">Payment: {w.payment_status}</p></div><div className="flex flex-wrap gap-2">{w.payment_status!=='successful'&&canReconcile&&<Button size="sm" variant="soft" onClick={()=>reconcile(w)}>Reconcile payment</Button>}{(updates[w.status]||[]).map(s=><Button key={s} size="sm" variant={['delivered','dispatched'].includes(s)?'primary':'outline'} loading={busy===w.id} onClick={()=>change(w,s)}>{statusLabel(s)}</Button>)}{w.waybill_number&&<Button size="sm" variant="ghost" onClick={async()=>{try{const d=await api(`/ops/waybills/${w.id}/label`);window.print();showToast?.({title:'Waybill label ready',message:d.barcodeValue});}catch(e){showToast?.({type:'error',message:e.message});}}} icon="qr">Label</Button>}{navigate&&<Button size="sm" variant="ghost" icon="support" onClick={()=>navigate(workspacePath(user.role,'support',{relatedId:w.waybill_number||w.reference||w.id,category:'waybill'}))}>Help</Button>}</div></div></Card>)}</div>}
  {!loading&&!error&&pages>1&&<div className="mt-4 flex items-center justify-between gap-3"><Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(v=>Math.max(1,v-1))}>Previous</Button><span className="text-[10px] text-slate-400">Page {page} of {pages}</span><Button size="sm" variant="outline" disabled={page>=pages} onClick={()=>setPage(v=>Math.min(pages,v+1))}>Next</Button></div>}
 </>;
}

export function FinanceWithdrawals({showToast,user,navigate,locationSearch=''}){
 const focusId=new URLSearchParams(locationSearch).get('focus')||'';
 const [draft,setDraft]=useState({search:'',status:'',from:'',to:''}),[filters,setFilters]=useState({}),[page,setPage]=useState(1);
 const path=useMemo(()=>{
  const p=new URLSearchParams({page:String(page),limit:'50'});
  for(const [k,v] of Object.entries(filters))if(v)p.set(k,v);
  return `/finance/withdrawals?${p.toString()}`;
 },[page,filters]);
 const {data,loading,error,reload}=useApiData(path);const [payout,setPayout]=useState(null),[working,setWorking]=useState(''),canManage=hasPermission(user,'finance.manage');
 const rows=data?.withdrawals||[],pages=Number(data?.pages||0);
 useEffect(()=>{if(focusId&&!loading&&rows.some(w=>w.id===focusId))focusRecordElement(focusId);},[focusId,loading,rows]);
 const invalidRange=draft.from&&draft.to&&draft.from>draft.to;
 const apply=e=>{e.preventDefault();if(invalidRange)return;setPage(1);setFilters(Object.fromEntries(Object.entries(draft).filter(([,v])=>v)));};
 const clear=()=>{setDraft({search:'',status:'',from:'',to:''});setFilters({});setPage(1);};
 const move=async(w,status)=>{setWorking(w.id);try{await api(`/finance/withdrawals/${w.id}/status`,{method:'POST',body:{status,reason:`Finance review: ${status}`}});showToast?.({title:'Withdrawal updated',message:`${w.reference} · ${status}`});reload();}catch(e){showToast?.({type:'error',message:e.message});}finally{setWorking('');}};
 return <><PageTitle eyebrow="Finance review" title="Rider payout requests" description="Confirm the balance reservation, review the destination and record only reconciled payouts." action={<div className="flex flex-wrap gap-2"><Button variant="outline" icon="download" disabled={loading||!rows.length} onClick={()=>downloadCsv('digitrans-rider-withdrawals.csv',rows,opsWithdrawalColumns)}>Download CSV</Button><Button variant="outline" icon="refresh" onClick={reload}>Refresh</Button></div>}/>
  <Card className="mb-4"><form onSubmit={apply} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="Search"><Input value={draft.search} onChange={e=>setDraft({...draft,search:e.target.value})} placeholder="Reference, rider, account…"/></Field><Field label="Status"><Select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="">All statuses</option>{['requested','under_review','approved','processing','paid','rejected'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field><Field label="From date"><Input type="date" value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></Field><Field label="To date"><Input type="date" value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></Field></div>{invalidRange&&<p className="text-xs text-rose-600">The start date must be on or before the end date.</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={clear}>Clear</Button><Button type="submit" disabled={!!invalidRange}>Apply filters</Button></div></form></Card>
  {loading?<Loading/>:error?<p className="text-sm text-rose-600">{error}</p>:!rows.length?<Empty icon="wallet" title="No rider withdrawals"/>:<div className="space-y-3">{rows.map(w=><Card key={w.id} data-record-id={w.id} padding="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-ink">{w.rider_name} · {money(w.amount)}</p><p className="mt-1 text-[10px] text-slate-400">{w.reference} · {w.destination_account}</p></div><div className="flex flex-wrap items-center gap-2"><Badge status={w.status}/>{w.status==='requested'&&canManage&&<Button size="sm" onClick={()=>move(w,'under_review')}>Review</Button>}{w.status==='under_review'&&canManage&&<Button size="sm" onClick={()=>move(w,'approved')}>Approve</Button>}{w.status==='approved'&&canManage&&<Button size="sm" variant="outline" onClick={()=>move(w,'processing')}>Processing</Button>}{w.status==='processing'&&canManage&&<Button size="sm" onClick={()=>setPayout(w)}>Verify payout</Button>}{navigate&&<Button size="sm" variant="ghost" icon="support" onClick={()=>navigate(workspacePath(user.role,'support',{relatedId:w.reference||w.id,category:'payment'}))}>Help</Button>}</div></div></Card>)}</div>}
  {!loading&&!error&&pages>1&&<div className="mt-4 flex items-center justify-between gap-3"><Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(v=>Math.max(1,v-1))}>Previous</Button><span className="text-[10px] text-slate-400">Page {page} of {pages}</span><Button size="sm" variant="outline" disabled={page>=pages} onClick={()=>setPage(v=>Math.min(pages,v+1))}>Next</Button></div>}
  {payout&&<ConfirmPayout type="withdrawal" item={payout} onClose={()=>setPayout(null)} onDone={()=>{setPayout(null);reload();showToast?.({title:'Payout reconciled',message:payout.reference});}}/>}</>;
}

export function OpsInvestments({showToast,user,initialTab='opportunities',locationSearch=''}){
 const queryParams=new URLSearchParams(locationSearch);
 const queryTab=queryParams.get('tab')||initialTab,focusId=queryParams.get('focus')||'';
 const [tab,setTab]=useState(queryTab),[draft,setDraft]=useState({search:'',status:'',from:'',to:''}),[filters,setFilters]=useState({}),[page,setPage]=useState(1);
 useEffect(()=>{if(queryTab&&['opportunities','applications','withdrawals'].includes(queryTab))setTab(queryTab);},[queryTab]);
 const filterPath=useMemo(()=>{
  const p=new URLSearchParams({page:String(page),limit:'50'});
  for(const [k,v] of Object.entries(filters))if(v)p.set(k,v);
  return p.toString();
 },[page,filters]);
 const opportunities=useApiData('/ops/opportunities'),applications=useApiData(`/ops/investment-applications?${filterPath}`),withdrawals=useApiData(`/ops/investor-withdrawals?${filterPath}`);
 const [create,setCreate]=useState(false),[busy,setBusy]=useState(''),[payout,setPayout]=useState(null),[error,setError]=useState('');
 useEffect(()=>{if(focusId&&!opportunities.loading&&!applications.loading&&!withdrawals.loading)focusRecordElement(focusId);},[focusId,tab,opportunities.loading,applications.loading,withdrawals.loading]);
 const canManageInvestments=hasPermission(user,'investments.manage'),canManageFinance=hasPermission(user,'finance.manage');
 const invalidRange=draft.from&&draft.to&&draft.from>draft.to;
 const applyFilters=e=>{e.preventDefault();if(invalidRange)return;setPage(1);setFilters(Object.fromEntries(Object.entries(draft).filter(([,v])=>v)));};
 const clearFilters=()=>{setDraft({search:'',status:'',from:'',to:''});setFilters({});setPage(1);};
 const refresh=()=>{opportunities.reload();applications.reload();withdrawals.reload();};
 const createOpportunity=async e=>{e.preventDefault();setBusy('create');setError('');const f=Object.fromEntries(new FormData(e.currentTarget));try{await api('/ops/opportunities',{method:'POST',body:{...f,minInvestment:Number(f.minInvestment),maxInvestment:Number(f.maxInvestment)||null,durationMonths:Number(f.durationMonths),projectedReturnPct:Number(f.projectedReturnPct),capacity:Number(f.capacity)||null}});showToast?.({title:'Draft created',message:'Submit it for review before Super Administrator publishing.'});setCreate(false);refresh();}catch(e){setError(e.message);}finally{setBusy('');}};
 const statusChange=async(o,status)=>{setBusy(o.id);try{await api(`/ops/opportunities/${o.id}/status`,{method:'POST',body:{status,reason:'Investment governance review'}});showToast?.({title:'Opportunity updated',message:statusLabel(status)});refresh();}catch(e){showToast?.({type:'error',message:e.message});}finally{setBusy('');}};
 const decision=async(a,status)=>{setBusy(a.id);try{await api(`/ops/investment-applications/${a.id}/decision`,{method:'POST',body:{status,reason:'Investment application review'}});showToast?.({title:'Application updated',message:`${a.reference} · ${status}`});refresh();}catch(e){showToast?.({type:'error',message:e.message});}finally{setBusy('');}};
 const appRows=applications.data?.applications||[],wdRows=withdrawals.data?.withdrawals||[];
 return <><PageTitle eyebrow="Investment governance" title="Opportunities & applications" description="Draft and review opportunities, manage investor applications, and keep projected results separate from verified earnings." action={<div className="flex flex-wrap gap-2">{tab==='applications'&&<Button variant="outline" icon="download" disabled={applications.loading||!appRows.length} onClick={()=>downloadCsv('digitrans-investor-applications.csv',appRows,opsInvAppColumns)}>Download CSV</Button>}{tab==='withdrawals'&&<Button variant="outline" icon="download" disabled={withdrawals.loading||!wdRows.length} onClick={()=>downloadCsv('digitrans-investor-withdrawals.csv',wdRows,opsInvWdColumns)}>Download CSV</Button>}{canManageInvestments&&<Button onClick={()=>setCreate(true)} icon="plus">New draft</Button>}</div>}/><div className="mb-5 flex gap-2 border-b border-slate-200">{[['opportunities','Opportunities'],['applications','Applications'],['withdrawals','Withdrawals']].map(([k,l])=><button key={k} onClick={()=>{setTab(k);setPage(1);}} className={`border-b-2 px-3 py-2 text-xs font-bold ${tab===k?'border-brand-700 text-brand-800':'border-transparent text-slate-400'}`}>{l}</button>)}</div>
  {tab!=='opportunities'&&<Card className="mb-4"><form onSubmit={applyFilters} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="Search"><Input value={draft.search} onChange={e=>setDraft({...draft,search:e.target.value})} placeholder="Reference, investor, opportunity…"/></Field><Field label="Status"><Select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="">All statuses</option>{(tab==='applications'?['submitted','under_review','approved','funded','rejected','cancelled']:['requested','under_review','approved','processing','paid','rejected']).map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field><Field label="From date"><Input type="date" value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></Field><Field label="To date"><Input type="date" value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></Field></div>{invalidRange&&<p className="text-xs text-rose-600">The start date must be on or before the end date.</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={clearFilters}>Clear</Button><Button type="submit" disabled={!!invalidRange}>Apply filters</Button></div></form></Card>}
  {tab==='opportunities'&&(opportunities.loading?<Loading/>:opportunities.error?<Card><p className="text-sm text-rose-600">{opportunities.error}</p></Card>:!opportunities.data?.opportunities?.length?<Empty icon="chart" title="No opportunities"/>:<div className="space-y-3">{opportunities.data.opportunities.map(o=><Card key={o.id} data-record-id={o.id} padding="p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><p className="text-sm font-bold text-ink">{o.title}</p><Badge status={o.status}/></div><p className="mt-1 text-xs text-slate-500">{money(o.min_investment)} min · {o.duration_months} months · {o.projected_return_pct??0}% projected, not guaranteed</p><p className="mt-1 text-[10px] leading-5 text-slate-400">{o.risk_disclosure}</p></div><div className="flex flex-wrap gap-2">{o.status==='draft'&&canManageInvestments&&<Button size="sm" variant="outline" onClick={()=>statusChange(o,'under_review')}>Submit for review</Button>}{o.status==='under_review'&&canManageInvestments&&<Button size="sm" variant="soft" onClick={()=>statusChange(o,'approved')}>Approve</Button>}{o.status==='approved'&&user.role==='super_admin'&&<Button size="sm" onClick={()=>statusChange(o,'published')}>Publish approved terms</Button>}{o.status==='published'&&canManageInvestments&&<Button size="sm" variant="outline" onClick={()=>statusChange(o,'suspended')}>Suspend</Button>}</div></div></Card>)}</div>)}{tab==='applications'&&(applications.loading?<Loading/>:applications.error?<Card><p className="text-sm text-rose-600">{applications.error}</p></Card>:!appRows.length?<Empty icon="file" title="No investor applications"/>:<div className="space-y-3">{appRows.map(a=><Card key={a.id} data-record-id={a.id} padding="p-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold text-ink">{a.investor_name} · {a.opportunity_title}</p><p className="mt-1 text-[10px] text-slate-400">{a.reference} · {a.investor_email}</p></div><div className="flex items-center gap-2"><p className="text-sm font-bold text-ink">{money(a.amount)}</p><Badge status={a.status}/>{['submitted','under_review'].includes(a.status)&&canManageInvestments&&<><Button size="sm" variant="soft" onClick={()=>decision(a,'approved')} loading={busy===a.id}>Approve</Button><Button size="sm" variant="outline" className="text-rose-600" onClick={()=>decision(a,'rejected')}>Reject</Button></>}</div></div></Card>)}</div>)}{tab==='withdrawals'&&(withdrawals.loading?<Loading/>:withdrawals.error?<Card><p className="text-sm text-rose-600">{withdrawals.error}</p></Card>:!wdRows.length?<Empty icon="wallet" title="No investor withdrawals"/>:<div className="space-y-3">{wdRows.map(w=><Card key={w.id} data-record-id={w.id} padding="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-ink">{w.investor_name} · {money(w.amount)}</p><p className="mt-1 text-[10px] text-slate-400">{w.reference} · {w.opportunity_title}</p></div><div className="flex items-center gap-2"><Badge status={w.status}/>{w.status==='requested'&&canManageFinance&&<Button size="sm" onClick={async()=>{try{await api(`/ops/investor-withdrawals/${w.id}/status`,{method:'POST',body:{status:'under_review'}});refresh();}catch(e){showToast?.({type:'error',message:e.message});}}}>Review</Button>}{w.status==='under_review'&&canManageFinance&&<Button size="sm" onClick={async()=>{try{await api(`/ops/investor-withdrawals/${w.id}/status`,{method:'POST',body:{status:'approved'}});refresh();}catch(e){showToast?.({type:'error',message:e.message});}}}>Approve</Button>}{w.status==='approved'&&canManageFinance&&<Button size="sm" variant="outline" onClick={async()=>{try{await api(`/ops/investor-withdrawals/${w.id}/status`,{method:'POST',body:{status:'processing'}});refresh();}catch(e){showToast?.({type:'error',message:e.message});}}}>Processing</Button>}{w.status==='processing'&&canManageFinance&&<Button size="sm" onClick={()=>setPayout({item:w,type:'investor'})}>Verify payout</Button>}</div></div></Card>)}</div>)}{create&&<Modal title="Draft investment opportunity" description="This is a draft only. Publishing requires review and Super Administrator approval." onClose={()=>setCreate(false)} wide><form onSubmit={createOpportunity} className="grid gap-4 sm:grid-cols-2"><Field label="Opportunity title" required className="sm:col-span-2"><Input name="title" minLength={3} required/></Field><Field label="Description" required className="sm:col-span-2"><Textarea name="description" minLength={20} required placeholder="Describe the approved logistics project, proposed use of funds and investor participation."/></Field><Field label="Category"><Input name="category" defaultValue="Logistics"/></Field><Field label="Duration"><Select name="durationMonths"><option value="6">6 months</option><option value="12">12 months</option></Select></Field><Field label="Minimum investment (₦)" required><Input name="minInvestment" type="number" min="1000" required/></Field><Field label="Maximum investment (₦)"><Input name="maxInvestment" type="number" min="1000"/></Field><Field label="Capacity (₦)"><Input name="capacity" type="number" min="0"/></Field><Field label="Projected return (%)" hint="Not guaranteed; must match approved agreement."><Input name="projectedReturnPct" type="number" min="0" max="100" step="0.01" defaultValue="0"/></Field><Field label="Start date"><Input name="startDate" type="date"/></Field><Field label="Closing date" required><Input name="closingDate" type="date" required/></Field><Field label="Maturity date"><Input name="maturityDate" type="date"/></Field><Field label="Return structure" className="sm:col-span-2"><Input name="returnStructure" placeholder="Subject to approved agreement"/></Field><Field label="Agreement document reference" required><Input name="agreementDoc" required placeholder="Approved agreement version / secure document ID"/></Field><Field label="Eligibility"><Input name="eligibility" defaultValue="Verified investors only"/></Field><Field label="Payment terms" className="sm:col-span-2"><Textarea name="paymentTerms"/></Field><Field label="Risk disclosure" required className="sm:col-span-2"><Textarea name="riskDisclosure" minLength={20} required/></Field>{error&&<p className="text-xs text-rose-600 sm:col-span-2">{error}</p>}<div className="flex justify-end sm:col-span-2"><Button type="submit" loading={busy==='create'}>Save draft</Button></div></form></Modal>}{payout&&<ConfirmPayout item={payout.item} type="investor" onClose={()=>setPayout(null)} onDone={()=>{setPayout(null);refresh();showToast?.({title:'Investor payout recorded',message:payout.item.reference});}}/>}</>;
}

export function ContentManagement({showToast}){
 const banners=useApiData('/ops/content/banners'),faqs=useApiData('/ops/content/faqs'),content=useApiData('/public/content');const [busy,setBusy]=useState(false),[error,setError]=useState('');const refresh=()=>{banners.reload();faqs.reload();content.reload();};
 const addBanner=async e=>{e.preventDefault();setBusy(true);setError('');const form=e.currentTarget,f=new FormData(form),image=f.get('image');try{const fields={heading:f.get('heading'),description:f.get('description'),link:f.get('link'),startDate:f.get('startDate'),endDate:f.get('endDate'),active:true,sortOrder:f.get('sortOrder')};if(image?.size){await upload('/ops/content/banners',image,fields,'image');}else await api('/ops/content/banners',{method:'POST',body:fields});form.reset();showToast?.({title:'Promotion added',message:'It will display only during its active dates.'});refresh();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const addFaq=async e=>{e.preventDefault();setBusy(true);const form=e.currentTarget,f=Object.fromEntries(new FormData(form));try{await api('/ops/content/faqs',{method:'POST',body:f});form.reset();showToast?.({title:'FAQ published',message:'The public help centre is updated.'});refresh();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const saveSettings=async e=>{e.preventDefault();setBusy(true);const f=Object.fromEntries(new FormData(e.currentTarget));try{await api('/ops/content/settings',{method:'PATCH',body:f});showToast?.({title:'Public contact details saved'});refresh();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const setActive=async b=>{try{await api(`/ops/content/banners/${b.id}`,{method:'PATCH',body:{active:!b.active}});refresh();}catch(e){showToast?.({type:'error',message:e.message});}};
 const deleteFaq=async f=>{if(!window.confirm('Remove this FAQ from the public site?'))return;try{await api(`/ops/content/faqs/${f.id}`,{method:'DELETE'});refresh();}catch(e){showToast?.({type:'error',message:e.message});}};
 return <><PageTitle eyebrow="Public website CMS" title="Promotions, FAQs & contact" description="Manage active banners, FAQs and public contact details. Expired promotions stay hidden."/><div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="text-sm font-bold text-ink">Add a promotional banner</h2><form onSubmit={addBanner} className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Heading" required><Input name="heading" minLength={3} required/></Field><Field label="Destination link"><Input name="link" placeholder="/local-delivery or https://…"/></Field><Field label="Description" className="sm:col-span-2"><Textarea name="description"/></Field><Field label="Image (optional)" hint="JPG, PNG or WebP · maximum 5 MB"><Input name="image" type="file" accept="image/jpeg,image/png,image/webp"/></Field><Field label="Sort order"><Input name="sortOrder" type="number" defaultValue="0"/></Field><Field label="Start date"><Input name="startDate" type="date"/></Field><Field label="End date"><Input name="endDate" type="date"/></Field>{error&&<p className="text-xs text-rose-600 sm:col-span-2">{error}</p>}<div className="sm:col-span-2"><Button type="submit" loading={busy}>Add banner</Button></div></form><div className="mt-5 space-y-2 border-t border-slate-100 pt-4">{banners.data?.banners?.map(b=><div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-ink">{b.heading}</p><p className="mt-1 text-[10px] text-slate-400">{b.start_date||'Always'} → {b.end_date||'No end date'}</p></div><button onClick={()=>setActive(b)}><Badge status={b.active?'active':'inactive'}/></button></div>)}</div></Card><Card><h2 className="text-sm font-bold text-ink">Public contact details</h2><form key={content.data?.settings?JSON.stringify(content.data.settings):'settings-loading'} onSubmit={saveSettings} className="mt-4 space-y-3"><Field label="Phone"><Input name="public_phone" defaultValue={content.data?.settings?.public_phone||''}/></Field><Field label="Email"><Input name="public_email" type="email" defaultValue={content.data?.settings?.public_email||''}/></Field><Field label="Address"><Input name="public_address" defaultValue={content.data?.settings?.public_address||''}/></Field><Field label="About DigiTrans"><Textarea name="public_about" defaultValue={content.data?.settings?.public_about||''}/></Field><Field label="Service areas text"><Input name="public_service_areas" defaultValue={content.data?.settings?.public_service_areas||''}/></Field><Button type="submit" loading={busy}>Save public details</Button></form><div className="mt-6 border-t border-slate-100 pt-5"><h3 className="text-sm font-bold text-ink">Add a frequently asked question</h3><form onSubmit={addFaq} className="mt-3 space-y-3"><Field label="Question" required><Input name="question" required/></Field><Field label="Answer" required><Textarea name="answer" minLength={10} required/></Field><div className="grid grid-cols-2 gap-3"><Field label="Category"><Input name="category" defaultValue="General"/></Field><Field label="Sort order"><Input name="sortOrder" type="number" defaultValue="0"/></Field></div><Button type="submit" size="sm" loading={busy}>Publish FAQ</Button></form><div className="mt-4 space-y-2">{faqs.data?.faqs?.map(f=><div key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-xs font-bold text-ink">{f.question}</p><p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{f.answer}</p></div><button onClick={()=>deleteFaq(f)} className="text-[10px] font-bold text-rose-600">Remove</button></div>)}</div></div></Card></div></>;
}

function auditPrettyValue(value){
 if(value===null||value===undefined||value==='')return '—';
 if(typeof value!=='string')return JSON.stringify(value,null,2);
 try{return JSON.stringify(JSON.parse(value),null,2);}catch{return value;}
}
function auditTime(value){return value?new Date(value).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'}):'—';}

const auditCsvColumns=[
 {key:'chain_sequence',label:'Chain sequence'},
 {key:'action',label:'Action'},
 {key:'actor_role',label:'Actor position'},
 {key:'actor_name',label:'Actor name'},
 {key:'actor_email',label:'Actor email'},
 {key:'record_type',label:'Record type'},
 {key:'record_id',label:'Record ID'},
 {key:'reason',label:'Reason'},
 {key:'request_id',label:'Request ID'},
 {key:'created_at',label:'Timestamp'},
];

export function AuditView(){
 const [draftFilters,setDraftFilters]=useState({search:'',action:'',actorRole:'',recordType:'',from:'',to:''});
 const [appliedFilters,setAppliedFilters]=useState({}),[page,setPage]=useState(1);
 const [integrity,setIntegrity]=useState(null),[integrityBusy,setIntegrityBusy]=useState(false),[integrityError,setIntegrityError]=useState('');
 const [exporting,setExporting]=useState(false),[exportError,setExportError]=useState('');
 const pageSize=25,params=new URLSearchParams({page:String(page),limit:String(pageSize)});
 for(const [key,value] of Object.entries(appliedFilters))if(value)params.set(key,value);
 const {data,loading,error,reload}=useApiData(`/ops/audit?${params.toString()}`);
 const rows=data?.logs||[],pagination=data?.pagination||{page,limit:pageSize,total:0,pages:0};
 const applyFilters=event=>{
  event.preventDefault();
  const next=Object.fromEntries(Object.entries(draftFilters).map(([key,value])=>[key,String(value||'').trim()]).filter(([,value])=>value));
  setAppliedFilters(next);setPage(1);
 };
 const clearFilters=()=>{setDraftFilters({search:'',action:'',actorRole:'',recordType:'',from:'',to:''});setAppliedFilters({});setPage(1);setExportError('');};
 const verifyIntegrity=async()=>{
  setIntegrityBusy(true);setIntegrityError('');
  try{setIntegrity(await api('/ops/audit/integrity'));}
  catch(err){setIntegrityError(err.message||'The audit integrity check could not be completed.');}
  finally{setIntegrityBusy(false);}
 };
 const exportAudit=async()=>{
  setExporting(true);setExportError('');
  try{
   const exportParams=new URLSearchParams({page:'1',limit:'100'});
   for(const [key,value] of Object.entries(appliedFilters))if(value)exportParams.set(key,value);
   const first=await api(`/ops/audit?${exportParams.toString()}`),all=[...(first.logs||[])];
   const maxPages=Math.min(Number(first.pagination?.pages||1),100);
   for(let next=2;next<=maxPages;next++){
    exportParams.set('page',String(next));
    const pageData=await api(`/ops/audit?${exportParams.toString()}`);
    all.push(...(pageData.logs||[]));
   }
   if(Number(first.pagination?.pages||1)>maxPages)throw new Error('This export exceeds 10,000 audit entries. Narrow the date range or filters before exporting.');
   downloadCsv('digitrans-audit-logs.csv',all,auditCsvColumns);
  }catch(err){setExportError(err.message||'Audit CSV export failed.');}
  finally{setExporting(false);}
 };
 return <><PageTitle eyebrow="Accountability" title="Audit history" description="Search sensitive activity by actor, action, record, reason or date. Entries are append-only and cryptographically linked." action={<div className="flex flex-wrap gap-2"><Button variant="outline" icon="download" loading={exporting} disabled={loading||!rows.length||exporting} onClick={exportAudit}>Download CSV</Button><Button variant="outline" icon="refresh" onClick={reload}>Refresh</Button><Button variant="soft" icon="shield" loading={integrityBusy} onClick={verifyIntegrity}>Verify integrity</Button></div>}/>
  {exportError&&<Card className="mb-4 border-rose-200 bg-rose-50"><p className="text-xs text-rose-700">{exportError}</p></Card>}
  <Card className="mb-4">
   <form onSubmit={applyFilters} className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
     <Field label="Search events"><Input value={draftFilters.search} onChange={event=>setDraftFilters({...draftFilters,search:event.target.value})} placeholder="Actor, record ID, reason, request ID…"/></Field>
     <Field label="Action contains"><Input value={draftFilters.action} onChange={event=>setDraftFilters({...draftFilters,action:event.target.value})} placeholder="e.g. payment.reviewed"/></Field>
     <Field label="Actor position"><Select value={draftFilters.actorRole} onChange={event=>setDraftFilters({...draftFilters,actorRole:event.target.value})}><option value="">All positions</option><option value="system">System</option>{APP_ROLES.map(role=><option key={role} value={role}>{roleLabel(role)}</option>)}</Select></Field>
     <Field label="Record type"><Input value={draftFilters.recordType} onChange={event=>setDraftFilters({...draftFilters,recordType:event.target.value})} placeholder="e.g. delivery, payment"/></Field>
     <Field label="From date"><Input type="date" value={draftFilters.from} onChange={event=>setDraftFilters({...draftFilters,from:event.target.value})}/></Field>
     <Field label="To date"><Input type="date" value={draftFilters.to} onChange={event=>setDraftFilters({...draftFilters,to:event.target.value})}/></Field>
    </div>
    {draftFilters.from&&draftFilters.to&&draftFilters.from>draftFilters.to&&<p className="text-xs text-rose-600">The start date must be on or before the end date.</p>}
    <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" onClick={clearFilters}>Clear filters</Button><Button type="submit" disabled={!!(draftFilters.from&&draftFilters.to&&draftFilters.from>draftFilters.to)}>Apply filters</Button></div>
   </form>
  </Card>
  {integrity&&<Card className={`mb-4 border ${integrity.integrity?.valid?'border-emerald-200 bg-emerald-50/70':'border-rose-200 bg-rose-50/70'}`}>
   <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${integrity.integrity?.valid?'bg-white text-emerald-700':'bg-white text-rose-700'}`}><Icon name={integrity.integrity?.valid?'check':'alert'}/></span><div><h2 className={`text-sm font-bold ${integrity.integrity?.valid?'text-emerald-900':'text-rose-900'}`}>{integrity.integrity?.valid?'Audit chain verified':'Audit chain integrity warning'}</h2><p className={`mt-1 text-xs leading-5 ${integrity.integrity?.valid?'text-emerald-800':'text-rose-800'}`}>{integrity.integrity?.valid?`${integrity.integrity.checked.toLocaleString()} chained entries checked.`:integrity.integrity?.reason||'The stored audit entries do not match the chain head.'}</p>{integrity.legacyEntries>0&&<p className="mt-1 text-[10px] text-amber-800">{integrity.legacyEntries.toLocaleString()} earlier audit entries pre-date hash chaining and are not included in this verification.</p>}</div></div><p className="shrink-0 text-[10px] text-slate-500">Chain head · {String(integrity.integrity?.headHash||'').slice(0,16)}…</p></div>
  </Card>}
  {integrityError&&<Card className="mb-4 border-rose-200 bg-rose-50"><p className="text-xs text-rose-700">{integrityError}</p></Card>}
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">{loading?'Loading events…':`${Number(pagination.total||0).toLocaleString()} event${pagination.total===1?'':'s'} found`}</p><p className="text-[10px] text-slate-400">Page {pagination.pages?pagination.page:0} of {pagination.pages||0}</p></div>
  {loading?<Loading/>:error?<Card><p className="text-sm text-rose-600">{error}</p></Card>:!rows.length?<Empty icon="file" title="No audit events" description="Try a broader date range or remove one of the filters."/>:<div className="space-y-2">{rows.map(log=><Card key={log.id} padding="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold text-ink">{statusLabel(log.action)}</p><Badge status={log.actor_role||'system'}/>{log.chain_sequence&&<span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">#{Number(log.chain_sequence).toLocaleString()}</span>}</div><p className="mt-1 break-all text-[10px] text-slate-500">{log.actor_name||log.actor_email||'System'}{log.actor_email&&log.actor_name?` · ${log.actor_email}`:''} · {log.record_type||'record'}{log.record_id?` · ${log.record_id}`:''}</p>{log.reason&&<p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">Reason · {log.reason}</p>}</div><p className="shrink-0 text-[10px] text-slate-400">{auditTime(log.created_at)}</p></div>
    <details className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><summary className="cursor-pointer text-[10px] font-bold text-brand-700">Recorded values and integrity metadata</summary><div className="mt-3 grid gap-3 lg:grid-cols-2"><div><p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Previous value</p><pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 text-[10px] leading-5 text-slate-600">{auditPrettyValue(log.prev_value)}</pre></div><div><p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">New value</p><pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 text-[10px] leading-5 text-slate-600">{auditPrettyValue(log.new_value)}</pre></div></div><dl className="mt-3 grid gap-2 border-t border-slate-200 pt-3 text-[10px] sm:grid-cols-2"><div><dt className="text-slate-400">Request ID</dt><dd className="mt-0.5 break-all font-mono text-slate-600">{log.request_id||'—'}</dd></div><div><dt className="text-slate-400">IP address</dt><dd className="mt-0.5 break-all font-mono text-slate-600">{log.ip||'—'}</dd></div><div><dt className="text-slate-400">User agent</dt><dd className="mt-0.5 break-words text-slate-600">{log.user_agent||'—'}</dd></div><div><dt className="text-slate-400">Entry hash</dt><dd className="mt-0.5 break-all font-mono text-slate-600">{log.entry_hash||'Legacy entry — not hash chained'}</dd></div></dl></details>
   </Card>)}</div>}
  {!loading&&!error&&pagination.pages>1&&<div className="mt-4 flex items-center justify-between gap-3"><Button variant="outline" size="sm" disabled={pagination.page<=1} onClick={()=>setPage(value=>Math.max(1,value-1))}>Previous</Button><span className="text-[10px] text-slate-400">Showing page {pagination.page} of {pagination.pages}</span><Button variant="outline" size="sm" disabled={pagination.page>=pagination.pages} onClick={()=>setPage(value=>Math.min(pagination.pages,value+1))}>Next</Button></div>}
 </>;
}

export function ContactMessages({showToast}){const {data,loading,error,reload}=useApiData('/ops/contact-messages');const change=async(m,status)=>{try{await api(`/ops/contact-messages/${m.id}/status`,{method:'POST',body:{status,reason:'Public enquiry reviewed'}});reload();showToast?.({title:'Enquiry status updated',message:status});}catch(e){showToast?.({type:'error',message:e.message});}};return <><PageTitle eyebrow="Public website" title="Contact enquiries" description="Messages submitted through the public contact form." action={<Button variant="outline" onClick={reload} icon="refresh">Refresh</Button>}/>{loading?<Loading/>:error?<p className="text-sm text-rose-600">{error}</p>:!data?.messages?.length?<Empty icon="mail" title="No public enquiries"/>:<div className="space-y-3">{data.messages.map(m=><Card key={m.id} padding="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-ink">{m.name} <span className="ml-1 text-xs font-normal text-slate-400">{m.email} · {m.phone}</span></p><p className="mt-1 text-[10px] uppercase tracking-widest text-brand-700">{m.category}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">{m.message}</p><p className="mt-2 text-[9px] text-slate-400">{date(m.created_at)}</p></div><div className="flex items-center gap-2"><Badge status={m.status}/><Select className="w-auto py-2 text-xs" value={m.status} onChange={e=>change(m,e.target.value)}>{['new','contacted','resolved','spam'].map(s=><option key={s}>{s}</option>)}</Select></div></div></Card>)}</div>}</>}

function normalizePermissionSet(keys=[]){
 return normalizePermissionKeys(keys.filter(key=>key!=='admin.manage'));
}

export function AdminTeam({showToast,user}){
 const {data,loading,error,reload}=useApiData('/ops/admin-users');
 const {data:roleData,loading:rolesLoading,error:rolesError,reload:reloadRoles}=useApiData('/ops/admin-roles');
 const [busy,setBusy]=useState(''),[message,setMessage]=useState(''),[roleDrafts,setRoleDrafts]=useState({});
 const [permissionRole,setPermissionRole]=useState('ops_officer'),[permissionKeys,setPermissionKeys]=useState([]),[permissionError,setPermissionError]=useState('');
 const editableRoles=(roleData?.roles||[]).filter(role=>role.id!=='super_admin');
 const selectedRole=editableRoles.find(role=>role.id===permissionRole)||editableRoles[0];
 const selectedSignature=(selectedRole?.permissions||[]).join('|');
 useEffect(()=>{if(selectedRole){setPermissionRole(selectedRole.id);setPermissionKeys(normalizePermissionSet(selectedRole.permissions));}},[selectedRole?.id,selectedSignature]);
 const createInvite=async event=>{
  event.preventDefault();setMessage('');setBusy('invite');
  const form=event.currentTarget,body=Object.fromEntries(new FormData(form));
  try{
   const result=await api('/ops/admin-users',{method:'POST',body});
   form.reset();setMessage(result.emailSent===false?result.message:`Invitation sent to ${result.email}.`);
   showToast?.({title:result.emailSent===false?'Invitation saved':'Administrator invited',message:result.message});
   reload();
  }catch(err){setMessage(err.message||'The invitation could not be sent.');}
  finally{setBusy('');}
 };
 const resend=async invite=>{
  setBusy(`resend:${invite.id}`);
  try{const result=await api(`/ops/admin-invitations/${invite.id}/resend`,{method:'POST'});showToast?.({title:'Invitation resent',message:result.message});reload();}
  catch(err){showToast?.({type:'error',message:err.message});}
  finally{setBusy('');}
 };
 const saveRole=async admin=>{
  const nextRole=roleDrafts[admin.id]||admin.role;
  if(nextRole===admin.role)return;
  setBusy(`role:${admin.id}`);
  try{const result=await api(`/ops/admin-users/${admin.id}/role`,{method:'PATCH',body:{role:nextRole}});showToast?.({title:'Administrator position updated',message:result.roleLabel||roleLabel(nextRole)});reload();}
  catch(err){showToast?.({type:'error',message:err.message});}
  finally{setBusy('');}
 };
 const changePermission=(key,checked)=>{
  if(key==='admin.manage')return;
  setPermissionKeys(previous=>checked?normalizePermissionSet([...previous,key]):removePermissionAndDependents(previous,key));
 };
 const savePermissions=async event=>{
  event.preventDefault();if(!selectedRole)return;
  setBusy('permissions');setPermissionError('');
  try{
   await api(`/ops/admin-roles/${selectedRole.id}/permissions`,{method:'PUT',body:{permissionKeys:normalizePermissionSet(permissionKeys)}});
   showToast?.({title:'Position permissions saved',message:`Access updated for ${roleLabel(selectedRole.id)}.`});
   reloadRoles();
  }catch(err){setPermissionError(err.message||'Permission changes could not be saved.');}
  finally{setBusy('');}
 };
 const savedPermissions=normalizePermissionSet(selectedRole?.permissions||[]);
 const permissionDirty=JSON.stringify(normalizePermissionSet(permissionKeys))!==JSON.stringify(savedPermissions);
 const permissionOptions=(roleData?.permissions||[]).filter(permission=>permission.key!=='admin.manage');
 return <><PageTitle eyebrow="Restricted administration" title="Admin team & access" description="Invite administrators by name, email and position; then tune each position’s least-privilege permissions."/>
  <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
   <Card><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="mail"/></span><div><h2 className="text-sm font-bold text-ink">Invite an administrator</h2><p className="mt-1 text-[10px] leading-5 text-slate-500">They will receive a one-time link to create a password only they know. No initial password is shared.</p></div></div>
    <form onSubmit={createInvite} className="mt-5 space-y-3"><Field label="Full name" required><Input name="fullName" minLength={2} maxLength={100} autoComplete="name" required placeholder="Administrator’s name"/></Field><Field label="Email address" required><Input name="email" type="email" maxLength={180} autoComplete="email" required placeholder="name@company.com"/></Field><Field label="Administrative position" hint="The assigned position determines the starting permission set." required><Select name="role" defaultValue="ops_officer" required>{ADMIN_ROLE_IDS.map(role=><option key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</option>)}</Select></Field>{message&&<p role="status" className="rounded-xl bg-brand-50 p-3 text-xs leading-5 text-brand-800">{message}</p>}<Button type="submit" loading={busy==='invite'} icon="mail">Send secure invitation</Button></form>
   </Card>
   <Card><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-ink">Pending invitations</h2><p className="mt-1 text-[10px] text-slate-400">Invitation links expire after one hour and can be safely resent.</p></div><Button variant="ghost" size="sm" icon="refresh" onClick={reload}>Refresh</Button></div>
    {loading?<Loading/>:error?<p className="mt-4 text-xs text-rose-600">{error}</p>:!data?.invitations?.length?<Empty compact icon="mail" title="No pending invitations" description="Invitations that have not been accepted will appear here."/>:<div className="mt-4 space-y-2">{data.invitations.map(invite=>{
     const expired=invite.expires_at&&new Date(invite.expires_at).getTime()<=Date.now();
     return <div key={invite.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-bold text-ink">{invite.full_name}</p><Badge status={expired?'expired':invite.status}/></div><p className="mt-1 break-all text-[10px] text-slate-500">{invite.email} · {roleLabel(invite.role)}</p><p className="mt-1 text-[9px] text-slate-400">{expired?'Link expired':`Expires ${auditTime(invite.expires_at)}`}{invite.last_sent_at?` · Sent ${auditTime(invite.last_sent_at)}`:''}</p></div><Button size="sm" variant="outline" loading={busy===`resend:${invite.id}`} onClick={()=>resend(invite)}>Resend invitation</Button></div>;
    })}</div>}
   </Card>
  </div>
  <Card className="mt-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-sm font-bold text-ink">Administrator accounts</h2><p className="mt-1 text-[10px] text-slate-400">Position changes immediately revoke the administrator’s existing sessions.</p></div><Button variant="ghost" size="sm" icon="refresh" onClick={reload}>Refresh</Button></div>
   {loading?<Loading/>:error?<p className="mt-4 text-xs text-rose-600">{error}</p>:!data?.admins?.length?<Empty compact icon="users" title="No administrator accounts"/>:<div className="mt-4 space-y-2">{data.admins.map(admin=>{
    const nextRole=roleDrafts[admin.id]||admin.role,ownAccount=admin.id===user?.id;
    return <div key={admin.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold text-ink">{admin.full_name||'DigiTrans administrator'}{ownAccount?' · You':''}</p><Badge status={admin.status}/></div><p className="mt-1 break-all text-[10px] text-slate-500">{admin.email}</p><p className="mt-1 text-[9px] text-slate-400">{admin.role_label||roleLabel(admin.role)} · Joined {date(admin.created_at)}</p></div><div className="flex items-center gap-2"><Select className="min-w-[190px]" value={nextRole} disabled={ownAccount} onChange={event=>setRoleDrafts({...roleDrafts,[admin.id]:event.target.value})}>{ADMIN_ROLE_IDS.map(role=><option key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</option>)}</Select>{!ownAccount&&nextRole!==admin.role&&<Button size="sm" loading={busy===`role:${admin.id}`} onClick={()=>saveRole(admin)}>Save</Button>}</div></div>;
   })}</div>}
  </Card>
  <Card className="mt-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-brand-700">Role-based access control</p><h2 className="mt-1 text-sm font-bold text-ink">Position permission matrix</h2><p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-500">Permissions are checked by the API on every request. Super Administrator controls remain fixed and cannot be delegated.</p></div><div className="w-full sm:max-w-xs"><Field label="Position to configure"><Select value={selectedRole?.id||permissionRole} disabled={!editableRoles.length} onChange={event=>{setPermissionRole(event.target.value);setPermissionError('');}}>{editableRoles.map(role=><option key={role.id} value={role.id}>{ADMIN_ROLE_LABELS[role.id]||role.description||role.name}</option>)}</Select></Field></div></div>
   {rolesLoading?<Loading/>:rolesError?<p className="mt-4 text-xs text-rose-600">{rolesError}</p>:!selectedRole?<Empty compact icon="shield" title="No editable administrative positions"/>:<form onSubmit={savePermissions} className="mt-5"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{permissionOptions.map(permission=>{
     const checked=permissionKeys.includes(permission.key),dependencies=PERMISSION_DEPENDENCIES[permission.key]||[];
     return <label key={permission.key} className={`flex items-start gap-3 rounded-xl border p-3 transition ${checked?'border-brand-200 bg-brand-50/60':'border-slate-200 bg-white hover:bg-slate-50'}`}><input type="checkbox" className="mt-1 accent-[#214c32]" checked={checked} onChange={event=>changePermission(permission.key,event.target.checked)}/><span className="min-w-0"><span className="block text-xs font-semibold text-ink">{permission.description||permission.key}</span><span className="mt-1 block break-all font-mono text-[9px] text-slate-400">{permission.key}</span>{dependencies.length>0&&<span className="mt-1 block text-[9px] text-slate-500">Also requires {dependencies.join(', ')}.</span>}</span></label>;
    })}</div><div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] leading-5 text-slate-500">Admin and permission management are Super Administrator-only. Changes take effect on the next API request.</p><Button type="submit" loading={busy==='permissions'} disabled={!permissionDirty}>Save position permissions</Button></div>{permissionError&&<p role="alert" className="mt-3 text-xs text-rose-600">{permissionError}</p>}</form>}
  </Card>
 </>;
}

export function OpsSupport({showToast,navigate,locationSearch=''}){
 const queryParams=new URLSearchParams(locationSearch);
 const queryTicket=queryParams.get('ticket')||queryParams.get('focus')||'';
 const [statusFilter,setStatusFilter]=useState(''),[search,setSearch]=useState('');
 const path=useMemo(()=>{
  const p=new URLSearchParams();
  if(statusFilter)p.set('status',statusFilter);
  if(search.trim())p.set('search',search.trim());
  const q=p.toString();
  return q?`/support?${q}`:'/support';
 },[statusFilter,search]);
 const {data,loading,error,reload}=useApiData(path);const [selected,setSelected]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const handledTicket=useRef('');
 const open=async t=>{try{const d=await api(`/support/${t.id}`);setSelected({...d.ticket,messages:d.messages});}catch(e){showToast?.({type:'error',message:e.message});}};
 useEffect(()=>{
  if(!queryTicket){handledTicket.current='';return;}
  if(handledTicket.current===queryTicket)return;
  handledTicket.current=queryTicket;
  focusRecordElement(queryTicket);
  api(`/support/${encodeURIComponent(queryTicket)}`).then(d=>setSelected({...d.ticket,messages:d.messages})).catch(()=>{});
 },[queryTicket]);
 const reply=async e=>{e.preventDefault();setBusy(true);try{await api(`/support/${selected.id}/messages`,{method:'POST',body:{message,internal:false}});setMessage('');open(selected);reload();}catch(e){showToast?.({type:'error',message:e.message});}finally{setBusy(false);}};
 const change=async(t,status)=>{try{await api(`/support/${t.id}/status`,{method:'POST',body:{status}});reload();showToast?.({title:'Support status updated',message:statusLabel(status)});}catch(e){showToast?.({type:'error',message:e.message});}};
 return <><PageTitle eyebrow="Customer care" title="Support requests" description="Review incoming tickets, keep internal notes private and send customer-visible replies." action={<Button variant="outline" icon="refresh" onClick={reload}>Refresh</Button>}/>
  <Card padding="p-4" className="mb-4"><div className="grid gap-3 sm:grid-cols-[1fr_200px]"><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ticket reference, requester, related ID…"/><Select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option>{['open','assigned','in_progress','awaiting_user','resolved','closed'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></div></Card>
  {loading?<Loading/>:error?<p className="text-sm text-rose-600">{error}</p>:!data?.tickets?.length?<Empty icon="support" title="No support requests"/>:<div className="space-y-3">{data.tickets.map(t=><Card key={t.id} data-record-id={t.id} padding="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-ink">{t.reference} · {t.requester_name}</p><p className="mt-1 text-xs text-slate-500">{t.description}</p>{t.related_context&&<p className="mt-1.5 text-[11px] font-semibold text-brand-700">Linked {statusLabel(t.related_context.type)}: {t.related_context.reference} · {t.related_context.summary}</p>}<p className="mt-1 text-[9px] text-slate-400">{t.category} · {date(t.created_at)}</p></div><div className="flex flex-wrap items-center gap-2"><Badge status={t.status}/>{t.related_context?.href&&navigate&&<Button size="sm" variant="ghost" onClick={()=>navigate(t.related_context.href)}>Open record</Button>}<Button size="sm" variant="outline" onClick={()=>open(t)}>Open</Button><Select className="w-auto py-2 text-xs" value={t.status} onChange={e=>change(t,e.target.value)}>{['open','assigned','in_progress','awaiting_user','resolved','closed'].map(s=><option key={s}>{s}</option>)}</Select></div></div></Card>)}</div>}{selected&&<Modal title={selected.reference} description={selected.requester_name||'Support conversation'} onClose={()=>setSelected(null)}>{selected.related_context&&<div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-xs"><div><p className="font-bold text-brand-900">Linked {statusLabel(selected.related_context.type)} · {selected.related_context.reference}</p><p className="mt-0.5 text-[11px] text-slate-600">{selected.related_context.summary}</p></div>{selected.related_context.href&&navigate&&<Button size="sm" variant="outline" onClick={()=>{const href=selected.related_context.href;setSelected(null);navigate(href);}}>Open record</Button>}</div>}<div className="max-h-64 space-y-2 overflow-auto">{selected.messages?.map(m=><div key={m.id} className={`rounded-xl p-3 text-xs ${m.is_internal?'bg-amber-50 text-amber-900':'bg-slate-50 text-slate-600'}`}><p>{m.message}</p>{m.is_internal&&<Badge status="internal note"/>}</div>)}</div><form onSubmit={reply} className="mt-4 space-y-3"><Field label="Customer-visible reply"><Textarea value={message} onChange={e=>setMessage(e.target.value)} required/></Field><Button type="submit" loading={busy} className="w-full">Send reply</Button></form><InternalNote ticket={selected} onSaved={()=>open(selected)} showToast={showToast}/></Modal>}</>}
function InternalNote({ticket,onSaved,showToast}){const [note,setNote]=useState('');const submit=async e=>{e.preventDefault();try{await api(`/support/${ticket.id}/messages`,{method:'POST',body:{message:note,internal:true}});setNote('');onSaved();showToast?.({title:'Internal note added'});}catch(e){showToast?.({type:'error',message:e.message});}};return <form onSubmit={submit} className="mt-4 border-t border-slate-100 pt-4"><Field label="Internal note (not visible to requester)"><Textarea value={note} onChange={e=>setNote(e.target.value)} required placeholder="Add an internal note…"/></Field><Button type="submit" variant="outline" size="sm" className="mt-2">Add internal note</Button></form>}
