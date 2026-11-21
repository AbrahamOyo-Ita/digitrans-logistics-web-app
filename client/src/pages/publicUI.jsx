import React,{useEffect,useMemo,useRef,useState} from 'react';
import Logo from '../components/Brand';
import Icon from '../components/Icon';
import {faqs as defaultFaqs,services,site,zones} from './publicContent';

const primaryNav=[['Services','/services'],['Coverage','/coverage'],['Pricing','/pricing'],['Track','/track'],['About','/about'],['Contact','/contact']];
const serviceLinks=[
 {label:'Standard delivery',href:'/services/standard-delivery',hint:'Same-day around Calabar',tag:'CITY',icon:'bike',tone:'coral'},
 {label:'Market runs',href:'/services/market-runs',hint:'Watt Market, brought to you',tag:'LOCAL',icon:'bag',tone:'gold'},
 {label:'Waybills & parcels',href:'/services/waybills',hint:'Tracked between cities',tag:'PARCEL',icon:'box',tone:'teal'},
 {label:'Business & vendor',href:'/services/business-logistics',hint:'Dispatch that scales with you',tag:'BUSINESS',icon:'chart',tone:'navy'},
 {label:'Student delivery',href:'/services/student-delivery',hint:'Flat ₦500 campus trips',tag:'STUDENT',icon:'user',tone:'mint'},
 {label:'Scheduled pickups',href:'/services/scheduled-pickups',hint:'Choose a time that works',tag:'PLANNED',icon:'clock',tone:'blue'},
];

