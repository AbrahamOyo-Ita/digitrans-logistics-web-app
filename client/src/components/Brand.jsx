import React from 'react';

export default function Brand({navigate,onClick,className=''}){
 const activate=onClick||(()=>navigate?.('/'));
 return <button type="button" onClick={activate} aria-label="DigiTrans Logistics — home" className={`inline-flex items-center text-left ${className}`}>
  <span className="rounded-lg bg-white px-2 py-1.5 shadow-sm ring-1 ring-black/5">
   <img src="/images/Digitrans_Logo.jpeg" alt="DigiTrans Delivery & Logistics" className="h-9 w-auto max-w-[190px] object-contain sm:h-10" />
  </span>
 </button>;
}
