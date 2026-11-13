import React,{useEffect,useState} from 'react';
import {api} from '../lib/api';
import {articles,services} from './publicContent';
import PublicPages from './PublicPages';
import {SiteFooter,SiteHeader} from './publicUI';

export default function PublicSite({page='/',navigate,onLogin,user}){
 const [content,setContent]=useState({faqs:[],banners:[],zones:[],settings:{}});
 useEffect(()=>{let live=true;api('/public/content').then(data=>{if(live)setContent(data);}).catch(()=>{});return()=>{live=false;};},[]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'smooth'});},[page]);
 useEffect(()=>{
  const serviceSlug=page.startsWith('/services/')?page.slice('/services/'.length):({ '/local-delivery':'standard-delivery','/intercity-delivery':'waybills','/market-runs':'market-runs','/student-delivery':'student-delivery','/business':'business-logistics' }[page]);
  const service=services.find(item=>item.slug===serviceSlug);
  const article=page.startsWith('/insights/')?articles.find(item=>item.slug===page.slice('/insights/'.length)):null;
  const meta={
   '/':['Delivery, market runs & waybills in Calabar','Same-day delivery, market runs, waybills and business dispatch across Calabar. Fares quoted before you book, live tracking and local support.'],
   '/services':['Services','Six DigiTrans services in Calabar: standard delivery, market runs, waybills, business dispatch, student delivery and scheduled pickups.'],
   '/pricing':['Pricing & tariffs','Published DigiTrans tariffs for local delivery, Market Runs, waybills and verified student trips in Calabar.'],
   '/coverage':['Coverage across Calabar','Delivery zones across Calabar Municipality, Calabar South and Akpabuyo, plus supported waybill routes beyond the city.'],
   '/about':['About DigiTrans','DigiTrans Logistics is a Calabar-built delivery company with local riders, market runners and a dispatch desk that answers.'],
   '/contact':['Contact & support','Reach the DigiTrans dispatch desk in Calabar for delivery support, vendor onboarding, rider applications and service questions.'],
   '/quote':['Book a delivery','Build a delivery estimate and request a rider anywhere in Calabar. Base fee, distance and extras shown before you confirm.'],
   '/track':['Track a delivery','Track a DigiTrans delivery or waybill using its reference number.'],
   '/insights':['Insights from the dispatch desk','Practical writing about delivery pricing, market runs and waybills in Calabar.'],
   '/login':['Sign in','Sign in to your DigiTrans workspace.'],
   '/register':['Create an account','Create a DigiTrans account for delivery, rider, business or investor services.'],
  }[page]||['DigiTrans Logistics','Delivery, market runs and waybills across Calabar.'];
  const title=service?`${service.name} in Calabar`:article?`${article.title} | DigiTrans Logistics`:meta[0];
  const description=service?service.blurb:article?article.excerpt:meta[1];
  document.title=page==='/'?'DigiTrans Logistics - Delivery, market runs & waybills in Calabar':article?`${article.title} | DigiTrans Logistics`:`${title} · DigiTrans Logistics`;
  let descriptionTag=document.querySelector('meta[name="description"]');
  if(descriptionTag)descriptionTag.setAttribute('content',description);
 },[page]);
 const book=target=>user?navigate(target):onLogin(target);
 return <div className="min-h-screen bg-white text-navy"><SiteHeader page={page} navigate={navigate} onLogin={onLogin} user={user}/><main id="main"><PublicPages page={page} content={content} navigate={navigate} onLogin={onLogin} user={user} book={book}/></main><SiteFooter navigate={navigate} onLogin={onLogin} user={user}/></div>;
}
