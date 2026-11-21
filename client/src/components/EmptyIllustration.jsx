import React from 'react';

const variants=new Set(['delivery','market','earnings','updates','insights','documents','people','search','support','rider','messages','schedule','activity','offline','parcel']);

export default function EmptyIllustration({variant='parcel',className=''}){
 const kind=variants.has(variant)?variant:'parcel';
 return <svg className={`empty-art empty-art--${kind} ${className}`} viewBox="0 0 220 150" fill="none" aria-hidden="true" focusable="false">
  <circle cx="110" cy="70" r="53" fill="#edf7f4"/>
  <path d="M24 119h172" stroke="#dbe9e5" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 7"/>
  <ellipse cx="110" cy="120" rx="54" ry="7" fill="#dcebe6"/>
  <g className="empty-art-sparkle" fill="#ed9874">
   <path d="m42 44 2.2 6.4 6.3 2.1-6.3 2.2-2.2 6.3-2.1-6.3-6.4-2.2 6.4-2.1L42 44Z"/>
   <circle cx="177" cy="80" r="3"/>
  </g>
  {kind==='offline'?<g>
   <path className="empty-art-route" d="M34 102c20-16 31-3 46-15" stroke="#79b9ad" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 7"/>
   <circle cx="32" cy="103" r="5" fill="#f28e6a"/>
   <g className="empty-art-character empty-art-bob">
    <path d="M88 83c-2-13 2-23 10-28l9-5 18 4c10 4 15 14 15 29v16H88V83Z" fill="#153d4d"/>
    <path d="m101 63-18 12-13-2" stroke="#153d4d" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m127 63 14 9 10-4" stroke="#153d4d" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m101 96-5 17m30-17 7 17" stroke="#153d4d" strokeWidth="8" strokeLinecap="round"/>
    <circle cx="111" cy="42" r="14" fill="#efc19f"/>
    <path d="M97 42c.3-12 7-20 18-20 9 0 16 7 16 18l-5-3-7-8c-4 6-12 10-22 10v3Z" fill="#0e7c8b"/>
    <path d="M98 37c4-13 12-19 23-17 7 1 11 6 13 13-10-4-22-2-36 4Z" fill="#ef8a68"/>
    <path d="M108 45h.1" stroke="#183748" strokeWidth="2.5" strokeLinecap="round"/>
   </g>
   <g className="empty-art-signal empty-art-float-slow" stroke="#df785f" strokeWidth="3" strokeLinecap="round">
    <path d="M155 47a30 30 0 0 1 20 28" opacity=".35"/>
    <path d="M162 55a20 20 0 0 1 12 18" opacity=".65"/>
    <path d="m151 50 25 29" stroke="#e47c61" strokeWidth="4"/>
    <circle cx="177" cy="84" r="3.5" fill="#e47c61" stroke="none"/>
   </g>
   <g className="empty-art-floating-dot"><circle cx="67" cy="54" r="8" fill="#fff"/><path d="m64 51 6 6m0-6-6 6" stroke="#df785f" strokeWidth="1.8" strokeLinecap="round"/></g>
  </g>:kind==='market'?<g className="empty-art-float">
   <path d="M68 60h84l-7 49H76l-8-49Z" fill="#fff" stroke="#d4e4de" strokeWidth="2"/>
   <path d="M88 61c0-13 6-21 16-21s16 8 16 21" stroke="#14868a" strokeWidth="5" strokeLinecap="round"/>
   <path d="m69 69 82 0" stroke="#e6efeb" strokeWidth="2"/>
   <path d="M87 59c-4-13 2-22 13-24 5 11 2 19-7 26" fill="#72aa75"/>
   <path d="M102 59c1-13 9-20 21-18 0 12-7 20-19 22" fill="#4b9669"/>
   <circle cx="128" cy="60" r="9" fill="#f3b34d"/><path d="m125 53 5-4" stroke="#74a76d" strokeWidth="3" strokeLinecap="round"/>
   <circle cx="81" cy="80" r="7" fill="#e8876c"/><circle cx="139" cy="82" r="8" fill="#e5a34c"/>
   <path d="M92 81h22m-22 8h13" stroke="#b8d2c8" strokeWidth="3" strokeLinecap="round"/>
  </g>:kind==='earnings'?<g>
   <g className="empty-art-float">
    <rect x="62" y="51" width="96" height="61" rx="13" fill="#173b4b"/>
    <path d="M63 64h89" stroke="#5d7b80" strokeWidth="2"/>
    <path d="M62 75h75a10 10 0 0 1 10 10v13a10 10 0 0 1-10 10H72a10 10 0 0 1-10-10V75Z" fill="#fff" stroke="#d6e5df" strokeWidth="2"/>
    <path d="M122 82h35v22h-35a9 9 0 0 1-9-9v-4a9 9 0 0 1 9-9Z" fill="#eaf5f1" stroke="#cfe2da" strokeWidth="2"/>
    <circle cx="132" cy="93" r="3" fill="#12858b"/>
   </g>
   <g className="empty-art-coin empty-art-float-slow"><circle cx="73" cy="47" r="15" fill="#f2b650"/><circle cx="73" cy="47" r="10" stroke="#fff2c9" strokeWidth="2"/><path d="M73 40v14m4-11c-1-2-7-3-8 0-2 4 8 3 8 7 0 3-5 5-9 2" stroke="#fff8dc" strokeWidth="1.8" strokeLinecap="round"/></g>
   <circle cx="159" cy="48" r="9" fill="#f28e6a"/><path d="M159 43v10m3-8c-.5-1-5-2-6 0-1 3 6 2 6 5 0 2-4 3-7 1" stroke="#fff1e9" strokeWidth="1.3" strokeLinecap="round"/>
  </g>:kind==='updates'?<g>
   <g className="empty-art-pulse"><circle cx="111" cy="70" r="38" stroke="#8bc9bc" strokeWidth="2" strokeDasharray="3 6"/></g>
   <g className="empty-art-float">
    <path d="M77 91h69l-8-10V64c0-15-10-26-26-26S86 49 86 64v17l-9 10Z" fill="#fff" stroke="#d0e2dc" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M101 98c2 8 6 12 11 12s9-4 11-12" stroke="#0e7c8b" strokeWidth="4" strokeLinecap="round"/>
    <path d="M98 70h26m-26 9h17" stroke="#c1d9d0" strokeWidth="3" strokeLinecap="round"/>
   </g>
   <g className="empty-art-floating-dot"><circle cx="151" cy="44" r="11" fill="#f28e6a"/><path d="M151 38v7m0 4h.1" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></g>
  </g>:kind==='insights'?<g className="empty-art-float">
   <rect x="62" y="34" width="96" height="78" rx="11" fill="#fff" stroke="#d1e2dc" strokeWidth="2"/>
   <path d="M78 94V79h11v15m8 0V66h11v28m8 0V55h11v39m8 0V72h11v22" fill="#a5d6ca"/>
   <path d="m78 75 18-13 14 5 21-21 12 7" stroke="#0f7c84" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
   <circle cx="143" cy="53" r="4" fill="#f28e6a"/>
   <path d="M78 102h67" stroke="#e5efeb" strokeWidth="2"/>
  </g>:kind==='documents'?<g className="empty-art-float">
   <path d="M78 31h48l20 20v66a8 8 0 0 1-8 8H78a8 8 0 0 1-8-8V39a8 8 0 0 1 8-8Z" fill="#fff" stroke="#d1e2dc" strokeWidth="2.5"/>
   <path d="M126 32v20h19" stroke="#d1e2dc" strokeWidth="2.5" strokeLinejoin="round"/>
   <path d="M87 67h45m-45 12h31m-31 12h23" stroke="#adc9bf" strokeWidth="4" strokeLinecap="round"/>
   <circle cx="135" cy="99" r="16" fill="#e4f4ed"/><path d="m127 99 5 5 10-11" stroke="#128475" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </g>:kind==='people'?<g className="empty-art-float">
   <circle cx="94" cy="55" r="15" fill="#efc19f"/><circle cx="132" cy="58" r="13" fill="#e9b68f"/>
   <path d="M77 53c1-13 9-20 19-20 9 0 16 6 17 17-10 1-18-2-24-8-3 5-7 8-12 11Z" fill="#0e7c8b"/>
   <path d="M120 55c1-11 7-17 14-17 8 0 14 6 15 17-9-1-16-4-20-9-2 5-5 8-9 9Z" fill="#f28e6a"/>
   <path d="M68 111c1-24 11-39 28-39 18 0 28 15 29 39H68Zm52 0c1-21 8-34 22-34 13 0 21 13 22 34h-44Z" fill="#173b4b"/>
   <path d="m93 74 11 18 10-18" fill="#fff"/>
   <circle cx="166" cy="50" r="8" fill="#f3b750"/>
  </g>:kind==='search'?<g className="empty-art-float">
   <rect x="63" y="49" width="72" height="59" rx="10" fill="#fff" stroke="#d1e2dc" strokeWidth="2"/>
   <path d="M76 65h39m-39 10h26m-26 10h18" stroke="#b7d1c7" strokeWidth="3" strokeLinecap="round"/>
   <circle cx="139" cy="81" r="21" fill="#d9f0e9" stroke="#0e7c8b" strokeWidth="4"/>
   <path d="m154 97 15 15" stroke="#0e7c8b" strokeWidth="7" strokeLinecap="round"/>
   <circle cx="139" cy="81" r="8" fill="#fff"/>
  </g>:kind==='support'?<g className="empty-art-float">
   <circle cx="108" cy="68" r="27" fill="#efc19f"/>
   <path d="M80 66c0-21 12-34 29-34s29 13 29 34" stroke="#173b4b" strokeWidth="8" strokeLinecap="round"/>
   <rect x="74" y="61" width="13" height="26" rx="6" fill="#0e7c8b"/><rect x="138" y="61" width="13" height="26" rx="6" fill="#0e7c8b"/>
   <path d="M143 84v9c0 8-7 13-16 13h-7" stroke="#0e7c8b" strokeWidth="4" strokeLinecap="round"/>
   <circle cx="118" cy="109" r="4" fill="#f28e6a"/>
   <path d="M145 35h23a9 9 0 0 1 9 9v10a9 9 0 0 1-9 9h-9l-7 7v-7h-7a9 9 0 0 1-9-9V44a9 9 0 0 1 9-9Z" fill="#fff" stroke="#d4e5de" strokeWidth="2"/>
   <circle cx="152" cy="49" r="2" fill="#0e7c8b"/><circle cx="160" cy="49" r="2" fill="#0e7c8b"/><circle cx="168" cy="49" r="2" fill="#0e7c8b"/>
  </g>:kind==='messages'?<g className="empty-art-float">
   <path d="M58 51a12 12 0 0 1 12-12h69a12 12 0 0 1 12 12v38a12 12 0 0 1-12 12H98l-23 15v-15h-5a12 12 0 0 1-12-12V51Z" fill="#fff" stroke="#d2e3dd" strokeWidth="2.5"/>
   <path d="m77 61 29 22 29-22" stroke="#0e7c8b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
   <circle cx="157" cy="90" r="12" fill="#e4f4ed"/><path d="m151 90 4 4 8-9" stroke="#128475" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </g>:kind==='schedule'?<g className="empty-art-float">
   <rect x="64" y="39" width="93" height="75" rx="11" fill="#fff" stroke="#d1e2dc" strokeWidth="2.5"/>
   <path d="M64 58h93" stroke="#d1e2dc" strokeWidth="2.5"/><path d="M87 34v12m47-12v12" stroke="#0e7c8b" strokeWidth="4" strokeLinecap="round"/>
   <path d="M80 73h9m13 0h9m13 0h9M80 91h9m13 0h9" stroke="#a5c7bb" strokeWidth="6" strokeLinecap="round"/>
   <circle cx="140" cy="91" r="12" fill="#f28e6a"/><path d="m136 91 3 3 6-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </g>:kind==='activity'?<g className="empty-art-float">
   <rect x="68" y="28" width="84" height="89" rx="11" fill="#fff" stroke="#d1e2dc" strokeWidth="2.5"/>
   <path d="M86 28v-5h48v5" stroke="#0e7c8b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="M87 50h45m-45 20h36m-36 20h42" stroke="#c0d8ce" strokeWidth="3" strokeLinecap="round"/>
   <path d="M78 50h.1m0 20h.1m0 20h.1" stroke="#e88b6c" strokeWidth="5" strokeLinecap="round"/>
   <circle cx="145" cy="95" r="17" fill="#e6f4ed"/>
   <path d="m137 95 5 5 10-11" stroke="#128475" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </g>:kind==='rider'?<g className="empty-art-float">
   <circle cx="83" cy="100" r="17" fill="#fff" stroke="#173b4b" strokeWidth="4"/><circle cx="145" cy="100" r="17" fill="#fff" stroke="#173b4b" strokeWidth="4"/>
   <path d="m83 99 20-33 15 34H83l14-21h27l21 21m-37-34h-9" stroke="#0e7c8b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
   <circle cx="114" cy="41" r="11" fill="#efc19f"/><path d="M102 41c1-11 6-17 15-17 8 0 14 6 15 16h-30Z" fill="#f28e6a"/>
   <path d="m106 55 20 2 10 24-20 6-15-17 5-15Z" fill="#173b4b"/>
   <rect x="131" y="60" width="27" height="23" rx="4" fill="#f3b650"/><path d="m131 68 13 8 14-8m-14 8v7" stroke="#fff2cc" strokeWidth="2" strokeLinejoin="round"/>
  </g>:<g className="empty-art-float">
   <path d="m110 37 48 26v45l-48 25-48-25V63l48-26Z" fill="#fff" stroke="#cfe1da" strokeWidth="2.5" strokeLinejoin="round"/>
   <path d="m62 63 48 27 48-27M110 90v43" stroke="#0e7c8b" strokeWidth="3" strokeLinejoin="round"/>
   <path d="m92 47 47 26v19L92 66V47Z" fill="#f4b24e" opacity=".9"/>
   <circle cx="155" cy="47" r="11" fill="#f28e6a"/><path d="m150 47 4 4 7-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </g>}
 </svg>;
}
