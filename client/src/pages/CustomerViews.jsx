import React,{useEffect,useMemo,useRef,useState} from 'react';
import {api,money,date,statusLabel,startCheckout,mediaUrl,upload} from '../lib/api';
import {trackEvent} from '../lib/analytics';
import {useApiData} from '../lib/hooks';
import {downloadCsv} from '../lib/csv';
import {focusRecordElement} from '../lib/focus-record';
import {workspacePath} from '../../../shared/workspace-links.js';
import Icon from '../components/Icon';
import {Badge,Button,Card,Empty,Field,Input,Modal,PageTitle,Select,Textarea,Loading} from '../components/UI';

const deliveryColumns=[
 {key:'reference',label:'Reference'},
 {key:'status',label:'Status'},
 {key:'timing',label:'Timing'},
 {key:'channel',label:'Channel'},
 {key:'pickup_address',label:'Pickup address'},
 {key:'dropoff_address',label:'Drop-off address'},
 {key:'recipient_name',label:'Recipient'},
 {key:'fee',label:'Fare (NGN)'},
 {key:'payment_status',label:'Payment status'},
 {key:'created_at',label:'Created at'},
];

const marketRunColumns=[
 {key:'reference',label:'Reference'},
 {key:'status',label:'Status'},
 {key:'contact_name',label:'Contact'},
 {key:'delivery_location',label:'Delivery location'},
 {key:'budget_estimate',label:'Budget guide (NGN)'},
 {key:'final_total',label:'Final estimate (NGN)'},
 {key:'payment_status',label:'Payment status'},
 {key:'created_at',label:'Created at'},
];

const waybillColumns=[
 {key:'reference',label:'Reference'},
 {key:'waybill_number',label:'Waybill number'},
 {key:'status',label:'Status'},
 {key:'origin',label:'Origin'},
 {key:'destination_city',label:'Destination'},
 {key:'sender_name',label:'Sender'},
 {key:'recipient_name',label:'Recipient'},
 {key:'weight',label:'Weight (kg)'},
 {key:'fee',label:'Fee (NGN)'},
 {key:'payment_status',label:'Payment status'},
 {key:'created_at',label:'Created at'},
];

