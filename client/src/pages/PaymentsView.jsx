import React,{useEffect,useMemo,useState} from 'react';
import {api,date,money,statusLabel} from '../lib/api';
import {useApiData} from '../lib/hooks';
import {downloadCsv} from '../lib/csv';
import {focusRecordElement} from '../lib/focus-record';
import {workspacePath} from '../../../shared/workspace-links.js';
import {Badge,Button,Card,Empty,Field,Input,Loading,PageTitle,Select} from '../components/UI';

const columns=[
 {key:'reference',label:'Payment reference'},
 {key:'amount',label:'Amount (NGN)'},
 {key:'provider',label:'Provider'},
 {key:'status',label:'Status'},
 {key:'created_at',label:'Created at'},
 {key:'updated_at',label:'Last updated'},
];

export default function PaymentsView({user,navigate,locationSearch=''}){
 const queryFocus=new URLSearchParams(locationSearch).get('focus')||'';
 const [focusId,setFocusId]=useState(queryFocus),[draft,setDraft]=useState({search:'',status:'',from:'',to:''}),[filters,setFilters]=useState({}),[page,setPage]=useState(1),[exporting,setExporting]=useState(false),[exportError,setExportError]=useState('');
 useEffect(()=>{
  setFocusId(queryFocus);
  if(queryFocus)setPage(1);
 },[queryFocus]);
 const params=new URLSearchParams({page:String(page),limit:'50'});
 for(const [key,value] of Object.entries(filters))if(value)params.set(key,value);
 if(focusId)params.set('focus',focusId);
 const path=useMemo(()=>`/payments?${params.toString()}`,[params.toString()]);
 const {data,loading,error}=useApiData(path);
 const rows=data?.payments||[],pages=Number(data?.pages||0),total=Number(data?.total||0);
 useEffect(()=>{
  if(!focusId||loading||!data)return;
  if(rows.some(row=>row.id===focusId))focusRecordElement(focusId);
 },[focusId,loading,data,rows]);
 const clearFocus=()=>{
  setFocusId('');
  navigate(workspacePath(user.role,'payments'),{replace:true});
 };
 const apply=event=>{
  event.preventDefault();
  if(draft.from&&draft.to&&draft.from>draft.to)return;
  setPage(1);
  if(focusId)clearFocus();
  setFilters(Object.fromEntries(Object.entries(draft).filter(([,value])=>value)));
 };
 const clear=()=>{
  setDraft({search:'',status:'',from:'',to:''});
  setFilters({});setPage(1);setExportError('');
  if(focusId)clearFocus();
 };
 const exportAll=async()=>{
  setExporting(true);setExportError('');
  try{
   const exportParams=new URLSearchParams({page:'1',limit:'100'});
   for(const [key,value] of Object.entries(filters))if(value)exportParams.set(key,value);
   if(focusId)exportParams.set('focus',focusId);
   let result=await api(`/payments?${exportParams.toString()}`),all=[...(result.payments||[])];
   const maxPages=Math.min(Number(result.pages||1),100);
   for(let next=2;next<=maxPages;next++){
    exportParams.set('page',String(next));
    const pageData=await api(`/payments?${exportParams.toString()}`);
    all.push(...(pageData.payments||[]));
   }
   if(Number(result.pages||1)>maxPages)throw new Error('This export is larger than 10,000 records. Narrow the date range before exporting.');
   downloadCsv('digitrans-payments.csv',all,columns);
  }catch(err){setExportError(err.message||'The CSV export could not be created.');}
  finally{setExporting(false);}
 };
 const invalidRange=draft.from&&draft.to&&draft.from>draft.to;
 return <><PageTitle eyebrow="Account activity" title="Payments" description={user.role==='finance_officer'||user.role==='super_admin'?'Filter and export payment records available to your finance permissions.':'Review your own payment references and download a copy of your filtered history.'} action={<Button variant="outline" icon="download" loading={exporting} disabled={loading||!rows.length||exporting} onClick={exportAll}>Download CSV</Button>}/>
  {focusId&&<Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-brand-200 bg-brand-50/70"><p className="text-xs font-semibold text-brand-900">Showing focused payment record <span className="font-mono">{focusId}</span>.</p><Button size="sm" variant="outline" onClick={clearFocus}>Show all payments</Button></Card>}
  <Card className="mb-4"><form onSubmit={apply} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="Reference search"><Input value={draft.search} onChange={event=>setDraft({...draft,search:event.target.value})} placeholder="Payment reference"/></Field><Field label="Status"><Select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value})}><option value="">All statuses</option>{['pending','initiated','successful','under_review','failed','cancelled','reversed','refunded'].map(value=><option key={value} value={value}>{statusLabel(value)}</option>)}</Select></Field><Field label="From date"><Input type="date" value={draft.from} onChange={event=>setDraft({...draft,from:event.target.value})}/></Field><Field label="To date"><Input type="date" value={draft.to} onChange={event=>setDraft({...draft,to:event.target.value})}/></Field></div>{invalidRange&&<p className="text-xs text-rose-600">The start date must be on or before the end date.</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={clear}>Clear</Button><Button type="submit" disabled={!!invalidRange}>Apply filters</Button></div></form></Card>
  {exportError&&<Card className="mb-4 border-rose-200 bg-rose-50"><p className="text-xs text-rose-700">{exportError}</p></Card>}
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">{loading?'Loading payments…':`${Number(data?.countOnPage??rows.length).toLocaleString()} shown · ${total.toLocaleString()} matching`}</p>{pages>1&&<p className="text-[10px] text-slate-400">Page {data?.page||page} of {pages}</p>}</div>
  {loading?<Loading/>:error?<Card><p className="text-sm text-rose-600">{error}</p></Card>:!rows.length?<Empty icon="wallet" title="No payments found" description="Try a wider date range or another status."/>:<Card padding="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-400"><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3 text-right">Help</th></tr></thead><tbody>{rows.map(payment=><tr key={payment.id} data-record-id={payment.id} className="border-b border-slate-50 text-xs"><td className="px-4 py-3 font-bold text-ink">{payment.reference}</td><td className="px-4 py-3 font-semibold">{money(payment.amount)}</td><td className="px-4 py-3 text-slate-500">{statusLabel(payment.provider||'')}</td><td className="px-4 py-3"><Badge status={payment.status}/></td><td className="px-4 py-3 text-slate-500">{date(payment.created_at,{hour:'numeric',minute:'2-digit'})}</td><td className="px-4 py-3 text-slate-500">{date(payment.updated_at,{hour:'numeric',minute:'2-digit'})}</td><td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" icon="support" onClick={()=>navigate(workspacePath(user.role,'support',{relatedId:payment.reference||payment.id,category:'payments'}))}>Get help</Button></td></tr>)}</tbody></table></div></Card>}
  {!loading&&!error&&pages>1&&<div className="mt-4 flex items-center justify-between gap-3"><Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(value=>Math.max(1,value-1))}>Previous</Button><span className="text-[10px] text-slate-400">Page {page} of {pages}</span><Button size="sm" variant="outline" disabled={page>=pages} onClick={()=>setPage(value=>Math.min(pages,value+1))}>Next</Button></div>}
 </>;
}
