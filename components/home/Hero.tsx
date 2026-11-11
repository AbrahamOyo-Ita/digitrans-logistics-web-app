import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { site } from "@/lib/content";
import { QuoteWidget } from "@/components/ui/QuoteWidget";

const proof = [
  { value: "38k+", label: "deliveries completed" },
  { value: "97.4%", label: "on-time rate" },
  { value: "240", label: "riders & runners" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {/* backdrop */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/images/hero-courier.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[58%_18%] opacity-55 sm:object-[62%_24%] lg:object-[72%_center] lg:opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/92 to-navy/30 lg:via-navy/85 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/25 to-navy/55" />
        <div className="absolute inset-0 grid-lines opacity-30" />
      </div>

      <div className="relative container-x pb-0 pt-12 sm:pt-16 lg:pt-20">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
          <div className="max-w-xl animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-cyan-300 backdrop-blur">
              <Sparkles className="size-3.5" />
              Now serving Calabar &amp; Akpabuyo
            </span>

            <h1 className="display-1 mt-5 text-white">
              We move Calabar,{" "}
              <span className="relative inline-block text-cyan-300">
                door to door.
                <svg
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-cyan-300/60"
                  viewBox="0 0 200 12"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M2 8.5c38-6 82-8 196-2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="lede mt-5 max-w-lg text-white/70">
              Riders, market runs and waybills in one place. Transparent fares before you book, live
              tracking while it moves, and proof the moment it lands.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/quote" className="btn btn-primary">
                Book a delivery
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/track" className="btn btn-ghost">
                <MapPin className="size-4" />
                Track a parcel
              </Link>
            </div>

            <dl className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/12 pt-6">
              {proof.map((p) => (
                <div key={p.label}>
                  <dt className="font-display text-xl font-bold tracking-tight text-white">{p.value}</dt>
                  <dd className="mt-0.5 text-[0.7rem] uppercase tracking-[0.1em] text-white/45">{p.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-w-0 animate-rise [animation-delay:120ms]">
            <div className="mb-4 flex flex-wrap items-center gap-2 lg:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-medium text-white/80 backdrop-blur">
                <Bike className="size-3.5 text-cyan-300" /> Bicycle · E-bike · Motorcycle
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-medium text-white/80 backdrop-blur">
                <ShieldCheck className="size-3.5 text-cyan-300" /> Insured to ₦50,000
              </span>
            </div>

            <div className="relative">
              <QuoteWidget variant="hero" />
              <div className="pointer-events-none absolute -inset-x-6 -bottom-10 h-24 bg-cyan/20 blur-3xl" aria-hidden />
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-t-2xl border border-b-0 border-white/12 bg-white/10 text-[0.8rem] sm:grid-cols-3">
          {[
            { title: "Fares before you commit", body: "Base + distance, no surprises at the door." },
            { title: "Live status timeline", body: "Every stop logged with a timestamp." },
            { title: "Support that answers", body: `${site.hours} · WhatsApp & phone` },
          ].map((item) => (
            <div key={item.title} className="bg-navy/70 px-4 py-3.5 backdrop-blur">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-0.5 text-[0.75rem] text-white/55">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