export function SiteHeader({page,navigate,onLogin,user}){
 const [open,setOpen]=useState(false);
 const [servicesOpen,setServicesOpen]=useState(false);
 const [scrolled,setScrolled]=useState(false);
 const menuButtonRef=useRef(null);
 const closeButtonRef=useRef(null);
 const drawerRef=useRef(null);
 const wasOpen=useRef(false);
 const isHome=page==='/';

 useEffect(()=>{
  const update=()=>setScrolled(window.scrollY>18);
  update();
  window.addEventListener('scroll',update,{passive:true});
  return()=>window.removeEventListener('scroll',update);
 },[]);
 useEffect(()=>{setOpen(false);setServicesOpen(false);},[page]);
 useEffect(()=>{
  document.body.style.overflow=open?'hidden':'';
  return()=>{document.body.style.overflow='';};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const handleMenuKeyDown=event=>{
   if(event.key==='Escape'){
    setOpen(false);
    return;
   }
   if(event.key!=='Tab')return;
   const items=drawerRef.current?.querySelectorAll('button:not([disabled]),a[href]');
   if(!items?.length)return;
   const first=items[0],last=items[items.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  window.addEventListener('keydown',handleMenuKeyDown);
  return()=>window.removeEventListener('keydown',handleMenuKeyDown);
 },[open]);
 useEffect(()=>{
  if(open){wasOpen.current=true;closeButtonRef.current?.focus();return;}
  if(wasOpen.current){menuButtonRef.current?.focus();wasOpen.current=false;}
 },[open]);

 const go=path=>{navigate(path);setOpen(false);setServicesOpen(false);};
 const signIn=()=>{
  if(user){go('/workspace');return;}
  setOpen(false);
  onLogin('/workspace');
 };
 const isActive=path=>page===path||(path!=='/'&&page.startsWith(`${path}/`));

 return <>
  <header className={`site-header ${isHome?'site-header-home':'site-header-public'} ${scrolled?'is-scrolled':''}`}>
   <div className="site-header-inner">
    <Logo navigate={navigate} className="site-header-brand"/>
    <nav className="site-primary-nav" aria-label="Main navigation">
     {primaryNav.map(([label,path])=>label==='Services'?<div key={label} className="site-nav-services" onMouseEnter={()=>setServicesOpen(true)} onMouseLeave={()=>setServicesOpen(false)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setServicesOpen(false);}}>
      <button type="button" onFocus={()=>setServicesOpen(true)} onClick={()=>go(path)} onKeyDown={event=>{if(event.key==='Escape')setServicesOpen(false);}} aria-expanded={servicesOpen} aria-current={isActive(path)?'page':undefined} className={`site-nav-link site-nav-services-trigger ${isActive(path)?'is-active':''}`}>
       {label}<Icon name="down" size={13} className={servicesOpen?'is-open':''}/>
      </button>
      {servicesOpen&&<div id="site-services-dropdown" className="site-services-dropdown" role="region" aria-label="DigiTrans services">
       <div className="site-services-dropdown-card">
        <aside className="site-services-feature">
         <img src="/images/hero-courier.jpg" alt="" aria-hidden="true"/>
         <div className="site-services-feature-content">
          <span className="site-services-feature-kicker"><i/>CALABAR · LOCALLY MOVING</span>
          <div><p>YOUR DAY, IN MOTION</p><h3>Good routes.<br/>Right on time.</h3><small>From a quick local drop to a parcel headed farther, we’ll help you find your kind of run.</small></div>
          <button type="button" onClick={()=>go('/quote')} className="site-services-feature-cta">Get a quote<Icon name="arrow" size={14}/></button>
         </div>
        </aside>
        <div className="site-services-menu-main">
         <div className="site-services-menu-heading">
          <div><span>MADE FOR THE WAY YOU MOVE</span><h3>Find your kind of run.</h3></div>
          <div className="site-services-menu-count"><Icon name="spark" size={14}/> 6 services</div>
         </div>
         <div className="site-services-grid">{serviceLinks.map(item=><button key={item.href} type="button" onClick={()=>go(item.href)} className="site-service-menu-link">
          <span className={`site-service-menu-icon is-${item.tone}`}><Icon name={item.icon} size={18}/></span>
          <span className="site-service-menu-copy"><span className="site-service-menu-title">{item.label}<small>{item.tag}</small></span><small>{item.hint}</small></span>
          <span className="site-service-menu-arrow"><Icon name="arrow" size={14}/></span>
         </button>)}</div>
         <div className="site-services-menu-footer">
          <span><Icon name="support" size={15}/><span>Not sure where to start?<b>Our local team can help.</b></span></span>
          <a href={site.phoneHref}>Call dispatch<Icon name="arrow" size={13}/></a>
          <button type="button" onClick={()=>go('/pricing')}>Compare rates<Icon name="arrow" size={13}/></button>
         </div>
        </div>
       </div>
      </div>}
     </div>:<button key={path} type="button" onClick={()=>go(path)} aria-current={isActive(path)?'page':undefined} className={`site-nav-link ${isActive(path)?'is-active':''}`}>{label}</button>)}
    </nav>
    <div className="site-header-actions">
     <button type="button" onClick={signIn} className="site-header-signin">{user?'Workspace':'Sign in'}</button>
     <button type="button" onClick={()=>go('/quote')} className="site-header-quote">Get a quote<Icon name="arrow" size={15}/></button>
     <button ref={menuButtonRef} type="button" onClick={()=>setOpen(true)} className="site-header-menu-button" aria-label="Open menu" aria-expanded={open} aria-controls="site-mobile-drawer"><Icon name="menu" size={21}/></button>
    </div>
   </div>
  </header>
  <div className={`site-mobile-overlay ${open?'is-open':''}`} aria-hidden={!open}>
   <button type="button" aria-label="Close menu" onClick={()=>setOpen(false)} className="site-mobile-backdrop" tabIndex={open?0:-1}/>
   <aside ref={drawerRef} id="site-mobile-drawer" className="site-mobile-drawer" role="dialog" aria-modal="true" aria-label="Site menu">
    <div className="site-mobile-header"><Logo navigate={navigate}/><button ref={closeButtonRef} type="button" onClick={()=>setOpen(false)} className="site-mobile-close" aria-label="Close menu"><Icon name="close" size={20}/></button></div>
    <div className="site-mobile-content">
     <p className="site-mobile-eyebrow">Explore DigiTrans</p>
     <nav className="site-mobile-links" aria-label="Mobile navigation">{primaryNav.map(([label,path])=><button key={path} type="button" onClick={()=>go(path)} className={`site-mobile-link ${isActive(path)?'is-active':''}`}><span>{label}</span><Icon name="arrow" size={16}/></button>)}<button type="button" onClick={signIn} className="site-mobile-link"><span>{user?'Workspace':'Sign in'}</span><Icon name="arrow" size={16}/></button></nav>
    </div>
    <div className="site-mobile-footer"><button type="button" onClick={()=>go('/quote')} className="site-mobile-quote">Get a delivery quote<Icon name="arrow" size={16}/></button><a href={site.phoneHref} className="site-mobile-phone"><Icon name="phone" size={14}/>{site.phone}</a></div>
   </aside>
  </div>
 </>;
}
export function SiteFooter({navigate,onLogin,user}){
 const quick=[['Home','/'],['Services','/services'],['About','/about'],['Coverage','/coverage'],['Pricing','/pricing'],['Track a delivery','/track'],['Contact','/contact']];
 return <footer className="band"><div className="container-x"><div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1.2fr] lg:gap-12">
  <div><Logo variant="light" navigate={navigate}/><p className="mt-5 max-w-[30ch] text-[.875rem] leading-relaxed text-white/55">Delivery, market runs and waybills across Calabar. Built in Cross River State since {site.founded}.</p><div className="mt-6 flex flex-col gap-2 text-[.8125rem] text-white/60"><a href={site.phoneHref} className="inline-flex items-center gap-2 transition-colors hover:text-white"><Icon name="phone" size={14} className="text-white/40"/>{site.phone}</a><a href={site.emailHref} className="inline-flex items-center gap-2 transition-colors hover:text-white"><Icon name="mail" size={14} className="text-white/40"/>{site.email}</a></div><p className="mt-5 max-w-[32ch] text-[.75rem] leading-relaxed text-white/40">{site.address}</p></div>
  <div><p className="text-[.9375rem] font-medium text-white">Quick links</p><ul className="mt-4 space-y-2.5">{quick.map(([label,path])=><li key={path}><button type="button" onClick={()=>navigate(path)} className="footer-link">{label}</button></li>)}</ul></div>
  <div><p className="text-[.9375rem] font-medium text-white">Our services</p><ul className="mt-4 space-y-2.5">{services.map(s=><li key={s.slug}><button type="button" onClick={()=>navigate(`/services/${s.slug}`)} className="footer-link">{s.name}</button></li>)}</ul></div>
  <div><p className="text-[.9375rem] font-medium text-white">Need a hand?</p><p className="mt-2 max-w-[30ch] text-[.8125rem] leading-relaxed text-white/50">Call dispatch or send the team a note. We’ll help you choose the right service for your route.</p><div className="mt-5 flex flex-col gap-2"><button type="button" onClick={()=>navigate('/contact')} className="pill pill-white pill-sm w-full">Contact dispatch<Icon name="arrow" size={14}/></button><button type="button" onClick={()=>user?navigate('/workspace'):onLogin('/workspace')} className="pill pill-ghost pill-sm w-full">{user?'Open workspace':'Workspace sign in'}</button></div><p className="mt-5 text-[.75rem] text-white/40">{site.hours}</p></div>
 </div><div className="flex flex-col gap-3 border-t border-white/15 py-6 text-[.75rem] text-white/40 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} DigiTrans Logistics Ltd. All rights reserved.</p><div className="flex flex-wrap items-center gap-5"><button type="button" onClick={()=>navigate('/privacy')} className="transition-colors hover:text-white/75">Privacy policy</button><span aria-hidden className="h-3 w-px bg-white/20"/><button type="button" onClick={()=>navigate('/terms')} className="transition-colors hover:text-white/75">Terms &amp; conditions</button></div></div></div></footer>;
}

