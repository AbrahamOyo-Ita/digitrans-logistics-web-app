"use client";

import { useState } from "react";
import { Check, Copy, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/cn";

const stages = [
  { key: "confirmed", label: "Confirmed", time: "09:12", note: "Booking accepted · payment held" },
  { key: "rider", label: "Rider assigned", time: "09:18", note: "Emeka · E-bike · CRD-114" },
  { key: "collected", label: "Picked up", time: "09:31", note: "Watt Market · 2 parcels scanned" },
  { key: "transit", label: "Out for delivery", time: "09:44", note: "En route to State Housing" },
  { key: "delivered", label: "Delivered", time: "10:02", note: "Received by A. Bassey · photo" },
];

const activeIndex = 3;

export function Tracking() {
  const [copied, setCopied] = useState(false);
  const reference = "DT-CAL-8842-5117";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="tracking" className="section-pad relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0 radial-glow opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" aria-hidden />

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow text-cyan-300">
            <span className="h-px w-6 bg-cyan-300" /> Live tracking
          </p>
          <h2 className="display-2 mt-3 text-white">
            Know where it is, <span className="text-cyan-300">before you ask.</span>
          </h2>
          <p className="lede mt-4 max-w-md text-white/70">
            Every status change carries a timestamp and the person responsible. Share one link with the
            recipient and stop fielding “where is my order?” calls.
          </p>

          <ul className="mt-7 space-y-3.5">
            {[
              { icon: MapPin, title: "Zone-accurate ETAs", body: "Fares and windows calculated from real Calabar routes." },
              { icon: Phone, title: "Masked rider contact", body: "Call your rider without exposing either phone number." },
              { icon: ShieldCheck, title: "Proof that stands up", body: "Photo, recipient name and signature on delivery." },
            ].map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/5 text-cyan-300">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-[0.9375rem] font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-white/55">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-[0.75rem] text-white/50">
            <span className="font-mono uppercase tracking-[0.14em]">{reference}</span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2 py-1 font-medium text-white/70 transition hover:border-cyan-300/50 hover:text-white"
            >
              {copied ? <Check className="size-3 text-cyan-300" /> : <Copy className="size-3" />}
              {copied ? "Copied" : "Copy reference"}
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-cyan/10 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-5 backdrop-blur-md sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Delivery in progress
                </p>
                <p className="mt-1 font-display text-lg font-semibold tracking-tight text-white">
                  Watt Market → State Housing
                </p>
                <p className="mt-0.5 text-[0.75rem] text-white/50">2 parcels · 6.4 km · arrived 10:02</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cyan/15 px-2.5 py-1 text-[0.7rem] font-semibold text-cyan-300 ring-1 ring-inset ring-cyan-300/25">
                <span className="relative size-1.5 rounded-full bg-cyan-300 pulse-ring" />
                On the move
              </span>
            </div>

            <div className="mt-6">
              <ol className="relative space-y-4">
                <span className="absolute left-[0.6875rem] top-2 bottom-4 w-px bg-white/12" aria-hidden />
                {stages.map((stage, i) => {
                  const done = i < activeIndex;
                  const active = i === activeIndex;
                  return (
                    <li key={stage.key} className="relative flex gap-3.5">
                      <span
                        className={cn(
                          "relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-[0.6rem] font-bold",
                          done && "border-cyan bg-cyan text-navy",
                          active && "border-cyan bg-navy text-cyan-300 ring-4 ring-cyan/20",
                          !done && !active && "border-white/20 bg-navy text-white/35"
                        )}
                      >
                        {done ? <Check className="size-3.5" strokeWidth={3.5} /> : active ? <Truck className="size-3" /> : i + 1}
                      </span>
                      <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
                        <p
                          className={cn(
                            "text-[0.875rem] font-medium",
                            active ? "text-white" : done ? "text-white/80" : "text-white/40"
                          )}
                        >
                          {stage.label}
                          {active && (
                            <span className="ml-2 rounded bg-cyan/15 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-cyan-300">
                              now
                            </span>
                          )}
                        </p>
                        <span className="font-mono text-[0.7rem] tabular-nums text-white/35">{stage.time}</span>
                        <p className="w-full text-[0.75rem] text-white/45">{stage.note}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-navy/60 p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-cyan/15 font-display text-xs font-bold text-cyan-300">
                  EO
                </span>
                <div>
                  <p className="text-[0.8125rem] font-semibold text-white">Emeka O.</p>
                  <p className="text-[0.6875rem] text-white/45">Rider · 4.9 ★ · 812 deliveries</p>
                </div>
              </div>
              <a
                href="tel:+2348012345678"
                className="grid size-9 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-cyan-300/50 hover:text-white"
                aria-label="Call rider"
              >
                <Phone className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
