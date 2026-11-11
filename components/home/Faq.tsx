"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { faqs } from "@/lib/content";
import { cn } from "@/lib/cn";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faqs" className="section bg-white">
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <h2 className="display-2 max-w-[14ch]">Questions we get.</h2>
          <p className="body-sm mt-5 max-w-sm">
            Still unsure? Our support desk answers on the phone and on WhatsApp during operating
            hours.
          </p>
          <Link href="/contact" className="link-underline mt-6">
            Contact support
          </Link>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <div className="border-t border-line">
            {faqs.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div key={faq.q} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-6 py-5 text-left"
                  >
                    <span className={cn("text-[0.9375rem] font-medium leading-snug", isOpen ? "text-navy" : "text-navy/90")}>
                      {faq.q}
                    </span>
                    <span className="mt-0.5 shrink-0 text-muted">
                      {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                  <div
                    className={cn(
                      "grid overflow-hidden transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <p className="overflow-hidden pb-5 pr-10 text-[0.875rem] leading-relaxed text-slate-ink">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
