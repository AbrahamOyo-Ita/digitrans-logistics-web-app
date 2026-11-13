import React,{useEffect,useRef,useState} from 'react';

export default function ScrollReveal({as:Element='div',children,className='',delay=0,style={},...props}){
 const elementRef=useRef(null),[visible,setVisible]=useState(false);
 useEffect(()=>{
  const element=elementRef.current;
  if(!element)return;
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion||!('IntersectionObserver' in window)){
   setVisible(true);
   return;
  }
  const observer=new IntersectionObserver(([entry])=>{
   if(entry.isIntersecting){setVisible(true);observer.unobserve(element);}
  },{threshold:0.12,rootMargin:'0px 0px -48px 0px'});
  observer.observe(element);
  return()=>observer.disconnect();
 },[]);
 return <Element ref={elementRef} className={`scroll-reveal ${visible?'is-visible':''} ${className}`.trim()} style={{'--reveal-delay':`${delay}ms`,...style}} {...props}>{children}</Element>;
}
