"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { testimonials } from "@/lib/content";
import { cn } from "@/lib/cn";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 7000);
    return () => window.clearInterval(id);
  }, [paused]);

  const active = testimonials[index];

  return (
    <section className="section-pad bg-white">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">
              <span className="h-px w-6 bg-cyan" /> In their words
            </p>
            <h2 className="display-2 mt-3 text-navy">
              4.9 average from <span className="text-cyan">1,700+</span> rated deliveries.
            </h2>
            <p className="lede mt-4">
              Only customers with a completed trip can rate — one review per delivery, verified by
              tracking reference.
            </p>

            <div className="mt-7 flex items-center gap-4 rounded-xl border border-line bg-mist p-4">
              <div className="font-display text-3xl font-bold tracking-tight text-navy">4.9</div>
              <div>
                <div className="flex gap-0.5 text-cyan">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-1 text-[0.75rem] text-muted">Across standard, market run &amp; waybill trips</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
                className="grid size-10 place-items-center rounded-full border border-line text-navy transition hover:border-navy/30 hover:bg-mist"
                aria-label="Previous review"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
                className="grid size-10 place-items-center rounded-full border border-line text-navy transition hover:border-navy/30 hover:bg-mist"
                aria-label="Next review"
              >
                <ChevronRight className="size-4" />
              </button>
              <span className="ml-2 font-mono text-[0.75rem] text-muted">
                {String(index + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div className="relative overflow-hidden rounded-2xl border border-line bg-navy p-6 text-white shadow-[var(--shadow-lift)] sm:p-9">
              <div className="absolute inset-0 grid-lines opacity-25" aria-hidden />
              <Quote className="absolute right-6 top-6 size-16 text-white/6" aria-hidden />
              <div className="relative">
                <div className="flex gap-0.5 text-cyan-300">
                  {Array.from({ length: active.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote key={active.name} className="mt-5 animate-fade font-display text-[1.15rem] font-medium leading-relaxed tracking-tight sm:text-[1.35rem]">
                  “{active.quote}”
                </blockquote>
                <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
                  <span className="grid size-11 place-items-center rounded-full bg-cyan/15 font-display text-sm font-bold text-cyan-300 ring-1 ring-inset ring-cyan-300/20">
                    {active.initials}
                  </span>
                  <div>
                    <p className="text-[0.9375rem] font-semibold text-white">{active.name}</p>
                    <p className="text-[0.75rem] text-white/55">{active.role}</p>
                  </div>
                  <span className="ml-auto hidden rounded-full border border-white/12 px-2.5 py-1 text-[0.625rem] text-white/50 sm:inline-flex">
                    {active.detail}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {testimonials.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show review from ${t.name}`}
                  aria-pressed={i === index}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all",
                    i === index ? "bg-cyan" : "bg-line hover:bg-navy/25"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
