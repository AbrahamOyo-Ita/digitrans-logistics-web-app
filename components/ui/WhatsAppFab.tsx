"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/lib/content";
import { cn } from "@/lib/cn";

export function WhatsAppFab() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/quote")) return null;

  return (
    <a
      href={site.whatsappHref}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-navy py-3 pl-3 pr-4 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(10,27,53,0.9)] transition-all duration-300 hover:bg-navy-700",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
      aria-label="Chat with DigiTrans on WhatsApp"
    >
      <span className="grid size-7 place-items-center rounded-full bg-[#25D366] text-navy">
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.5-.9-2.1-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.8 2.8 4.4 3.8 2.6 1 2.6.7 3.1.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.1-.5-.2Z" />
          <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .9.9-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
        </svg>
      </span>
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}
