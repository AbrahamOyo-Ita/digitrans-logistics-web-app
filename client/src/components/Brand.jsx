import React from 'react';
import AppLink from './AppLink';
import Picture from './Picture';

export default function Brand({ navigate, onClick, className = '' }) {
  const inner = (
    <span className="rounded-lg bg-white px-2 py-1.5 shadow-sm ring-1 ring-black/5">
      <Picture
        src="/images/Digitrans_Logo.jpeg"
        alt="DigiTrans Delivery & Logistics"
        sizes="190px"
        loading="eager"
        decoding="async"
        className="h-9 w-auto max-w-[190px] object-contain sm:h-10"
      />
    </span>
  );

  if (onClick && !navigate) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="DigiTrans Logistics - home"
        className={`inline-flex items-center text-left ${className}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <AppLink
      href="/"
      navigate={navigate}
      onClick={onClick}
      aria-label="DigiTrans Logistics - home"
      className={`inline-flex items-center text-left ${className}`}
    >
      {inner}
    </AppLink>
  );
}
