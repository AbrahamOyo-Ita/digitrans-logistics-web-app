import React,{useState} from 'react';
import Icon from '../components/Icon';
import ScrollReveal from '../components/ScrollReveal';
import {articles,services,testimonials,zones} from './publicContent';

function DispatchPanel({navigate}){
 const [tab,setTab]=useState('track');
 const [reference,setReference]=useState('');
 const [origin,setOrigin]=useState('marian');
 const [destination,setDestination]=useState('unical');
 const submitTracking=e=>{
  e.preventDefault();
  const value=reference.trim().toUpperCase();
  navigate(value?`/track?ref=${encodeURIComponent(value)}`:'/track');
 };
 const planDelivery=e=>{
  e.preventDefault();
  const query=new URLSearchParams({from:origin,to:destination});
  navigate(`/quote?${query.toString()}`);
 };
 const handleTabKeyDown=e=>{
  if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
  const next=e.currentTarget.querySelector('[aria-selected="true"]')?.id==='dispatch-tab-track'?'quote':'track';
  e.preventDefault();setTab(next);document.getElementById(`dispatch-tab-${next}`)?.focus();
 };
 return <aside className="dispatch-panel" aria-label="Quick delivery tools">
  <div className="dispatch-panel-topline"><span className="dispatch-live"><span/>Dispatch desk</span><span className="dispatch-secure"><Icon name="shield" size={13}/>Secure &amp; tracked</span></div>
  <div className="dispatch-panel-title"><div><p>Moving something?</p><h2>Start right here.</h2></div><span className="dispatch-mark"><Icon name="route" size={21}/></span></div>
  <div className="dispatch-tabs" role="tablist" aria-label="Quick actions" onKeyDown={handleTabKeyDown}>
   <button id="dispatch-tab-track" type="button" role="tab" aria-controls="dispatch-panel-content" aria-selected={tab==='track'} tabIndex={tab==='track'?0:-1} className={tab==='track'?'is-active':''} onClick={()=>setTab('track')}><Icon name="search" size={14}/>Track a parcel</button>
   <button id="dispatch-tab-quote" type="button" role="tab" aria-controls="dispatch-panel-content" aria-selected={tab==='quote'} tabIndex={tab==='quote'?0:-1} className={tab==='quote'?'is-active':''} onClick={()=>setTab('quote')}><Icon name="pin" size={14}/>Plan a route</button>
  </div>
  <div id="dispatch-panel-content" role="tabpanel" aria-labelledby={`dispatch-tab-${tab}`} tabIndex={0}>
  {tab==='track'?<form className="dispatch-form" onSubmit={submitTracking}>
   <label className="dispatch-label" htmlFor="hero-tracking-ref">Tracking reference</label>
   <div className="dispatch-input-row"><Icon name="box" size={17}/><input id="hero-tracking-ref" autoComplete="off" spellCheck="false" maxLength={64} placeholder="DT-CAL-0000-0000" value={reference} onChange={e=>setReference(e.target.value.toUpperCase())}/><button type="submit" aria-label="Track your parcel"><Icon name="arrow" size={17}/></button></div>
   <p className="dispatch-hint">Your latest handoff, in one tap.</p>
  </form>:<form className="dispatch-form" onSubmit={planDelivery}>
   <label className="dispatch-label" htmlFor="hero-route-origin">Pickup &amp; destination</label>
   <div className="dispatch-route-fields"><label className="dispatch-select"><Icon name="pin" size={15}/><select id="hero-route-origin" value={origin} onChange={e=>setOrigin(e.target.value)}>{zones.map(zone=><option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label><span className="dispatch-route-separator" aria-hidden="true"><Icon name="arrow" size={14}/></span><label className="dispatch-select"><Icon name="globe" size={15}/><select aria-label="Drop-off zone" value={destination} onChange={e=>setDestination(e.target.value)}>{zones.map(zone=><option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label></div>
   <button className="dispatch-submit" type="submit">See my estimate<Icon name="arrow" size={15}/></button>
  </form>}
  </div>
  <div className="dispatch-route-art" aria-hidden="true"><span className="dispatch-route-node"/><span className="dispatch-route-dash"/><span className="dispatch-route-node is-end"/><span className="dispatch-route-caption">Calabar, Cross River</span><span className="dispatch-route-estimate">12 local zones</span></div>
 </aside>;
}

function HomePage({content,navigate}){
 const [reviewIndex,setReviewIndex]=useState(0);
 const review=testimonials[reviewIndex%testimonials.length];
 const featuredServices=services;
 const moveReview=direction=>setReviewIndex(index=>(index+direction+testimonials.length)%testimonials.length);
 const announcement=content?.banners?.[0];
 return <section className="home-stage">
  <div className="home-stage-atmosphere" aria-hidden="true"/>
  <div className="home-shell">
   <section className="home-hero" aria-labelledby="home-title">
    <img className="home-hero-photo" src="/images/hero-coastal-logistics.jpg" alt="A container vessel travelling along the coast at first light" fetchPriority="high"/>
    <div className="home-hero-shade" aria-hidden="true"/>
    <div className="home-hero-grid" aria-hidden="true"/>
    <div className="home-hero-content">
     <div className="home-hero-copy">
      <p className="home-kicker"><span className="home-kicker-dot"/>Calabar, in motion <span className="home-kicker-divider">/</span> Cross River State</p>
      <h1 id="home-title">Move your day.<br/><span>We’ll move the rest.</span></h1>
      <p className="home-hero-lede">Thoughtful delivery for the way Calabar lives and works — from one parcel across town to a market list, a business fleet or a waybill out of the city.</p>
      <div className="home-hero-actions"><button type="button" className="home-button home-button-primary" onClick={()=>navigate('/quote')}>Get a delivery quote<Icon name="arrow" size={16}/></button><button type="button" className="home-button home-button-quiet" onClick={()=>navigate('/services')}>Explore our services<Icon name="chevron" size={14}/></button></div>
      <div className="home-hero-footnote"><span className="home-footnote-mark"><Icon name="pin" size={14}/></span><span>Local knowledge. Clear fares. A real dispatch desk.</span></div>
     </div>
     <ScrollReveal className="home-dispatch-reveal" delay={160}><DispatchPanel navigate={navigate}/></ScrollReveal>
    </div>
    <div className="home-hero-bottom"><span>Local roots <i/> Wider reach</span><span className="home-scroll-cue"><span/>Scroll to explore</span></div>
   </section>

   <div className="home-trust-strip"><div className="home-trust-intro"><span>Built around your day</span><p>Good logistics should feel effortless.</p></div><div className="home-trust-list"><span><Icon name="bike" size={17}/>Calabar-based riders</span><span><Icon name="spark" size={17}/>Fares before you book</span><span><Icon name="support" size={17}/>One desk that answers</span><span><Icon name="box" size={17}/>Every handoff tracked</span></div></div>

   {announcement&&<button type="button" disabled={!announcement.link} onClick={()=>announcement.link&&navigate(announcement.link)} className="home-announcement"><span className="home-announcement-label">Dispatch note</span><span className="home-announcement-title">{announcement.heading}</span>{announcement.description&&<span className="home-announcement-description">{announcement.description}</span>}<Icon name="arrow" size={15}/></button>}

   <section className="home-story-section">
    <div className="home-section-wrap home-story-grid">
     <ScrollReveal className="home-story-copy"><p className="home-eyebrow">More than a delivery app</p><h2 className="home-section-title">A little more time<br/><em>for what matters.</em></h2><p className="home-section-lede">We bring the rider, the runner and the dispatch desk together — so you can send a parcel, shop a market or keep a business moving without chasing every handoff.</p><button type="button" className="home-text-link" onClick={()=>navigate('/about')}>Meet your local logistics team<Icon name="arrow" size={15}/></button><div className="home-story-note"><span className="home-note-icon"><Icon name="check" size={16}/></span><p><strong>Built for Calabar.</strong><br/>From Marian Road to the streets you know by name.</p></div></ScrollReveal>
     <ScrollReveal className="home-photo-collage" delay={130}>
      <div className="home-photo-tall"><img src="/images/hero-courier.jpg" alt="A DigiTrans rider ready to take a delivery across Calabar" loading="lazy"/><span className="home-photo-caption"><Icon name="bike" size={14}/>Your city. Your riders.</span></div>
      <div className="home-photo-stack"><div className="home-photo-short"><img src="/images/depot.jpg" alt="DigiTrans riders and dispatch team preparing deliveries" loading="lazy"/><span className="home-photo-overlay">Ready at the depot</span></div><div className="home-photo-short home-photo-market"><img src="/images/market-run.jpg" alt="A local market run being prepared" loading="lazy"/><span className="home-photo-overlay">Markets, made simpler</span></div></div>
      <div className="home-floating-tag"><span><Icon name="route" size={18}/></span><div><b>One connected journey</b><small>Book · move · follow through</small></div></div>
     </ScrollReveal>
    </div>
   </section>

   <section className="home-services-section">
    <div className="home-section-wrap">
     <ScrollReveal className="home-section-heading"><div><p className="home-eyebrow">Your delivery, your way</p><h2 className="home-section-title">One local team.<br/><em>Every kind of move.</em></h2></div><p className="home-section-lede">Choose a service built for the trip. Every fare is clear before you confirm.</p></ScrollReveal>
     <div className="home-services-grid">{featuredServices.map((service,index)=><ScrollReveal key={service.slug} className="home-service-reveal" delay={Math.min(index*70,350)}><button type="button" className="home-service-card" onClick={()=>navigate(`/services/${service.slug}`)}><div className="home-service-image"><img src={service.image} alt={service.name} loading="lazy"/><span className="home-service-number">0{index+1}</span><span className="home-service-price">{service.priceFrom}</span><span className="home-service-image-glow"/></div><div className="home-service-details"><span className="home-service-icon"><Icon name={service.icon} size={18}/></span><div className="home-service-title-group"><h3>{service.name}</h3><p>{service.short}</p></div><span className="home-service-arrow"><Icon name="arrow" size={15}/></span></div><div className="home-service-footer"><span>{service.turnaround}</span><span>Explore service</span></div></button></ScrollReveal>)}</div>
     <div className="home-services-foot"><span><Icon name="shield" size={15}/>The fare you see is the fare you confirm.</span><button type="button" onClick={()=>navigate('/pricing')}>See the full rate card<Icon name="arrow" size={14}/></button></div>
    </div>
   </section>

   <section className="home-operations-section">
    <div className="home-operations-photo"><img src="/images/depot.jpg" alt="The DigiTrans delivery fleet and team at the Calabar depot" loading="lazy"/><div className="home-operations-photo-shade"/><div className="home-depot-label"><span className="home-live-dot"/>Marian Road dispatch</div></div>
    <div className="home-operations-copy"><p className="home-eyebrow home-eyebrow-light">Accountable, all the way</p><h2 className="home-section-title">A local operator.<br/><em>Not a black box.</em></h2><p className="home-operations-lede">We bring people and technology together at every step. Know what is happening, what it costs and who to call if you need us.</p><div className="home-proof-grid"><div><b>{zones.length.toString().padStart(2,'0')}</b><span>Calabar delivery zones</span></div><div><b>{featuredServices.length.toString().padStart(2,'0')}</b><span>Ways to get it moving</span></div><div><b>01</b><span>Local dispatch team</span></div></div><button type="button" className="home-text-link home-text-link-light" onClick={()=>navigate('/coverage')}>Explore our coverage<Icon name="arrow" size={15}/></button></div>
   </section>

   <section className="home-testimonial-section">
    <div className="home-section-wrap home-testimonial-grid"><ScrollReveal><p className="home-eyebrow">The word on the street</p><h2 className="home-section-title">Trust is in<br/><em>the handoff.</em></h2><p className="home-section-lede">A delivery is not done when it leaves us. It is done when it reaches the right person, with a clear record of the journey.</p><div className="home-review-controls"><button type="button" onClick={()=>moveReview(-1)} aria-label="Previous customer story"><Icon name="arrow" size={16} className="rotate-180"/></button><span>{String(reviewIndex+1).padStart(2,'0')} <i/> {String(testimonials.length).padStart(2,'0')}</span><button type="button" onClick={()=>moveReview(1)} aria-label="Next customer story"><Icon name="arrow" size={16}/></button></div></ScrollReveal><ScrollReveal className="home-quote-card" delay={100}><div className="home-quote-mark">“</div><blockquote key={review.name} aria-live="polite">{review.quote}</blockquote><div className="home-quote-footer"><div className="home-quote-avatar"><img src="/images/rider-portrait.jpg" alt="" loading="lazy"/></div><div><b>{review.name}</b><span>{review.role}</span></div><span className="home-quote-detail">{review.detail}</span></div></ScrollReveal></div>
   </section>

   <section className="home-insights-section"><div className="home-section-wrap"><ScrollReveal className="home-insights-heading"><div><p className="home-eyebrow">From the dispatch desk</p><h2 className="home-section-title">A few useful notes.</h2></div><button type="button" className="home-text-link" onClick={()=>navigate('/insights')}>All insights<Icon name="arrow" size={14}/></button></ScrollReveal><div className="home-insights-grid">{articles.slice(0,2).map((article,index)=><ScrollReveal key={article.slug} className="home-insight-reveal" delay={index*100}><article className="home-insight-card"><img src={article.image} alt={article.imageAlt} loading="lazy"/><div><span>{article.category} <i/> {article.readTime}</span><h3>{article.title}</h3><p>{article.excerpt}</p><button type="button" onClick={()=>navigate(`/insights/${article.slug}`)}>Read the note<Icon name="arrow" size={14}/></button></div></article></ScrollReveal>)}</div></div></section>

   <section className="home-bottom-cta"><div className="home-bottom-cta-image"><img src="/images/street-wide.jpg" alt="A DigiTrans rider moving through the city at dusk" loading="lazy"/></div><div className="home-bottom-cta-shade"/><div className="home-bottom-cta-content"><p className="home-eyebrow home-eyebrow-light">Your next delivery starts here</p><h2>Make room for<br/><em>what’s next.</em></h2><p>Get a clear estimate, then leave the moving to us.</p><div><button type="button" className="home-button home-button-primary" onClick={()=>navigate('/quote')}>Get a delivery quote<Icon name="arrow" size={15}/></button><button type="button" className="home-button home-button-quiet" onClick={()=>navigate('/contact')}>Talk to dispatch</button></div></div></section>
   <div className="home-shell-end"><span>DigiTrans Logistics</span><span>Calabar · Cross River State</span><span>Keep every journey moving.</span></div>
  </div>
 </section>;
}

export default HomePage;