export function PageHero({title,lead,eyebrow,trail=[],image,imageAlt='',children,navigate}){
 return <section className="relative isolate overflow-hidden bg-navy text-white">{image&&<><img src={image} alt={imageAlt} className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_center]"/><div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/55"/><div className="absolute inset-0 -z-10 bg-navy/20"/></>}<div className="container-x pb-14 pt-9 sm:pb-20 sm:pt-11"><nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-2 text-[.75rem] text-white/45"><li><button type="button" onClick={()=>navigate?.('/')} className="hover:text-white">Home</button></li>{trail.map((item,i)=><li key={`${item.label}-${i}`} className="flex items-center gap-2"><Icon name="chevron" size={12} className="text-white/25"/>{item.href?<button type="button" onClick={()=>navigate?.(item.href)} className="text-white/65 hover:text-white">{item.label}</button>:<span className="text-white/70">{item.label}</span>}</li>)}</ol></nav><div className="mt-9 max-w-3xl">{eyebrow&&<p className="eyebrow eyebrow-light">{eyebrow}</p>}<h1 className={`display-1 text-white ${eyebrow?'mt-4':''}`}>{title}</h1>{lead&&<p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed text-white/65">{lead}</p>}{children}</div></div></section>;
}

export function SectionHeading({eyebrow,title,lead,action,light=false,className=''}){
 return <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}><div className="max-w-2xl">{eyebrow&&<p className={`eyebrow ${light?'eyebrow-light':''}`}>{eyebrow}</p>}<h2 className={`display-2 mt-3 ${light?'text-white':'text-navy'}`}>{title}</h2>{lead&&<p className={`mt-4 max-w-xl text-[.9375rem] leading-relaxed ${light?'text-white/65':'text-ink-slate'}`}>{lead}</p>}</div>{action}</div>;
}

