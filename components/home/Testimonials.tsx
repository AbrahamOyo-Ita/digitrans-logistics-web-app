"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Eyebrow } from "@/components/ui/Bits";
import { testimonials } from "@/lib/content";

/**
 * Band 9 — testimonial slider: avatar, quote, controls on the right,
 * and a score panel with stars.
 */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const active = testimonials[index];

  const move = (step: number) =>
    setIndex((prev) => (prev + step + testimonials.length) % testimonials.length);

  return (
    <section className="section-tight bg-white">
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>What our clients say</Eyebrow>
            <h2 className="display-2 mt-3 max-w-[18ch]">Trusted by Calabar businesses.</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous testimonial"
              className="grid size-11 place-items-center rounded-full border border-line text-navy transition-colors hover:border-navy"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next testimonial"
              className="grid size-11 place-items-center rounded-full border border-line text-navy transition-colors hover:border-navy"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_0.4fr]">
          <figure className="rounded-[18px] border border-line bg-white p-6 shadow-[0_18px_50px_-38px_rgba(11,27,43,0.5)] sm:p-8">
            <div className="flex items-start gap-4">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-paper ring-1 ring-line">
                <Image
                  src="/images/rider-portrait.jpg"
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover object-[50%_25%]"
                />
              </span>
              <div className="min-w-0">
                <blockquote
                  aria-live="polite"
                  className="text-[0.9375rem] leading-relaxed text-slate-ink sm:text-[1rem]"
                >
                  “{active.quote}”
                </blockquote>
                <div className="mt-4 h-px w-10 bg-navy/25" />
                <figcaption className="mt-3">
                  <p className="text-[0.875rem] font-medium text-navy">{active.name}</p>
                  <p className="mt-0.5 text-[0.75rem] text-muted">{active.role}</p>
                </figcaption>
              </div>
            </div>
          </figure>

          <div className="flex flex-col justify-center rounded-[18px] border border-line bg-paper p-6">
            <div className="flex gap-1" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${i < active.rating ? "fill-[#C88A2E] text-[#C88A2E]" : "fill-line text-line"}`}
                />
              ))}
            </div>
            <p className="mt-3 font-display text-[1.75rem] font-semibold leading-none tracking-tight text-navy">
              4.9<span className="text-[1rem] font-medium text-muted">/5</span>
            </p>
            <p className="mt-2 text-[0.75rem] leading-relaxed text-muted">
              Average across 1,700 rated deliveries
            </p>
            <p className="mt-4 text-[0.75rem] text-muted">
              <span className="font-medium text-navy">{active.detail}</span>
            </p>
            <Link href="/contact#faqs" className="mt-4 text-[0.75rem] font-medium text-cyan hover:text-cyan-600">
              How reviews are verified →
            </Link>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-1.5">
          {testimonials.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show review from ${item.name}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-7 bg-navy" : "w-1.5 bg-line-strong hover:bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
