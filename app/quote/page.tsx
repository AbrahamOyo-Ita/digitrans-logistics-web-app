import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { BookingForm } from "./BookingForm";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Get a quote & book a delivery",
  description:
    "Build a live delivery estimate in seconds and request a rider anywhere in Calabar. Transparent base, distance and surcharge pricing.",
};

export default function QuotePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy pb-16 pt-10 text-white sm:pb-20 sm:pt-12">
        <div className="absolute inset-0 radial-glow opacity-55" aria-hidden />
        <div className="absolute inset-0 grid-lines opacity-20" aria-hidden />
        <div className="container-x relative">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-white/55 transition hover:text-white"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow text-cyan-300">
                <span className="h-px w-6 bg-cyan-300" /> Instant quote
              </p>
              <h1 className="display-2 mt-3 max-w-2xl text-white">
                Build your booking. See the fare before you send.
              </h1>
              <p className="lede mt-3 max-w-xl text-white/70">
                Every line of the fare is shown as you go — base fee, distance, priority and handling.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {[
                { icon: Clock, label: "Pickup in ~20 min" },
                { icon: ShieldCheck, label: "Insured to ₦50,000" },
                { icon: BadgeCheck, label: "Vetted riders" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[0.75rem] font-medium text-white/80 backdrop-blur"
                >
                  <item.icon className="size-3.5 text-cyan-300" /> {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 pb-16 sm:pb-20">
        <div className="container-x">
          <BookingForm />
        </div>
      </section>

      <section className="border-t border-line bg-mist py-10">
        <div className="container-x flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-[0.8125rem] text-slate-ink">
            Prefer to talk it through? Dispatch answers {site.hours}.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <a href={site.phoneHref} className="btn btn-outline btn-sm">
              Call {site.phone}
            </a>
            <a href={site.whatsappHref} className="btn btn-dark btn-sm">
              WhatsApp dispatch
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
