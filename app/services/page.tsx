import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, Wallet } from "lucide-react";
import { services } from "@/lib/content";
import { PRICING, formatNaira } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Services & pricing",
  description:
    "Compare DigiTrans services — standard delivery, market runs, waybills, business dispatch, student delivery and scheduled pickups across Calabar.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy py-14 text-white sm:py-20">
        <div className="absolute inset-0 radial-glow opacity-55" aria-hidden />
        <div className="absolute inset-0 grid-lines opacity-20" aria-hidden />
        <div className="container-x relative">
          <p className="eyebrow text-cyan-300">
            <span className="h-px w-6 bg-cyan-300" /> Services
          </p>
          <h1 className="display-2 mt-3 max-w-2xl text-white">
            One operator for everything that moves in Calabar.
          </h1>
          <p className="lede mt-4 max-w-xl text-white/70">
            Six services, one dispatch desk, one tracking page. Prices below are the live tariffs — no
            “contact us for pricing”.
          </p>

          <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-white/12 bg-white/10 sm:grid-cols-3">
            {[
              { k: "Standard from", v: formatNaira(PRICING.minimumFee) },
              { k: "Market run fee", v: formatNaira(PRICING.marketRunFee) },
              { k: "Student flat rate", v: formatNaira(PRICING.studentFlat) },
            ].map((item) => (
              <div key={item.k} className="bg-navy/70 px-4 py-3.5 backdrop-blur">
                <p className="text-[0.625rem] uppercase tracking-[0.14em] text-white/45">{item.k}</p>
                <p className="mt-1 font-display text-lg font-semibold text-white">{item.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-x space-y-5">
          {services.map((service, i) => (
            <article
              key={service.slug}
              className="group grid gap-0 overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)] transition hover:border-navy/15 hover:shadow-[var(--shadow-lift)] md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]"
            >
              <div className={`relative min-h-56 ${i % 2 === 1 ? "md:order-2" : ""}`}>
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-navy/45 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="rounded-md bg-white/95 px-2 py-1 text-[0.6875rem] font-semibold text-navy">
                    from {service.priceFrom}
                  </span>
                  <span className="rounded-md bg-navy/80 px-2 py-1 text-[0.6875rem] font-medium text-white backdrop-blur">
                    {service.turnaround}
                  </span>
                </div>
              </div>

              <div className="flex flex-col p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="display-3 text-navy">{service.name}</h2>
                    <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-slate-ink">{service.blurb}</p>
                  </div>
                  <span className="hidden font-display text-3xl font-bold tracking-tight text-navy/10 sm:block">
                    0{i + 1}
                  </span>
                </div>

                <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {service.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-[0.8125rem] text-slate-ink">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan" />
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                  <Link href={`/services/${service.slug}`} className="btn btn-outline btn-sm">
                    Service details <ArrowUpRight className="size-3.5" />
                  </Link>
                  <Link href="/quote" className="btn btn-primary btn-sm">
                    Get a quote <ArrowRight className="size-3.5" />
                  </Link>
                  <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-muted">
                    <Clock className="size-3.5" /> {service.turnaround}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-muted">
                    <Wallet className="size-3.5" /> {service.priceFrom}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