export function FaqSection({items=defaultFaqs,compact=false,title='Questions we get.',navigate}){
 const rows=(items||[]).map(item=>({q:item.question||item.q,a:item.answer||item.a})).filter(item=>item.q&&item.a);
 const visible=compact?rows.slice(0,4):rows;
 return <section className={`bg-white ${compact?'py-14 sm:py-16':'section'}`}><div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-16"><div className="lg:col-span-4"><h2 className="display-2 max-w-[14ch]">{title}</h2><p className="body-sm mt-5 max-w-sm">Still unsure? Our support desk answers on the phone and on WhatsApp during operating hours.</p><a href={site.phoneHref} className="link-underline mt-6">Call {site.phone}</a></div><div className="lg:col-span-7 lg:col-start-6"><div className="space-y-3">{visible.map((faq,i)=><details key={`${faq.q}-${i}`} className="group rounded-2xl border border-line bg-white p-5 transition-all duration-200 hover:border-line-strong open:bg-paper/40" open={i===0}><summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-[.9375rem] font-semibold leading-snug text-navy marker:hidden">{faq.q}<span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper border border-line text-muted transition-transform group-open:rotate-45 group-open:bg-cyan/10 group-open:text-cyan"><Icon name="plus" size={13}/></span></summary><p className="mt-3 max-w-[62ch] pr-8 text-[.875rem] leading-relaxed text-ink-slate">{faq.a}</p></details>)}</div><button type="button" className="link-underline mt-6" onClick={()=>navigate?.('/contact')}>Contact support<Icon name="arrow" size={14}/></button></div></div></section>;
}