export function BookingForm({user,admin=false,navigate,showToast,locationSearch=''}){
 const rebookId=new URLSearchParams(locationSearch).get('rebook')||'';
 const [zones,setZones]=useState([]),[zone,setZone]=useState('Calabar Municipal'),[quote,setQuote]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState(null),[channel,setChannel]=useState('phone');
 const [rebookPrefill,setRebookPrefill]=useState(null),[rebookLoading,setRebookLoading]=useState(false),[rebookError,setRebookError]=useState('');
 useEffect(()=>{api('/zones').then(d=>{setZones(d.zones||[]);if(d.zones?.length&&!d.zones.some(z=>z.name==='Calabar Municipal'))setZone(d.zones[0].name);}).catch(()=>{});},[]);
 useEffect(()=>{
  if(!rebookId){setRebookPrefill(null);setRebookError('');return;}
  let active=true;setRebookLoading(true);setRebookError('');setQuote(null);setResult(null);
  api(`/deliveries/${encodeURIComponent(rebookId)}`).then(d=>{
   if(!active)return;
   const item=d.delivery;
   setRebookPrefill(item||null);
   if(item?.zone)setZone(item.zone);
   if(admin&&item?.channel&&['phone','whatsapp','walk_in','manual'].includes(item.channel))setChannel(item.channel);
  }).catch(err=>{if(active)setRebookError(err.message||'Could not load the previous booking.');}).finally(()=>{if(active)setRebookLoading(false);});
  return()=>{active=false;};
 },[rebookId,admin]);
 const quoteRequest=async values=>{
  const body={pickupAddress:values.pickupAddress,dropoffAddress:values.dropoffAddress,zone,timing:values.timing,prohibitedAccepted:values.prohibitedAccepted==='on'};
  if(values.pickupLat)body.pickupLat=Number(values.pickupLat);if(values.pickupLng)body.pickupLng=Number(values.pickupLng);if(values.dropoffLat)body.dropoffLat=Number(values.dropoffLat);if(values.dropoffLng)body.dropoffLng=Number(values.dropoffLng);
  return api('/pricing/quote',{method:'POST',body});
 };
 const submit=async e=>{
  e.preventDefault();setBusy(true);setError('');const form=e.currentTarget,data=new FormData(form),values=Object.fromEntries(data);values.prohibitedAccepted=data.get('prohibitedAccepted')==='on';
  try{
   if(!quote){const q=await quoteRequest(values);setQuote(q);setBusy(false);return;}
   const body={pickupAddress:values.pickupAddress,dropoffAddress:values.dropoffAddress,zone,timing:values.timing,scheduledAt:values.timing==='scheduled'&&values.scheduledAt?new Date(values.scheduledAt).toISOString():null,recipientName:values.recipientName,recipientPhone:values.recipientPhone,packageCategory:values.packageCategory,packageDescription:values.packageDescription,declaredValue:Number(values.declaredValue||0),deliveryMethod:values.deliveryMethod,instructions:values.instructions,prohibitedAccepted:true};
   if(admin){body.customerName=values.customerName;body.customerPhone=values.customerPhone;body.channel=channel;}
   const out=await api(admin?'/ops/bookings':'/deliveries',{method:'POST',body});setResult(out);trackEvent('booking_completed',{channel:admin?'ops':'web',zone,timing:values.timing});showToast?.({title:'Booking created',message:`Reference ${out.reference} · ${money(out.fee)}`});
   form.reset();setQuote(null);setRebookPrefill(null);
  }catch(err){setError(err.message);if(err.status===409||err.status===400)setQuote(null);}finally{setBusy(false);}
 };
 const clearRebook=()=>{
  setRebookPrefill(null);setRebookError('');setQuote(null);
  navigate(admin?'/ops/booking':workspacePath(user.role,'booking'),{replace:true});
 };
 const onChange=()=>{if(quote)setQuote(null);if(result)setResult(null);};
 const queuePath=admin?'/ops/deliveries':workspacePath(user.role,'history');
 if(result)return <><PageTitle eyebrow={admin?'Operations · manual booking':'Local delivery'} title="Your delivery is in motion." description="The request is saved to the DigiTrans delivery queue."/><Card className="max-w-2xl border-brand-200 bg-brand-50/50"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-brand-600">Delivery reference</p><p className="mt-1 text-2xl font-extrabold tracking-tight text-brand-950">{result.reference}</p><p className="mt-2 text-xs text-slate-500">Keep this reference to track the request.</p></div><div className="rounded-xl border border-brand-100 bg-white px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Server-calculated fare</p><p className="mt-1 text-xl font-bold text-ink">{money(result.fee)}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Button onClick={()=>navigate(queuePath)}>View delivery queue</Button><Button variant="outline" onClick={()=>setResult(null)}>Create another booking</Button></div></Card></>;
 const minTime=new Date(Date.now()+2*60*60*1000);minTime.setMinutes(Math.ceil(minTime.getMinutes()/15)*15,0,0);const minLocal=new Date(minTime-minTime.getTimezoneOffset()*60000).toISOString().slice(0,16);
 const p=rebookPrefill||{};
 return <><PageTitle eyebrow={admin?'Operations · offline channel':'Local delivery'} title={admin?'Create a manual booking':'Book a delivery'} description={admin?'Record a booking received by phone, WhatsApp or walk-in. Pricing and reference generation use the same server rules.':'Tell us what is moving, where it is going and when you need it there.'}/>
  {rebookLoading&&<Card className="mb-4 max-w-5xl"><p className="text-xs text-slate-500">Loading details from previous booking…</p></Card>}
  {rebookError&&<Card className="mb-4 max-w-5xl border-rose-200 bg-rose-50"><p className="text-xs text-rose-700">{rebookError}</p></Card>}
  {rebookPrefill&&<Card className="mb-4 flex max-w-5xl flex-wrap items-center justify-between gap-3 border-brand-200 bg-brand-50/70"><div><p className="text-xs font-bold text-brand-900">Rebooking from {rebookPrefill.reference}</p><p className="mt-0.5 text-[11px] text-slate-600">Route, recipient and parcel details are prefilled. Confirm timing, item safety and get a fresh fare quote.</p></div><Button size="sm" variant="outline" onClick={clearRebook}>Start blank</Button></Card>}
  <div className="grid max-w-5xl gap-6 xl:grid-cols-[1fr_310px]"><Card><form key={rebookPrefill?`rebook:${rebookPrefill.id}`:'fresh'} onSubmit={submit} onChange={onChange} className="space-y-5">
  {admin&&<div className="grid gap-4 sm:grid-cols-3"><Field label="Customer name" required><Input name="customerName" required defaultValue={p.manual_customer_name||''} placeholder="Full name"/></Field><Field label="Customer phone" required><Input name="customerPhone" required type="tel" defaultValue={p.manual_customer_phone||''} placeholder="+234…"/></Field><Field label="Booking channel"><Select value={channel} onChange={e=>setChannel(e.target.value)}><option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option><option value="walk_in">Walk-in</option><option value="manual">Other manual</option></Select></Field></div>}
  <div><p className="mb-3 text-xs font-bold uppercase tracking-[.13em] text-brand-700">01 · The route</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Pickup address" required><Input name="pickupAddress" required minLength={4} defaultValue={p.pickup_address||''} placeholder="Street, landmark, area"/></Field><Field label="Destination address" required><Input name="dropoffAddress" required minLength={4} defaultValue={p.dropoff_address||''} placeholder="Street, landmark, area"/></Field><Field label="Service area" required><Select value={zone} onChange={e=>{setZone(e.target.value);setQuote(null);}}>{zones.length?zones.map(z=><option key={z.id} value={z.name}>{z.name}</option>):<option>Calabar Municipal</option>}</Select></Field><Field label="Delivery timing"><Select name="timing" defaultValue="now"><option value="now">Send now</option><option value="scheduled">Schedule delivery</option></Select></Field></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Scheduled date & time" hint="Choose a time at least 2 hours from now and within the next 7 days." className="schedule-field"><Input name="scheduledAt" type="datetime-local" min={minLocal}/></Field><Field label="Delivery method"><Select name="deliveryMethod" defaultValue={p.delivery_method||'motorcycle'}><option value="bicycle">Bicycle</option><option value="electric_bicycle">Electric bicycle</option><option value="motorcycle">Motorcycle</option><option value="partner">Approved partner</option></Select></Field></div></div>
  <div><p className="mb-3 text-xs font-bold uppercase tracking-[.13em] text-brand-700">02 · The parcel</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Recipient name" required><Input name="recipientName" required defaultValue={p.recipient_name||''} placeholder="Who will receive it?"/></Field><Field label="Recipient phone" required><Input name="recipientPhone" required type="tel" defaultValue={p.recipient_phone||''} placeholder="+234…"/></Field><Field label="Package category"><Select name="packageCategory" defaultValue={p.package_category||'Documents'}><option>Documents</option><option>Clothing</option><option>Groceries</option><option>Food</option><option>Electronics</option><option>Household items</option><option>Other approved item</option></Select></Field><Field label="Declared value (₦)" hint="Required for selected package types."><Input name="declaredValue" type="number" min="0" step="100" defaultValue={p.declared_value??''} placeholder="0"/></Field><Field label="Package description" required className="sm:col-span-2"><Textarea name="packageDescription" required maxLength={500} defaultValue={p.package_desc||''} placeholder="Describe the item and how it is packed…" className="min-h-[78px]"/></Field><Field label="Delivery instructions" className="sm:col-span-2"><Textarea name="instructions" maxLength={500} defaultValue={p.instructions||''} placeholder="Gate instructions, landmark or other useful detail…" className="min-h-[72px]"/></Field></div></div>
  <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-5 text-slate-600"><input name="prohibitedAccepted" type="checkbox" required className="mt-1 accent-[#214c32]"/><span>I confirm this parcel is permitted, safely packed and does not contain a prohibited or restricted item.</span></label>
  {error&&<p className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
  <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-[10px] leading-5 text-slate-400">Fare estimates use configured service rules. The backend recalculates the final fare when the booking is submitted.</p><Button type="submit" size="lg" loading={busy} icon={quote?'check':'search'}>{quote?`Confirm booking · ${money(quote.fee)}`:'Get server-calculated fare'}</Button></div>
 </form></Card><div className="space-y-4"><Card className="bg-brand-950 text-white"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-gold-300"><Icon name="shield" size={20}/></span><h3 className="mt-4 text-sm font-bold">A fare you can review.</h3><p className="mt-2 text-xs leading-5 text-white/60">Your price is calculated from the active Calabar pricing version - not a browser estimate. Route distance may be an estimate until a mapping provider is configured.</p></Card>{quote&&<Card className="border-brand-200"><p className="text-[10px] font-bold uppercase tracking-widest text-brand-700">Fare preview · {quote.breakdown?.pricing_version}</p><div className="mt-3 space-y-2">{[['Base fare',quote.breakdown?.base_fee],['Distance estimate',`${quote.breakdown?.distance_km} km`],['Distance charge',quote.breakdown?.distance_charge],['Surcharges',quote.breakdown?.surcharges],['Minimum fare',quote.breakdown?.min_fee]].filter(([,v])=>v!==undefined).map(([l,v])=><div key={l} className="flex justify-between gap-3 text-xs"><span className="text-slate-500">{l}</span><span className="font-semibold text-ink">{typeof v==='number'?money(v):v}</span></div>)}</div><div className="mt-4 border-t border-slate-100 pt-3"><div className="flex justify-between text-sm font-bold text-ink"><span>Estimated total</span><span>{money(quote.fee)}</span></div></div><p className="mt-3 text-[10px] leading-4 text-slate-400">Final amount is recalculated by the server at confirmation.</p></Card>}<Card><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Need help first?</p><p className="mt-2 text-sm font-bold text-ink">Talk to local support.</p><p className="mt-1 text-xs leading-5 text-slate-500">We can help confirm an address, item category or service area.</p><button onClick={()=>navigate(workspacePath(user.role,'support'))} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-brand-700">Open workspace support <Icon name="arrow" size={14}/></button></Card></div></div></>;
}

function DetailModal({id,onClose,user,navigate,ops=false}){
 const [data,setData]=useState(null),[error,setError]=useState('');
 useEffect(()=>{api(`/deliveries/${id}`).then(d=>setData(d.delivery)).catch(e=>setError(e.message));},[id]);
 return <Modal title="Delivery details" description="Private details are only shown to the account and assigned operations team." onClose={onClose} wide>{!data&&!error?<Loading label="Loading delivery details…"/>:error?<p className="text-sm text-rose-600">{error}</p>:<><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-400">Reference</p><p className="mt-1 text-sm font-bold text-ink">{data.reference}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-400">Fare</p><p className="mt-1 text-sm font-bold text-ink">{money(data.fee)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-400">Status</p><div className="mt-1"><Badge status={data.status}/></div></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pickup</p><p className="mt-2 text-sm font-semibold text-ink">{data.pickup_address}</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Drop-off</p><p className="mt-2 text-sm font-semibold text-ink">{data.dropoff_address}</p></div></div><div className="mt-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status timeline</p><div className="space-y-3">{(data.timeline||[]).map((e,i)=><div key={i} className="flex items-start gap-3"><span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-brand-700"><Icon name={i===data.timeline.length-1?'check':'clock'} size={12}/></span><div className="flex-1"><p className="text-xs font-bold text-ink">{statusLabel(e.new_status)}</p><p className="mt-0.5 text-[10px] text-slate-400">{new Date(e.created_at).toLocaleString('en-NG')}</p></div></div>)}</div></div>{data.proof&&<div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-800">Proof of delivery</p><p className="mt-1 text-xs text-emerald-700">Received by {data.proof.recipient_name} · {new Date(data.proof.created_at).toLocaleString('en-NG')}</p>{data.proof.notes&&<p className="mt-1 text-xs text-slate-500">{data.proof.notes}</p>}{data.proof.id&&<img crossOrigin="use-credentials" className="mt-3 max-h-48 rounded-xl object-cover" src={mediaUrl(`/api/private-files/${data.proof.id}`)} alt="Private proof of delivery"/>}</div>}<div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">{!ops&&['customer','student','vendor'].includes(user.role)&&<Button size="sm" variant="outline" icon="refresh" onClick={()=>{onClose();navigate(workspacePath(user.role,'booking',{rebook:data.id}));}}>Book again</Button>}<Button size="sm" variant="soft" icon="support" onClick={()=>{onClose();navigate(workspacePath(user.role,'support',{relatedId:data.reference||data.id,category:'delivery'}));}}>Get help</Button></div></>}</Modal>
}
function AssignModal({delivery,onClose,done}){
 const {data,loading}=useApiData('/ops/users?role=rider&status=active&limit=100');const [riderId,setRiderId]=useState(''),[reason,setReason]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const riders=(data?.users||[]).filter(r=>r.rider_status==='approved');
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{await api(`/ops/deliveries/${delivery.id}/assign`,{method:'POST',body:{riderId,reason,reassign:!!delivery.hasAssignment}});done();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <Modal title="Assign a rider" description={`Delivery ${delivery.reference}`} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Available approved rider" required><Select required value={riderId} onChange={e=>setRiderId(e.target.value)}><option value="">Choose a rider…</option>{riders.map(r=><option key={r.id} value={r.id}>{r.full_name} · {r.vehicle_type||'vehicle not set'}</option>)}</Select></Field><Field label="Assignment note"><Textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={300} placeholder="Why this rider is a good fit (optional)…"/></Field>{loading&&<p className="text-xs text-slate-400">Loading approved riders…</p>}{!loading&&!riders.length&&<p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">No approved active riders are available. Review rider applications first.</p>}{error&&<p className="text-xs text-rose-600">{error}</p>}<Button type="submit" loading={busy} disabled={!riderId} className="w-full">Assign delivery</Button></form></Modal>
}

export function DeliveryList({user,navigate,showToast,ops=false,locationSearch=''}){
 const focusId=new URLSearchParams(locationSearch).get('focus')||'';
 const [draft,setDraft]=useState({search:'',status:'',timing:'',channel:'',from:'',to:''}),[filters,setFilters]=useState({}),[page,setPage]=useState(1);
 const [selected,setSelected]=useState(null),[assign,setAssign]=useState(null),[cancelBusy,setCancelBusy]=useState(''),[exporting,setExporting]=useState(false),[exportError,setExportError]=useState('');
 const handledFocus=useRef('');
 const params=useMemo(()=>{
  const p=new URLSearchParams({page:String(page),limit:'25'});
  for(const [k,v] of Object.entries(filters))if(v)p.set(k,v);
  return p.toString();
 },[page,filters]);
 const {data,loading,error,reload}=useApiData(`/deliveries?${params}`);
 const rows=data?.deliveries||[],pages=Number(data?.pages||0),total=Number(data?.total||0);
 useEffect(()=>{
  if(!focusId){handledFocus.current='';return;}
  if(loading||!data||handledFocus.current===focusId)return;
  handledFocus.current=focusId;
  if(!focusRecordElement(focusId))setSelected(focusId);
 },[focusId,loading,data,rows]);
 const opsUser=ops,canAssign=user.role==='super_admin'||(user.permissions||[]).includes('deliveries.assign'),canBook=user.role==='super_admin'||(user.permissions||[]).includes('deliveries.create');
 const invalidRange=draft.from&&draft.to&&draft.from>draft.to;
 const apply=e=>{
  e.preventDefault();if(invalidRange)return;
  setPage(1);setFilters(Object.fromEntries(Object.entries(draft).filter(([,v])=>v)));
 };
 const clear=()=>{setDraft({search:'',status:'',timing:'',channel:'',from:'',to:''});setFilters({});setPage(1);setExportError('');};
 const exportAll=async()=>{
  setExporting(true);setExportError('');
  try{
   const p=new URLSearchParams({page:'1',limit:'100'});
   for(const [k,v] of Object.entries(filters))if(v)p.set(k,v);
   const first=await api(`/deliveries?${p.toString()}`),all=[...(first.deliveries||[])];
   const maxPages=Math.min(Number(first.pages||1),100);
   for(let next=2;next<=maxPages;next++){
    p.set('page',String(next));
    const pageData=await api(`/deliveries?${p.toString()}`);
    all.push(...(pageData.deliveries||[]));
   }
   if(Number(first.pages||1)>maxPages)throw new Error('This export is larger than 10,000 records. Narrow the date range before exporting.');
   downloadCsv('digitrans-deliveries.csv',all,deliveryColumns);
  }catch(err){setExportError(err.message||'The CSV export could not be created.');}
  finally{setExporting(false);}
 };
 const cancel=async row=>{if(!window.confirm(`Cancel ${row.reference}?`))return;setCancelBusy(row.id);try{await api(`/deliveries/${row.id}/cancel`,{method:'POST',body:{reason:'Cancelled from DigiTrans workspace'}});showToast?.({title:'Delivery cancelled',message:row.reference});reload();}catch(e){showToast?.({type:'error',message:e.message});}finally{setCancelBusy('');}};
 const pay=async row=>{try{await startCheckout('delivery',row.id);}catch(e){showToast?.({type:'error',message:e.message});}};
 const title=ops?'Delivery operations':user.role==='vendor'?'Business deliveries':'Delivery history';
 return <><PageTitle eyebrow={ops?'Operations queue':'Your activity'} title={title} description={ops?'Review delivery requests, find eligible riders and keep every status transition traceable.':'Search your delivery references, download records or rebook past routes.'} action={<div className="flex flex-wrap gap-2"><Button variant="outline" icon="download" loading={exporting} disabled={loading||!rows.length||exporting} onClick={exportAll}>Download CSV</Button>{ops&&canBook?<Button onClick={()=>navigate('/ops/booking')} icon="plus">Manual booking</Button>:!ops?<Button onClick={()=>navigate(workspacePath(user.role,'booking'))} icon="plus">New delivery</Button>:null}</div>}/>
  <Card padding="p-4 sm:p-5" className="mb-5"><form onSubmit={apply} className="space-y-3"><div className={`grid gap-3 sm:grid-cols-2 ${opsUser?'xl:grid-cols-5':'xl:grid-cols-4'}`}><Field label="Search"><Input value={draft.search} onChange={e=>setDraft({...draft,search:e.target.value})} placeholder="Reference, address, recipient…"/></Field><Field label="Status"><Select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="">All statuses</option>{['pending_confirmation','awaiting_assignment','assigned','rider_accepted','rider_en_route_to_pickup','arrived_at_pickup','package_collected','in_transit','arrived_at_destination','out_for_delivery','delivered','delivery_failed','cancelled','returned'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field><Field label="Timing"><Select value={draft.timing} onChange={e=>setDraft({...draft,timing:e.target.value})}><option value="">All timings</option><option value="now">Instant</option><option value="scheduled">Scheduled</option></Select></Field>{opsUser&&<Field label="Channel"><Select value={draft.channel} onChange={e=>setDraft({...draft,channel:e.target.value})}><option value="">All channels</option>{['web','phone','whatsapp','walk_in','manual'].map(c=><option key={c} value={c}>{statusLabel(c)}</option>)}</Select></Field>}<Field label="From date"><Input type="date" value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></Field><Field label="To date"><Input type="date" value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></Field></div>{invalidRange&&<p className="text-xs text-rose-600">The start date must be on or before the end date.</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={clear}>Clear</Button><Button type="submit" disabled={!!invalidRange}>Apply filters</Button></div></form></Card>
  {exportError&&<Card className="mb-4 border-rose-200 bg-rose-50"><p className="text-xs text-rose-700">{exportError}</p></Card>}
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">{loading?'Loading deliveries…':`${Number(data?.countOnPage??rows.length).toLocaleString()} shown · ${total.toLocaleString()} matching`}</p>{pages>1&&<p className="text-[10px] text-slate-400">Page {data?.page||page} of {pages}</p>}</div>
  {loading?<Loading/>:error?<Card><p className="text-sm text-rose-600">{error}</p></Card>:!rows.length?<Empty icon="truck" title="No deliveries found" description="Try a wider filter or create a new delivery request." action={!ops&&<Button onClick={()=>navigate(workspacePath(user.role,'booking'))}>Book a delivery</Button>}/>:<div className="space-y-3">{rows.map(row=><Card key={row.id} data-record-id={row.id} padding="p-4 sm:p-5" className="transition hover:border-brand-200"><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="box" size={19}/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink">{row.reference}</p><Badge status={row.status}/>{opsUser&&row.channel&&row.channel!=='web'&&<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">{statusLabel(row.channel)}</span>}</div><p className="mt-1 truncate text-xs text-slate-500">{row.pickup_address} <span className="mx-1 text-gold-600">→</span> {row.dropoff_address}</p><p className="mt-1 text-[10px] text-slate-400">{row.recipient_name||row.manual_customer_name||'Recipient'} · {date(row.created_at)}{row.timing==='scheduled'&&row.scheduled_at?` · Scheduled ${new Date(row.scheduled_at).toLocaleString('en-NG')}`:''}</p></div></div><div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0"><div className="text-right"><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Fare</p><p className="text-sm font-bold text-ink">{money(row.fee)}</p></div><div className="flex flex-wrap gap-2">{!opsUser&&['customer','student','vendor'].includes(user.role)&&['pending_confirmation','awaiting_assignment'].includes(row.status)&&row.payment_status!=='successful'&&<Button size="sm" onClick={()=>pay(row)}>{row.payment_status==='initiated'?'Continue payment':'Pay now'}</Button>}<Button size="sm" variant="outline" onClick={()=>setSelected(row.id)}>Details</Button>{!opsUser&&['customer','student','vendor'].includes(user.role)&&<Button size="sm" variant="ghost" icon="refresh" onClick={()=>navigate(workspacePath(user.role,'booking',{rebook:row.id}))}>Book again</Button>}<Button size="sm" variant="ghost" icon="support" onClick={()=>navigate(workspacePath(user.role,'support',{relatedId:row.reference||row.id,category:'delivery'}))}>Get help</Button>{opsUser&&canAssign&&<Button size="sm" variant="soft" onClick={()=>setAssign(row)}>Assign</Button>}{!opsUser&&['pending_confirmation','awaiting_assignment'].includes(row.status)&&<Button size="sm" variant="outline" className="text-rose-600" loading={cancelBusy===row.id} onClick={()=>cancel(row)}>Cancel</Button>}</div></div></div></Card>)}</div>}
  {!loading&&!error&&pages>1&&<div className="mt-4 flex items-center justify-between gap-3"><Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(v=>Math.max(1,v-1))}>Previous</Button><span className="text-[10px] text-slate-400">Page {page} of {pages}</span><Button size="sm" variant="outline" disabled={page>=pages} onClick={()=>setPage(v=>Math.min(pages,v+1))}>Next</Button></div>}
  {selected&&<DetailModal id={selected} user={user} navigate={navigate} ops={opsUser} onClose={()=>setSelected(null)}/>}{assign&&<AssignModal delivery={assign} onClose={()=>setAssign(null)} done={()=>{setAssign(null);reload();showToast?.({title:'Rider assigned',message:`Delivery ${assign.reference} is assigned.`});}}/>}</>;
}

export function MarketRunsView({user,showToast,navigate,locationSearch=''}){
 const ops=user.role==='super_admin'||(user.permissions||[]).includes('market_runs.manage');
 const focusId=new URLSearchParams(locationSearch).get('focus')||'';
 const [draft,setDraft]=useState({search:'',status:'',from:'',to:''}),[filters,setFilters]=useState({}),[page,setPage]=useState(1);
 const path=useMemo(()=>{
  if(!ops)return '/market-runs';
  const p=new URLSearchParams({page:String(page),limit:'50'});
  for(const [k,v] of Object.entries(filters))if(v)p.set(k,v);
  return `/ops/market-runs?${p.toString()}`;
 },[ops,page,filters]);
 const {data,loading,error,reload}=useApiData(path);const [items,setItems]=useState([{name:'',quantity:1,unit:'unit'}]),[busy,setBusy]=useState(false),[formError,setFormError]=useState(''),[estimate,setEstimate]=useState(null),[cost,setCost]=useState({items:0,fee:1500});
 const rows=useMemo(()=>{
  const raw=data?.marketRuns||[];
  if(ops)return raw;
  return raw.filter(m=>{
   if(filters.status&&m.status!==filters.status)return false;
   if(filters.search){const q=filters.search.toLowerCase();if(!`${m.reference||''} ${m.delivery_location||''} ${m.contact_name||''}`.toLowerCase().includes(q))return false;}
   if(filters.from&&String(m.created_at||'').slice(0,10)<filters.from)return false;
   if(filters.to&&String(m.created_at||'').slice(0,10)>filters.to)return false;
   return true;
  });
 },[data?.marketRuns,ops,filters]);
 useEffect(()=>{if(focusId&&!loading&&rows.some(r=>r.id===focusId))focusRecordElement(focusId);},[focusId,loading,rows]);
 const invalidRange=draft.from&&draft.to&&draft.from>draft.to;
 const applyFilters=e=>{e.preventDefault();if(invalidRange)return;setPage(1);setFilters(Object.fromEntries(Object.entries(draft).filter(([,v])=>v)));};
 const clearFilters=()=>{setDraft({search:'',status:'',from:'',to:''});setFilters({});setPage(1);};
 const add=()=>setItems([...items,{name:'',quantity:1,unit:'unit'}]);
 const editItem=(i,key,val)=>setItems(items.map((item,n)=>n===i?{...item,[key]:val}:item));
 const submit=async e=>{e.preventDefault();setBusy(true);setFormError('');const f=new FormData(e.currentTarget);try{const out=await api('/market-runs',{method:'POST',body:{contactName:f.get('contactName'),contactPhone:f.get('contactPhone'),deliveryLocation:f.get('deliveryLocation'),budgetEstimate:Number(f.get('budgetEstimate')||0),serviceDate:f.get('serviceDate'),contactPreference:f.get('contactPreference'),instructions:f.get('instructions'),items}});showToast?.({title:'Market Run submitted',message:`Reference ${out.reference}`});setItems([{name:'',quantity:1,unit:'unit'}]);e.currentTarget.reset();reload();}catch(e){setFormError(e.message);}finally{setBusy(false);}};
 const estimateRun=async run=>{setEstimate(run);setCost({items:run.estimated_items_cost||run.budget_estimate||0,fee:run.service_fee||1500});};
 const saveEstimate=async e=>{e.preventDefault();setBusy(true);try{await api(`/ops/market-runs/${estimate.id}/estimate`,{method:'POST',body:{estimatedItemsCost:Number(cost.items),serviceFee:Number(cost.fee)}});showToast?.({title:'Estimate sent',message:`Customer approval requested for ${estimate.reference}`});setEstimate(null);reload();}catch(e){setFormError(e.message);}finally{setBusy(false);}};
 const customerApprove=async run=>{try{await api(`/market-runs/${run.id}/approve`,{method:'POST',body:{approved:true}});showToast?.({title:'Estimate approved',message:'The procurement team will continue.'});reload();}catch(e){showToast?.({type:'error',message:e.message});}};
 const setStatus=async(run,status)=>{try{await api(`/ops/market-runs/${run.id}/status`,{method:'POST',body:{status,reason:status==='rejected'?'Request did not meet service rules.':'Operations update'}});showToast?.({title:'Market Run updated',message:statusLabel(status)});reload();}catch(e){showToast?.({type:'error',message:e.message});}};
 const pay=async run=>{try{await startCheckout('market_run',run.id);}catch(e){showToast?.({type:'error',message:e.message});}};
 return <><PageTitle eyebrow={ops?'Procurement operations':'Shop without the trip'} title={ops?'Market Runs queue':'Market Runs'} description={ops?'Review lists, assign procurement, reconcile item expenses and confirm customer approval.' : 'Send a shopping list and review the estimate before procurement begins.'} action={<Button variant="outline" icon="download" disabled={loading||!rows.length} onClick={()=>downloadCsv('digitrans-market-runs.csv',rows,marketRunColumns)}>Download CSV</Button>}/>{!ops&&<Card className="mb-6"><h2 className="text-base font-bold text-ink">Start a Market Run</h2><p className="mt-1 text-xs text-slate-500">Item costs are estimates until actual expenses and receipts are reviewed.</p><form onSubmit={submit} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Contact name" required><Input name="contactName" required defaultValue={user.full_name}/></Field><Field label="Contact phone" required><Input name="contactPhone" type="tel" required defaultValue={user.phone}/></Field><Field label="Delivery location" required className="sm:col-span-2"><Input name="deliveryLocation" required placeholder="Street, landmark, area"/></Field><Field label="Budget estimate (₦)"><Input name="budgetEstimate" type="number" min="0" step="100" placeholder="Optional budget guide"/></Field><Field label="Preferred service date"><Input name="serviceDate" type="date" min={new Date().toISOString().slice(0,10)}/></Field><Field label="Contact preference"><Select name="contactPreference"><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></Select></Field><Field label="Special instructions"><Input name="instructions" placeholder="Substitutions, delivery notes…"/></Field></div><div className="rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold text-ink">Your shopping list</p><p className="text-[10px] text-slate-400">Add a name and quantity for each item.</p></div><Button size="sm" variant="soft" icon="plus" onClick={add}>Add item</Button></div><div className="space-y-2">{items.map((item,i)=><div key={i} className="grid gap-2 sm:grid-cols-[1fr_100px_130px_40px]"><Input value={item.name} onChange={e=>editItem(i,'name',e.target.value)} required placeholder="Item name"/><Input value={item.quantity} type="number" min="1" onChange={e=>editItem(i,'quantity',Number(e.target.value))} required placeholder="Qty"/><Input value={item.unit} onChange={e=>editItem(i,'unit',e.target.value)} placeholder="Unit / pack"/><button type="button" disabled={items.length===1} onClick={()=>setItems(items.filter((_,n)=>n!==i))} className="grid h-11 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"><Icon name="close" size={16}/></button></div>)}</div></div>{formError&&<p className="text-xs text-rose-600">{formError}</p>}<div className="flex justify-end"><Button type="submit" loading={busy} iconRight="arrow">Submit shopping list</Button></div></form></Card>}
 <Card><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold text-ink">{ops?'All Market Runs':'Your requests'}</h2><Button variant="ghost" size="sm" icon="refresh" onClick={reload}>Refresh</Button></div>
  <form onSubmit={applyFilters} className="mb-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="Search"><Input value={draft.search} onChange={e=>setDraft({...draft,search:e.target.value})} placeholder="Reference, location, contact…"/></Field><Field label="Status"><Select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="">All statuses</option>{['submitted','under_review','awaiting_customer_approval','approved','agent_assigned','shopping_in_progress','awaiting_expense_review','expense_approved','awaiting_delivery_assignment','assigned_to_rider','in_transit','delivered','cancelled','rejected'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field><Field label="From date"><Input type="date" value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></Field><Field label="To date"><Input type="date" value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></Field></div>{invalidRange&&<p className="text-xs text-rose-600">The start date must be on or before the end date.</p>}<div className="flex justify-end gap-2"><Button type="button" size="sm" variant="ghost" onClick={clearFilters}>Clear</Button><Button type="submit" size="sm" disabled={!!invalidRange}>Filter</Button></div></form>
  {loading?<Loading/>:error?<p className="text-sm text-rose-600">{error}</p>:!rows.length?<Empty icon="bag" title="No Market Runs found" description="When a request is submitted, its estimate and status timeline will appear here."/>:<div className="space-y-3">{rows.map(m=><div key={m.id} data-record-id={m.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink">{m.reference}</p><Badge status={m.status}/></div><p className="mt-1 text-xs text-slate-500">{m.contact_name||m.customer_name} · {m.delivery_location}</p><p className="mt-1 text-[10px] text-slate-400">{m.items?.length||0} items · Submitted {date(m.created_at)}</p></div><div className="sm:text-right"><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{m.final_total?'Estimate':'Budget guide'}</p><p className="text-sm font-bold text-ink">{money(m.final_total||m.budget_estimate)}</p></div></div><div className="mt-3 flex flex-wrap gap-1.5">{m.items?.map((item,i)=><span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-600">{item.name||item.item_name} · {item.quantity} {item.unit}</span>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"><div className="flex flex-wrap gap-2">{ops&&<><Button size="sm" variant="soft" onClick={()=>estimateRun(m)}>Set estimate</Button><Select className="w-auto min-w-44 py-2 text-xs" value={m.status} onChange={e=>setStatus(m,e.target.value)}><option value={m.status}>{statusLabel(m.status)}</option>{['under_review','agent_assigned','shopping_in_progress','awaiting_expense_review','expense_approved','awaiting_delivery_assignment','assigned_to_rider','in_transit','delivered','cancelled','rejected'].filter(s=>s!==m.status).map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></>}{!ops&&m.status==='awaiting_customer_approval'&&<Button size="sm" onClick={()=>customerApprove(m)}>Approve estimate</Button>}{!ops&&['approved','agent_assigned'].includes(m.status)&&!['successful','under_review'].includes(m.payment_status)&&<Button size="sm" onClick={()=>pay(m)}>{m.payment_status==='initiated'?'Continue payment':'Pay estimate'}</Button>}{!ops&&m.payment_status==='under_review'&&<span className="text-xs font-semibold text-amber-700">Payment under review</span>}{!ops&&m.payment_status==='successful'&&<span className="text-xs font-semibold text-emerald-700">Payment confirmed · {money(m.final_total)}</span>}</div>{navigate&&<Button size="sm" variant="ghost" icon="support" onClick={()=>navigate(workspacePath(user.role,'support',{relatedId:m.reference||m.id,category:'market_run'}))}>Get help</Button>}</div></div>)}</div>}
  {ops&&Number(data?.pages||0)>1&&<div className="mt-4 flex items-center justify-between gap-3"><Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(v=>Math.max(1,v-1))}>Previous</Button><span className="text-[10px] text-slate-400">Page {page} of {data.pages}</span><Button size="sm" variant="outline" disabled={page>=data.pages} onClick={()=>setPage(v=>Math.min(data.pages,v+1))}>Next</Button></div>}
 </Card>{estimate&&<Modal title="Send Market Run estimate" description={estimate.reference} onClose={()=>setEstimate(null)}><form onSubmit={saveEstimate} className="space-y-4"><Field label="Estimated item cost (₦)" required><Input type="number" min="0" value={cost.items} onChange={e=>setCost({...cost,items:e.target.value})} required/></Field><Field label="Service fee (₦)" required><Input type="number" min="0" value={cost.fee} onChange={e=>setCost({...cost,fee:e.target.value})} required/></Field><div className="rounded-xl bg-brand-50 p-3 text-sm font-bold text-brand-900">Customer estimate · {money(Number(cost.items||0)+Number(cost.fee||0))}</div>{formError&&<p className="text-xs text-rose-600">{formError}</p>}<Button type="submit" loading={busy} className="w-full">Send for customer approval</Button></form></Modal>}</>;
}

export function WaybillsView({user,showToast,navigate,locationSearch=''}){
 const ops=user.role==='super_admin'||(user.permissions||[]).includes('waybills.manage'),path=ops?'/ops/waybills':'/waybills';
 const focusId=new URLSearchParams(locationSearch).get('focus')||'';
  const [open,setOpen]=useState(false);
  const pricingApi = useApiData('/pricing');
  const corridorRoutes = useMemo(() => {
    const rows = pricingApi.data?.waybillRoutes || [];
    if (rows.length) {
      const seen = new Set();
      return rows.filter(r => {
        const k = `${r.origin}::${r.destination}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    return [
      { origin: 'Calabar', destination: 'Port Harcourt' },
      { origin: 'Port Harcourt', destination: 'Calabar' },
      { origin: 'Calabar', destination: 'Obudu' },
      { origin: 'Obudu', destination: 'Calabar' },
    ];
  }, [pricingApi.data?.waybillRoutes]);
  const [originCity, setOriginCity] = useState('Calabar');
  const [destinationCity, setDestinationCity] = useState('');
  const originOptions = useMemo(() => [...new Set(corridorRoutes.map(r => r.origin))], [corridorRoutes]);
  const destinationOptions = useMemo(
    () => [...new Set(corridorRoutes.filter(r => r.origin === originCity).map(r => r.destination))],
    [corridorRoutes, originCity],
  );
  useEffect(() => {
    if (destinationCity && !destinationOptions.includes(destinationCity)) setDestinationCity('');
  }, [originCity, destinationOptions, destinationCity]);
 const {data,loading,error,reload}=useApiData(path);const [busy,setBusy]=useState(false),[result,setResult]=useState(null),[formError,setFormError]=useState('');
 const [search,setSearch]=useState(''),[statusFilter,setStatusFilter]=useState('');
 const rows=useMemo(()=>(data?.waybills||[]).filter(w=>{
  if(statusFilter&&w.status!==statusFilter)return false;
  if(search){const q=search.toLowerCase();if(!`${w.reference||''} ${w.waybill_number||''} ${w.destination_city||''} ${w.recipient_name||''}`.toLowerCase().includes(q))return false;}
  return true;
 }),[data?.waybills,statusFilter,search]);
 useEffect(()=>{if(focusId&&!loading&&rows.some(r=>r.id===focusId))focusRecordElement(focusId);},[focusId,loading,rows]);
 const submit=async e=>{e.preventDefault();setBusy(true);setFormError('');const d=Object.fromEntries(new FormData(e.currentTarget));try{const out=await api('/waybills',{method:'POST',body:{...d,weight:Number(d.weight),declaredValue:Number(d.declaredValue||0)}});setResult(out);trackEvent('waybill_booked',{origin:d.origin,destinationCity:d.destinationCity});showToast?.({title:'Waybill request submitted',message:out.reference});e.currentTarget.reset();reload();}catch(e){setFormError(e.message);}finally{setBusy(false);}};
 const pay=async waybill=>{try{await startCheckout('waybill',waybill.id);}catch(e){showToast?.({type:'error',message:e.message});}};
 return <><PageTitle eyebrow={ops?'Parcel operations':'Beyond Calabar'} title={ops?'Waybill desk':'Intercity waybills'} description={ops?'Review parcel intake, payment reconciliation and dispatch milestones.':'Send a parcel request for review on a supported intercity route.'} action={<Button variant="outline" icon="download" disabled={loading||!rows.length} onClick={()=>downloadCsv('digitrans-waybills.csv',rows,waybillColumns)}>Download CSV</Button>}/>{!ops&&<Card className="mb-6"><h2 className="text-base font-bold text-ink">Submit a parcel</h2><p className="mt-1 text-xs text-slate-500">Operations confirms parcel measurements and the applicable route rate before dispatch.</p>{result&&<div className="my-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">Request <strong>{result.reference}</strong> received. Current estimate <strong>{money(result.fee)}</strong>. Payment is due after operations confirms intake.</div>}<form onSubmit={submit} className="mt-5 space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Sender name" required><Input name="senderName" required defaultValue={user.full_name}/></Field><Field label="Sender phone" required><Input name="senderPhone" required type="tel" defaultValue={user.phone}/></Field><Field label="Sender email"><Input name="senderEmail" type="email" defaultValue={user.email}/></Field><Field label="Pickup preference"><Select name="officeDropoff"><option value="office">I’ll drop it at the Calabar office</option><option value="pickup">Request an approved pickup</option></Select></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Recipient name" required><Input name="recipientName" required placeholder="Full name"/></Field><Field label="Recipient phone" required><Input name="recipientPhone" type="tel" required placeholder="+234…"/></Field><Field label="Origin city" required><Select name="origin" required value={originCity} onChange={e=>setOriginCity(e.target.value)}>{originOptions.map(c=><option key={c} value={c}>{c}</option>)}</Select></Field><Field label="Destination city" required><Select name="destinationCity" required value={destinationCity} onChange={e=>setDestinationCity(e.target.value)}><option value="">Choose a supported route…</option>{destinationOptions.map(c=><option key={c} value={c}>{c}</option>)}</Select></Field><Field label="Recipient address" required className="sm:col-span-2"><Input name="destinationAddress" required placeholder="Address, area, city"/></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Parcel category"><Select name="itemCategory"><option>Documents</option><option>Clothing</option><option>Household goods</option><option>Electronics</option><option>Other approved item</option></Select></Field><Field label="Weight (kg)" required><Input name="weight" type="number" min="0.1" max="1000" step="0.1" required placeholder="e.g. 2.5"/></Field><Field label="Parcel description" required><Input name="itemDescription" required placeholder="What is inside?"/></Field><Field label="Declared value (₦)"><Input name="declaredValue" type="number" min="0" step="100" placeholder="0"/></Field><Field label="Dispatch date"><Input name="dispatchDate" type="date" min={new Date().toISOString().slice(0,10)}/></Field><Field label="Handling instructions"><Input name="handling" placeholder="Fragile, keep dry…"/></Field></div><label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"><input required type="checkbox" className="mt-1 accent-[#214c32]"/><span>I confirm that the parcel does not contain prohibited or restricted goods.</span></label>{formError&&<p className="text-xs text-rose-600">{formError}</p>}<div className="flex justify-end"><Button type="submit" loading={busy} iconRight="arrow">Submit waybill request</Button></div></form></Card>}<Card><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-bold text-ink">{ops?'Waybill queue':'Your waybills'}</h2><Button variant="ghost" size="sm" icon="refresh" onClick={reload}>Refresh</Button></div><div className="mb-4 grid gap-3 sm:grid-cols-2"><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search waybill number, reference, destination…"/><Select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option>{['submitted','under_review','awaiting_parcel_dropoff','parcel_received','awaiting_payment','paid','processed','ready_for_dispatch','dispatched','in_transit','arrived_at_destination','delivered','delivery_failed','cancelled','rejected'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></div>{loading?<Loading/>:error?<p className="text-sm text-rose-600">{error}</p>:!rows.length?<Empty icon="box" title="No waybills found" description="Intercity parcel requests will appear here."/>:<div className="space-y-3">{rows.map(w=><div key={w.id} data-record-id={w.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink">{w.waybill_number||w.reference}</p><Badge status={w.status}/></div><p className="mt-1 text-xs text-slate-500">{w.origin} <span className="text-gold-600">→</span> {w.destination_city}</p><p className="mt-1 text-[10px] text-slate-400">{w.sender_name} · {Number(w.weight||0)} kg · {date(w.created_at)}</p></div><div className="flex flex-wrap items-center justify-between gap-3"><div className="text-right"><p className="text-sm font-bold text-ink">{money(w.fee)}</p><p className="mt-1 text-[9px] text-slate-400">Payment {w.payment_status||'pending'}</p></div><div className="flex flex-wrap gap-2">{!ops&&['customer','student'].includes(user.role)&&['parcel_received','awaiting_payment'].includes(w.status)&&w.payment_status!=='successful'&&<Button size="sm" onClick={()=>pay(w)}>{w.payment_status==='initiated'?'Continue payment':'Pay now'}</Button>}<button onClick={()=>window.open(`/track?ref=${encodeURIComponent(w.waybill_number||w.reference)}`,'_self')} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-brand-700">Track</button>{navigate&&<Button size="sm" variant="ghost" icon="support" onClick={()=>navigate(workspacePath(user.role,'support',{relatedId:w.waybill_number||w.reference||w.id,category:'waybill'}))}>Get help</Button>}</div></div></div>)}</div>}</Card></>;
}

export function ProfileView({user,showToast}){
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[data,setData]=useState(null),[error,setError]=useState('');
 useEffect(()=>{api('/auth/profile').then(d=>setData(d.user)).catch(e=>setError(e.message)).finally(()=>setLoading(false));setLoading(true);},[]);
 const save=async e=>{e.preventDefault();setBusy(true);setError('');const f=Object.fromEntries(new FormData(e.currentTarget));try{const r=await api('/auth/profile',{method:'PATCH',body:{fullName:f.fullName,address:f.address}});setData({...data,...r.user});showToast?.({title:'Profile saved',message:'Your account details were updated.'});}catch(e){setError(e.message);}finally{setBusy(false);}};
 if(loading)return <Loading/>;
 return <><PageTitle eyebrow="Account settings" title="My profile" description="Manage the contact details connected to your DigiTrans account."/><div className="grid max-w-4xl gap-5 lg:grid-cols-[.7fr_1.3fr]"><Card className="bg-brand-950 text-white"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-gold-300"><Icon name="user"/></span><h2 className="mt-5 text-lg font-bold">{data?.full_name||user.full_name}</h2><p className="mt-1 text-xs text-white/60">{data?.email||user.email}</p><div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs"><p className="flex justify-between"><span className="text-white/45">Account type</span><span className="font-semibold capitalize">{data?.role||user.role}</span></p><p className="flex justify-between"><span className="text-white/45">Status</span><span className="font-semibold capitalize">{statusLabel(data?.status||user.status)}</span></p><p className="flex justify-between"><span className="text-white/45">Member since</span><span className="font-semibold">{date(data?.created_at)}</span></p></div></Card><Card><h3 className="text-sm font-bold text-ink">Personal information</h3><form onSubmit={save} className="mt-5 space-y-4"><Field label="Full legal name" required><Input name="fullName" required defaultValue={data?.full_name||''}/></Field><Field label="Email address"><Input disabled value={data?.email||user.email}/></Field><Field label="Phone number"><Input disabled value={data?.phone||user.phone}/></Field><Field label="Residential address"><Textarea name="address" defaultValue={data?.address||''} placeholder="Street, area, city"/></Field>{error&&<p className="text-xs text-rose-600">{error}</p>}<Button type="submit" loading={busy}>Save profile</Button></form></Card></div>{['customer','student'].includes(user.role)&&<SavedAddresses showToast={showToast}/>}</>;
}

function SavedAddresses({showToast}){
 const [addresses,setAddresses]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const refresh=()=>api('/addresses').then(data=>setAddresses(data.addresses||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));
 useEffect(()=>{refresh();},[]);
 const add=async e=>{e.preventDefault();setBusy(true);setError('');const values=Object.fromEntries(new FormData(e.currentTarget));try{await api('/addresses',{method:'POST',body:{label:values.label,addressLine:values.addressLine,isDefault:values.isDefault==='on'}});e.currentTarget.reset();showToast?.({title:'Address saved',message:'Your delivery locations are updated.'});refresh();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const setDefault=async address=>{try{await api(`/addresses/${address.id}`,{method:'PATCH',body:{isDefault:true}});refresh();}catch(e){showToast?.({type:'error',message:e.message});}};
 const remove=async address=>{if(!window.confirm(`Remove ${address.label||'this address'}?`))return;try{await api(`/addresses/${address.id}`,{method:'DELETE'});showToast?.({title:'Address removed'});refresh();}catch(e){showToast?.({type:'error',message:e.message});}};
 return <section className="mt-8 max-w-4xl"><div className="mb-4"><p className="eyebrow">Delivery preferences</p><h2 className="text-lg font-bold tracking-tight text-ink">Saved addresses</h2><p className="mt-1 text-xs leading-5 text-slate-500">Keep trusted pickup and drop-off locations ready for future bookings.</p></div><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><Card><h2 className="text-sm font-bold text-ink">Add a location</h2><form onSubmit={add} className="mt-4 space-y-4"><Field label="Label"><Input name="label" defaultValue="Home" maxLength={40} placeholder="Home, work, campus"/></Field><Field label="Full address and landmark" required><Textarea name="addressLine" required minLength={4} maxLength={250} placeholder="Street, area, city and a nearby landmark"/></Field><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" name="isDefault" className="accent-[#214c32]"/>Make this my default address</label>{error&&<p className="text-xs text-rose-600">{error}</p>}<Button type="submit" loading={busy} className="w-full">Save address</Button></form></Card><Card><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">Your locations</h2><p className="mt-1 text-[10px] text-slate-400">The default address is selected first.</p></div><Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Refresh</Button></div>{loading?<Loading/>:addresses.length?<div className="space-y-3">{addresses.map(address=><div key={address.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name="pin" size={16}/></span><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold text-ink">{address.label||'Saved address'}</p>{address.is_default===1&&<Badge status="default"/>}</div><p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{address.address_line}</p></div></div><div className="flex gap-2">{address.is_default!==1&&<Button size="sm" variant="outline" onClick={()=>setDefault(address)}>Make default</Button>}<Button size="sm" variant="outline" className="text-rose-600" onClick={()=>remove(address)}>Remove</Button></div></div></div>)}</div>:<Empty icon="pin" title="No saved addresses" description="Add a pickup or drop-off location you use often."/>}</Card></div></section>;
}

export function DocumentsView({user,showToast}){
 const role=user.role==='rider'?'rider':user.role==='vendor'?'vendor':user.role==='investor'?'investor':user.role==='student'?'student':null;
 const path=role==='rider'?'/rider/documents':role==='vendor'?'/vendor/documents':role==='investor'?'/investor/documents':'/student/documents';
 const [docs,setDocs]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[docType,setDocType]=useState(role==='student'?'student_id':'national_id'),[file,setFile]=useState(null);
 const refresh=()=>api(path).then(d=>setDocs(d.documents||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));useEffect(()=>{refresh();},[]);
 const submit=async e=>{e.preventDefault();if(!file)return setError('Choose a file first.');setBusy(true);setError('');try{await upload(path,file,{docType});setFile(null);e.currentTarget.reset();showToast?.({title:'Document uploaded',message:'Your document is stored privately for authorised review.'});refresh();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const options=role==='rider'?['national_id','drivers_license','voter_id','passport','vehicle_document','guarantor_id','other']:role==='vendor'?['business_registration','business_permit','tax_document','other']:role==='investor'?['national_id','passport','drivers_license','voter_id']:['student_id'];
 return <><PageTitle eyebrow="Private documents" title="Verification documents" description="Files are private and available only to your account and authorised reviewers."/><div className="grid max-w-5xl gap-5 lg:grid-cols-[.85fr_1.15fr]"><Card><h2 className="text-sm font-bold text-ink">Add a document</h2><p className="mt-1 text-xs leading-5 text-slate-500">PDF, JPG, PNG or WebP. Maximum 10 MB.</p><form onSubmit={submit} className="mt-5 space-y-4"><Field label="Document type"><Select value={docType} onChange={e=>setDocType(e.target.value)}>{options.map(o=><option key={o} value={o}>{statusLabel(o)}</option>)}</Select></Field><Field label="Choose file" required><Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)} required/></Field>{file&&<p className="text-xs text-slate-500">{file.name} · {(file.size/1024/1024).toFixed(2)} MB</p>}{error&&<p className="text-xs text-rose-600">{error}</p>}<Button type="submit" loading={busy} icon="download" className="w-full">Upload securely</Button></form></Card><Card><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold text-ink">Submitted documents</h2><Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Refresh</Button></div>{loading?<Loading/>:docs.length?<div className="space-y-3">{docs.map(d=><div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name="file" size={17}/></span><span className="min-w-0"><span className="block truncate text-xs font-bold text-ink">{statusLabel(d.doc_type)}</span><span className="mt-1 block text-[10px] text-slate-400">Uploaded {date(d.created_at)}</span></span></span><Badge status={d.status}/></div>)}</div>:<Empty icon="file" title="No documents uploaded" description="Your verification documents will be listed here."/>}</Card></div></>;
}

const normalizeSupportCategory=value=>{
 const raw=String(value||'').trim().toLowerCase();
 if(raw==='payments'||raw==='payment')return 'payment';
 if(['delivery','payment','market_run','waybill','account','other'].includes(raw))return raw;
 return 'delivery';
};

export function SupportView({user,showToast,navigate,locationSearch=''}){
 const queryParams=new URLSearchParams(locationSearch);
 const queryTicket=queryParams.get('ticket')||queryParams.get('focus')||'';
 const queryRelated=queryParams.get('relatedId')||'';
 const queryCategory=normalizeSupportCategory(queryParams.get('category'));
 const [statusFilter,setStatusFilter]=useState(''),[search,setSearch]=useState('');
 const path=useMemo(()=>{
  const p=new URLSearchParams();
  if(statusFilter)p.set('status',statusFilter);
  if(search.trim())p.set('search',search.trim());
  const q=p.toString();
  return q?`/support?${q}`:'/support';
 },[statusFilter,search]);
 const {data,loading,error,reload}=useApiData(path);
 const [open,setOpen]=useState(Boolean(queryRelated)),[draftRelated,setDraftRelated]=useState(queryRelated),[draftCategory,setDraftCategory]=useState(queryCategory);
 const [selected,setSelected]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[formError,setFormError]=useState('');
 const handledTicket=useRef(''),handledRelated=useRef('');
 useEffect(()=>{
  if(queryRelated&&handledRelated.current!==queryRelated){
   handledRelated.current=queryRelated;
   setDraftRelated(queryRelated);
   setDraftCategory(queryCategory);
   setOpen(true);
  }
 },[queryRelated,queryCategory]);
 useEffect(()=>{
  if(!queryTicket){handledTicket.current='';return;}
  if(handledTicket.current===queryTicket)return;
  handledTicket.current=queryTicket;
  focusRecordElement(queryTicket);
  api(`/support/${encodeURIComponent(queryTicket)}`).then(d=>setSelected({...d.ticket,messages:d.messages})).catch(()=>{});
 },[queryTicket]);
 const create=async e=>{
  e.preventDefault();setBusy(true);setFormError('');
  const f=Object.fromEntries(new FormData(e.currentTarget));
  try{
   const out=await api('/support',{method:'POST',body:{...f,category:draftCategory,relatedId:draftRelated}});
   showToast?.({title:'Support request created',message:out.reference});
   setOpen(false);setDraftRelated('');
   if(queryRelated&&navigate)navigate(workspacePath(user.role,'support'),{replace:true});
   reload();
  }catch(e){setFormError(e.message);}finally{setBusy(false);}
 };
 const reply=async e=>{
  e.preventDefault();if(!message.trim())return;setBusy(true);
  try{await api(`/support/${selected.id}/messages`,{method:'POST',body:{message}});setMessage('');const d=await api(`/support/${selected.id}`);setSelected({...d.ticket,messages:d.messages});reload();}
  catch(e){showToast?.({type:'error',message:e.message});}finally{setBusy(false);}
 };
 const tickets=data?.tickets||[];
 return <><PageTitle eyebrow="We’re here to help" title="Help & support" description="Raise a support request and keep its replies together with the service reference." action={<Button onClick={()=>{setDraftRelated('');setOpen(true);}} icon="plus">New request</Button>}/>
  <Card padding="p-4" className="mb-4"><div className="grid gap-3 sm:grid-cols-[1fr_200px]"><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ticket reference or message…"/><Select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option>{['open','assigned','in_progress','awaiting_user','resolved','closed'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></div></Card>
  {loading?<Loading/>:error?<Card><p className="text-sm text-rose-600">{error}</p></Card>:!tickets.length?<Empty icon="support" title="No support requests" description="If something needs a closer look, send the team a note." action={<Button onClick={()=>setOpen(true)}>Contact support</Button>}/>:<div className="space-y-3">{tickets.map(t=><Card key={t.id} data-record-id={t.id} padding="p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink">{t.reference}</p><Badge status={t.status}/></div><p className="mt-1 text-xs text-slate-500">{statusLabel(t.category)} · {t.description}</p>{t.related_context&&<p className="mt-1.5 text-[11px] font-semibold text-brand-700">Linked {statusLabel(t.related_context.type)}: {t.related_context.reference} · {t.related_context.summary}</p>}<p className="mt-1 text-[10px] text-slate-400">Opened {date(t.created_at)}</p></div><div className="flex flex-wrap gap-2">{t.related_context?.href&&navigate&&<Button size="sm" variant="ghost" onClick={()=>navigate(t.related_context.href)}>Open record</Button>}<Button size="sm" variant="outline" onClick={async()=>{try{const d=await api(`/support/${t.id}`);setSelected({...d.ticket,messages:d.messages});}catch(e){showToast?.({type:'error',message:e.message});}}}>View conversation</Button></div></div></Card>)}</div>}
  {open&&<Modal title="New support request" description="Tell us what happened and include a reference if you have one." onClose={()=>{setOpen(false);if(queryRelated&&navigate)navigate(workspacePath(user.role,'support'),{replace:true});}}><form onSubmit={create} className="space-y-4"><Field label="Category"><Select value={draftCategory} onChange={e=>setDraftCategory(e.target.value)}><option value="delivery">Delivery</option><option value="payment">Payment</option><option value="market_run">Market Run</option><option value="waybill">Waybill</option><option value="investment">Investment</option><option value="account">Account</option><option value="other">Other</option></Select></Field><Field label="Related reference or ID (optional)"><Input value={draftRelated} onChange={e=>setDraftRelated(e.target.value)} placeholder="e.g. DEL-..., PAY-..., DWB-..."/></Field><Field label="Describe the issue" required><Textarea name="description" minLength={10} maxLength={3000} required placeholder="Share what you need help with…"/></Field>{formError&&<p className="text-xs text-rose-600">{formError}</p>}<Button type="submit" loading={busy} className="w-full">Submit request</Button></form></Modal>}
  {selected&&<Modal title={selected.reference} description={statusLabel(selected.status)} onClose={()=>setSelected(null)}>{selected.related_context&&<div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-xs"><div><p className="font-bold text-brand-900">Linked {statusLabel(selected.related_context.type)} · {selected.related_context.reference}</p><p className="mt-0.5 text-[11px] text-slate-600">{selected.related_context.summary}</p></div>{selected.related_context.href&&navigate&&<Button size="sm" variant="outline" onClick={()=>{const href=selected.related_context.href;setSelected(null);navigate(href);}}>Open record</Button>}</div>}<div className="max-h-64 space-y-3 overflow-auto">{(selected.messages||[]).map(m=><div key={m.id} className={`rounded-xl p-3 text-xs leading-5 ${m.internal?'bg-amber-50 text-amber-900':'bg-slate-50 text-slate-600'}`}><p>{m.message}</p><p className="mt-1 text-[9px] text-slate-400">{new Date(m.created_at).toLocaleString('en-NG')}</p></div>)}</div><form onSubmit={reply} className="mt-4 space-y-3"><Field label="Reply"><Textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Add a message…"/></Field><div className="flex justify-end"><Button type="submit" loading={busy} disabled={!message.trim()}>Send reply</Button></div></form></Modal>}</>;
}
