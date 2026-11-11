import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PageHead } from "@/components/ui/PageHead";
import { services } from "@/lib/content";
import { PRICING, formatNaira } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Six DigiTrans services in Calabar: standard delivery, market runs, waybills, business dispatch, student delivery and scheduled pickups.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHead
        title="Six services, one dispatch desk."
        lead="Everything we do in Calabar, with the tariff for each shown up front. Pick the one that fits, or call dispatch and we will tell you which is cheaper."
        trail={[{ label: "Services" }]}
        image="/images/street-wide.jpg"
        imageAlt="A DigiTrans rider in Calabar at dusk"
      >
        <div className="mt-8 grid max-w-2xl grid-cols-3 border-t border-white/15">
          {[
            { k: "Delivery from", v: formatNaira(PRICING.minimumFee) },
            { k: "Market run fee", v: formatNaira(PRICING.marketRunFee) },
            { k: "Student flat rate", v: formatNaira(PRICING.studentFlat) },
          ].map((item) => (
            <div key={item.k} className="pt-5">
              <p className="text-[0.6875rem] text-white/40">{item.k}</p>
              <p className="mt-1 font-display text-[1.125rem] font-medium tracking-tight text-white">{item.v}</p>
            </div>
          ))}
        </div>
      </PageHead>

      <section className="bg-white">
        <div className="container-x">
          {services.map((service, i) => (
            <article
              key={service.slug}
              className="grid gap-8 border-b border-line py-12 lg:grid-cols-12 lg:items-center lg:gap-14 lg:py-16"
            >
              <div className={`lg:col-span-6 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <Link href={`/services/${service.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-navy">
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                </Link>
              </div>

              <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-1" : "lg:col-start-8"}`}>
                <p className="font-mono text-[0.6875rem] tabular-nums text-muted">0{i + 1}</p>
                <h2 className="display-3 mt-3">{service.name}</h2>
                <p className="body-sm mt-3 max-w-[46ch]">{service.description}</p>

                <dl className="mt-6 grid grid-cols-2 gap-x-8 border-t border-line pt-4">
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-muted">From</dt>
                    <dd className="mt-1 text-[0.875rem] font-medium text-navy">{service.priceFrom}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-muted">Typical window</dt>
                    <dd className="mt-1 text-[0.875rem] font-medium text-navy">{service.turnaround}</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Link href={`/services/${service.slug}`} className="link-underline">
                    Service detail
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                  <Link href="/quote" className="link-underline">
                    Get a fare
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-navy py-14">
        <div className="container-x flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-[1.25rem] font-medium tracking-tight text-white">
              Not sure which service you need?
            </p>
            <p className="mt-1.5 max-w-lg text-[0.875rem] leading-relaxed text-white/55">
              Tell dispatch what you are sending and where it is going. We will quote the cheapest
              option, not the most expensive one we can justify.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/quote" className="btn btn-on-dark btn-sm">
              Price it
            </Link>
            <Link href="/contact" className="btn btn-outline-dark btn-sm">
              Talk to dispatch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