const naira=value=>`₦${new Intl.NumberFormat('en-NG',{maximumFractionDigits:0}).format(Math.max(0,Math.round(value)))}`;
export function QuoteEstimator({onBook,defaultService='standard',compact=false}){
 const requestedZone=key=>{const value=new URLSearchParams(window.location.search).get(key);return zones.some(zone=>zone.id===value)?value:null;};
 const [service,setService]=useState(defaultService),[from,setFrom]=useState(()=>requestedZone('from')||'marian'),[to,setTo]=useState(()=>requestedZone('to')||'unical'),[weight,setWeight]=useState('3'),[budget,setBudget]=useState('5000'),[urgent,setUrgent]=useState(false),[fragile,setFragile]=useState(false),[student,setStudent]=useState(false);
 const result=useMemo(()=>{
  const a=zones.find(z=>z.id===from),b=zones.find(z=>z.id===to);if(!a||!b)return null;
  const km=from===to?1.2:Math.max(.8,Math.round(Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2)*1.28*10)/10);let lines=[],total=0;
  if(service==='waybill'){const kg=Math.max(.1,Number(weight)||0);const cost=kg<=5?1500:kg<=10?3000:Math.round(kg*250);lines=[['Weight category',cost]];if(urgent)lines.push(['Priority dispatch',700]);if(fragile)lines.push(['Careful handling',400]);}
  else if(service==='market-run'){lines=[['Shopping budget (held)',Math.max(0,Number(budget)||0)],['Market run service fee',1500]];if(urgent)lines.push(['Priority slot',700]);}
  else if(service==='student'&&student&&(a.campus||b.campus)){lines=[['Verified student flat rate',500]];}
  else {const distance=Math.round(km*250/50)*50;lines=[['Base pickup fee',500],[`Distance · ${km.toFixed(1)} km`,distance]];if(urgent)lines.push(['Priority delivery',700]);if(fragile)lines.push(['Careful handling',400]);const subtotal=lines.reduce((sum,row)=>sum+row[1],0);if(subtotal<1000)lines.push(['Minimum fare adjustment',1000-subtotal]);if(service==='business'){const pre=lines.reduce((sum,row)=>sum+row[1],0);lines.push(['Vendor contract rate · 10% off',-Math.round(pre*.1/50)*50]);}}
  total=lines.reduce((sum,row)=>sum+row[1],0);const eta=service==='waybill'?'24 – 72 hours':service==='market-run'?'90 – 150 min':service==='student'&&student&&(a.campus||b.campus)?'20 – 40 min':`${Math.round(18+km*3.2)} – ${Math.round(34+km*5)} min`;return{km,lines,total:Math.max(total,0),eta,zoneFallback:a.lga!==b.lga};
 },[service,from,to,weight,budget,urgent,fragile,student]);
 return <div className={`border border-line/80 bg-white ${compact?'rounded-2xl shadow-card':'rounded-3xl shadow-panel'} overflow-hidden`}><div className="border-b border-line px-6 py-4.5 bg-paper/30"><p className="text-[.6875rem] font-semibold uppercase tracking-[.14em] text-cyan">Live estimate</p><p className="mt-0.5 font-display text-[1.125rem] font-semibold tracking-tight text-navy">Price it before you book.</p></div><form className="space-y-4 p-6" onSubmit={e=>{e.preventDefault();onBook?.();}}>
  <label className="block"><span className="field-label">Service</span><select value={service} onChange={e=>setService(e.target.value)} className="field"><option value="standard">Standard delivery</option><option value="market-run">Market run</option><option value="waybill">Waybill / parcel</option><option value="business">Business &amp; vendor</option><option value="student">Student delivery</option></select></label>
  <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="field-label">Pickup zone</span><select value={from} onChange={e=>setFrom(e.target.value)} className="field">{zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}</select></label><label className="block"><span className="field-label">Drop-off zone</span><select value={to} onChange={e=>setTo(e.target.value)} className="field">{zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}</select></label></div>
  {service==='waybill'&&<label className="block"><span className="field-label">Parcel weight (kg)</span><input className="field" type="number" min="0.1" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)}/></label>}
  {service==='market-run'&&<label className="block"><span className="field-label">Shopping budget (₦)</span><input className="field" type="number" min="0" step="500" value={budget} onChange={e=>setBudget(e.target.value)}/></label>}
  {service==='student'&&<label className="flex items-start gap-2.5 text-[.75rem] leading-5 text-ink-slate"><input type="checkbox" checked={student} onChange={e=>setStudent(e.target.checked)} className="mt-1 accent-cyan"/><span>I'm a verified student requesting a campus-zone trip.</span></label>}
  {service!=='market-run'&&<div className="flex flex-wrap gap-x-5 gap-y-2 text-[.75rem] text-ink-slate"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={urgent} onChange={e=>setUrgent(e.target.checked)} className="accent-cyan"/>Priority + ₦700</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={fragile} onChange={e=>setFragile(e.target.checked)} className="accent-cyan"/>Careful handling + ₦400</label></div>}
  {result&&<div className="rounded-2xl border border-line bg-paper/60 p-4 space-y-2.5"><div className="space-y-2">{result.lines.map(([label,amount])=><div key={label} className="flex items-baseline justify-between gap-3 text-[.8125rem]"><span className="text-ink-slate">{label}</span><span className={`shrink-0 font-medium tabular-nums ${amount<0?'text-success':'text-navy'}`}>{amount<0?`−${naira(Math.abs(amount))}`:naira(amount)}</span></div>)}</div><div className="mt-3 flex items-baseline justify-between border-t border-line pt-3 text-[.9375rem] font-semibold text-navy"><span>Estimated total</span><span className="tabular-nums font-bold text-cyan">{naira(result.total)}</span></div><p className="mt-1.5 text-[.6875rem] leading-relaxed text-muted">{result.km.toFixed(1)} km · Typical window {result.eta}{result.zoneFallback?' · cross-zone route':''}</p></div>}
  <button type="submit" className="pill pill-navy w-full shadow-sm hover:shadow-md">Request this delivery<Icon name="arrow" size={15}/></button><p className="text-center text-[.6875rem] leading-relaxed text-muted">Estimate only. Your account and the server confirm the final fare before booking.</p>
 </form></div>;
}
