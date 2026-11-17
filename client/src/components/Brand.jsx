import React from 'react';

export default function Brand({navigate,onClick,variant='dark',className=''}){
 const light=variant==='light';
 const activate=onClick||(()=>navigate?.('/'));
 return <button type="button" onClick={activate} aria-label="DigiTrans Logistics — home" className={`inline-flex items-center gap-2.5 text-left ${className}`}>
  <span aria-hidden="true" className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${light?'bg-white/10 ring-1 ring-white/20':'bg-cyan ring-1 ring-cyan'}`}>
   <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
    <path d="M2.6 7.4A2.4 2.4 0 0 1 5 5h6.2a2 2 0 0 1 0 4H7.8v6a2 2 0 0 0 2 2h4.6a2 2 0 0 1 0 4H9.8A6 6 0 0 1 3.8 15V8.2a1 1 0 0 1 0-.8Z" fill="#fff" />
    <path d="M21.2 12.6a2.4 2.4 0 0 1-2.4 2.4h-4.9a2 2 0 0 1 0-4h2.3V7a2 2 0 0 0-2-2h-3.9a2 2 0 0 1 0-4h5.9a5 5 0 0 1 5 5v6.6Z" fill="#0B1B2B" />
   </svg>
  </span>
  <span className={`font-display text-[1.35rem] font-semibold leading-none tracking-[-.045em] ${light?'text-white':'text-navy'}`}>Digi<span className="text-cyan">trans</span></span>
  <span aria-hidden="true" className={`hidden h-3 w-px self-center sm:block ${light?'bg-white/25':'bg-line-strong'}`} />
  <span className={`hidden text-[.625rem] font-medium uppercase leading-none tracking-[.22em] sm:block ${light?'text-white/55':'text-muted'}`}>Logistics</span>
 </button>;
}
