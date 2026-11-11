import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { PageHead } from "@/components/ui/PageHead";
import { QuoteWidget } from "@/components/ui/QuoteWidget";
import { services } from "@/lib/content";
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
    description: `${service.blurb} ${service.description.slice(0, 100)}`,
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

      <PageHead
        eyebrow="Service"
        title={service.name}
        lead={service.blurb}
        trail={[{ label: "Services", href: "/services" }, { label: service.name }]}
        image={service.image}
        imageAlt={service.name}
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/15 pt-6">
          <div>
            <p className="text-[0.6875rem] text-white/40">From</p>
            <p className="mt-1 text-[0.9375rem] font-medium text-white">{service.priceFrom}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] text-white/40">Typical window</p>
            <p className="mt-1 text-[0.9375rem] font-medium text-white">{service.turnaround}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <Link href="/quote" className="pill pill-white pill-sm">
              Get a fare
            </Link>
            <Link href="/track" className="pill pill-ghost pill-sm">
              Track a parcel
            </Link>
          </div>
        </div>
      </PageHead>

      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="display-3">What you get</h2>
            <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-slate-ink">
              {service.description}
            </p>

            <ul className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-2">
              {service.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 bg-white p-4">
                  <Check className="mt-0.5 size-4 shrink-0 text-cyan" strokeWidth={2.5} />
                  <span className="text-[0.8125rem] leading-relaxed text-navy">{h}</span>
                </li>
              ))}
            </ul>

            <h2 className="display-3 mt-14">How it works</h2>
            <ol className="mt-6 divide-y divide-line border-t border-line">
              {service.steps.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[auto_1fr] gap-x-5 py-5">
                  <span className="pt-0.5 font-mono text-[0.6875rem] tabular-nums text-muted">0{i + 1}</span>
                  <div>
                    <p className="text-[0.9375rem] font-medium text-navy">{step.title}</p>
                    <p className="mt-1 text-[0.875rem] leading-relaxed text-slate-ink">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <figure className="mt-12">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[18px] bg-navy">
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
            </figure>

            <h2 className="display-3 mt-14">Frequently asked</h2>
            <div className="mt-5 border-t border-line">
              {service.faqs.map((faq) => (
                <details key={faq.q} className="group border-b border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[0.9375rem] font-medium text-navy marker:hidden">
                    {faq.q}
                    <span className="text-muted transition-transform group-open:rotate-45">
                      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <p className="max-w-[62ch] pb-5 pr-8 text-[0.875rem] leading-relaxed text-slate-ink">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <h2 className="display-3">Price this service</h2>
              <p className="body-sm mt-2">Live fares for your route, calculated the same way dispatch does.</p>
              <div className="mt-5">
                <QuoteWidget variant="full" defaultService={serviceToQuote[service.slug] ?? "standard"} />
              </div>

              <div className="mt-6 border border-line p-5">
                <p className="text-[0.875rem] font-medium text-navy">Talk to dispatch</p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-slate-ink">
                  Bulk order, awkward route or a recurring schedule? We will price it properly.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <a href="tel:+2348012345678" className="pill pill-navy pill-sm w-full">
                    Call +234 801 234 5678
                  </a>
                  <a
                    href="https://wa.me/2348012345678"
                    className="pill pill-line pill-sm w-full"
                  >
                    Message on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-line bg-paper py-14">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <h2 className="display-3">Other services</h2>
            <Link href="/services" className="link-underline">
              All services
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-6 grid gap-px bg-line sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/services/${item.slug}`}
                className="group bg-white p-5 transition-colors hover:bg-paper"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] bg-navy">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-4 text-[0.9375rem] font-medium text-navy">{item.name}</p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate-ink">{item.short}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[0.75rem] text-muted">
                  From {item.priceFrom}
                  <ArrowRight className="size-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
