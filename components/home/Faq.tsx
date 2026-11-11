"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Minus, Plus } from "lucide-react";
import { faqs } from "@/lib/content";
import { cn } from "@/lib/cn";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faqs" className="section-pad bg-mist">
      <div className="container-x grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <div>
          <p className="eyebrow">
            <span className="h-px w-6 bg-cyan" /> Questions
          </p>
          <h2 className="display-2 mt-3 text-navy">Straight answers.</h2>
          <p className="lede mt-4">
            Still stuck? Our Calabar support desk answers on WhatsApp and phone during operating hours.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan transition hover:text-cyan-600"
          >
            Talk to support <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-5 px-5 py-4.5 text-left transition hover:bg-mist/60"
                >
                  <span className={cn("text-[0.9375rem] font-semibold leading-snug", isOpen ? "text-cyan-600" : "text-navy")}>
                    {faq.q}
                  </span>
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border transition",
                      isOpen ? "border-cyan bg-cyan text-white" : "border-line text-muted"
                    )}
                  >
                    {isOpen ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                  </span>
                </button>
                <div
                  className={cn(
                    "grid overflow-hidden transition-all duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <p className="overflow-hidden px-5 pb-5 pr-14 text-[0.875rem] leading-relaxed text-slate-ink">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
