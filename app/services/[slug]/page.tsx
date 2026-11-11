import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, Clock, Wallet } from "lucide-react";
import { services } from "@/lib/content";
import { QuoteWidget } from "@/components/ui/QuoteWidget";
import type { ServiceId } from "@/lib/pricing";

const serviceToQuote: Record<string, ServiceId> = {
  "standard-delivery": "standard",
  "market-runs": "market-run",
  waybills: "waybill",
  "business-logistics": "business",
  "student-delivery": "student",
  "scheduled-pickups": "standard",
};

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return { title: "Service not found" };
  return {
    title: `${service.name} in Calabar`,
    description: service.blurb + " " + service.description.slice(0, 110),
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.name} · DigiTrans Logistics`,
      description: service.blurb,
      images: [{ url: service.image }],
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const related = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.name,
    description: service.description,
    areaServed: { "@type": "City", name: "Calabar" },
    provider: {
      "@type": "LocalBusiness",
      name: "DigiTrans Logistics",
      telephone: "+2348012345678",
      address: {
        "@type": "PostalAddress",
        streetAddress: "18 Marian Road",
        addressLocality: "Calabar",
        addressRegion: "Cross River State",
        addressCountry: "NG",
      },
    },
    offers: { "@type": "Offer", price: service.priceFrom, priceCurrency: "NGN" },
    mainEntityOfPage: `https://digitrans.ng/services/${service.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0" aria-hidden>
          <Image src={service.image} alt="" fill className="object-cover opacity-35" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/92 to-navy/45" />
          <div className="absolute inset-0 grid-lines opacity-20" />
        </div>

        <div className="container-x relative py-14 sm:py-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[0.75rem] text-white/45">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href="/services" className="transition hover:text-white">
              Services
            </Link>
            <span aria-hidden>/</span>
            <span className="text-white/70">{service.name}</span>
          </nav>

          <div className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <h1 className="display-1 max-w-xl text-white">{service.name}</h1>
              <p className="lede mt-4 max-w-lg text-white/70">{service.blurb}</p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.75rem] font-medium text-white/85 backdrop-blur">
                  <Wallet className="size-3.5 text-cyan-300" /> from {service.priceFrom}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.75rem] font-medium text-white/85 backdrop-blur">
                  <Clock className="size-3.5 text-cyan-300" /> {service.turnaround}
                </span>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/quote" className="btn btn-primary">
                  Get an instant quote <ArrowRight className="size-4" />
                </Link>
                <Link href="/track" className="btn btn-ghost">
                  Track a delivery
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-16">
          <div>
            <p className="eyebrow">
              <span className="h-px w-6 bg-cyan" /> Overview
            </p>
            <h2 className="display-3 mt-3 text-navy">What you get</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-ink">{service.description}</p>

            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {service.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 rounded-xl border border-line bg-mist px-3.5 py-3">
                  <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-cyan text-white">
                    <Check className="size-3" strokeWidth={3.5} />
                  </span>
                  <span className="text-[0.8125rem] font-medium text-navy">{h}</span>
                </li>
              ))}
            </ul>

            <h2 className="display-3 mt-12 text-navy">How it works</h2>
            <ol className="mt-5 space-y-4 border-l border-line pl-6">
              {service.steps.map((step, i) => (
                <li key={step.title} className="relative">
                  <span className="absolute -left-[1.9rem] top-0 grid size-6 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-[0.625rem] font-bold text-cyan-600">
                    {i + 1}
                  </span>
                  <p className="text-[0.9375rem] font-semibold text-navy">{step.title}</p>
                  <p className="mt-1 text-[0.875rem] leading-relaxed text-slate-ink">{step.body}</p>
                </li>
              ))}
            </ol>

            <h2 className="display-3 mt-12 text-navy">Frequently asked</h2>
            <div className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {service.faqs.map((faq) => (
                <details key={faq.q} className="group bg-white p-4 open:bg-mist/50">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.875rem] font-semibold text-navy marker:hidden">
                    {faq.q}
                    <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45 group-open:border-cyan group-open:bg-cyan group-open:text-white">
                      +
                    </span>
                  </summary>
                  <p className="mt-2.5 pr-8 text-[0.875rem] leading-relaxed text-slate-ink">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-line bg-mist p-4 sm:p-5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Estimate this service
              </p>
              <div className="mt-3">
                <QuoteWidget variant="full" defaultService={serviceToQuote[service.slug] ?? "standard"} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-navy/10 bg-navy p-5 text-white">
              <p className="font-display text-[1rem] font-semibold tracking-tight">Talk to dispatch</p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-white/60">
                Complex route, bulk order or a recurring schedule? We’ll price it properly.
              </p>
              <div className="mt-4 grid gap-2">
                <a href="tel:+2348012345678" className="btn btn-primary btn-sm">
                  Call +234 801 234 5678
                </a>
                <a href="https://wa.me/2348012345678" className="btn btn-ghost btn-sm">
                  WhatsApp dispatch
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-line bg-mist py-14">
        <div className="container-x">
          <div className="flex items-end justify-between gap-4">
            <h2 className="display-3 text-navy">Also moving in Calabar</h2>
            <Link href="/services" className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-cyan">
              All services <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/services/${item.slug}`}
                className="group overflow-hidden rounded-xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
              >
                <div className="relative h-28 overflow-hidden">
                  <Image src={item.image} alt="" fill sizes="33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-navy/25" />
                </div>
                <div className="p-4">
                  <p className="text-[0.875rem] font-semibold text-navy">{item.name}</p>
                  <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">{item.short}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
