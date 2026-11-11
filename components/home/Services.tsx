import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { services } from "@/lib/content";

const short: Record<string, string> = {
  "standard-delivery": "Parcels",
  "market-runs": "Market runs",
  waybills: "Waybills",
  "business-logistics": "Business",
  "student-delivery": "Students",
  "scheduled-pickups": "Scheduled",
};

export function Services() {
  const [lead, ...rest] = services;

  return (
    <section id="services" className="section bg-paper">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
          <h2 className="display-2 max-w-[24ch]">Everything that moves, in one place.</h2>
          <Link href="/services" className="link-underline">
            All services
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Lead service */}
          <Link
            href={`/services/${lead.slug}`}
            className="group relative flex min-h-[26rem] flex-col justify-end overflow-hidden bg-navy lg:col-span-6"
          >
            <Image
              src="/images/handover.jpg"
              alt="A DigiTrans rider handing a parcel to a customer"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-navy/5" />
            <div className="relative p-7 sm:p-9">
              <p className="text-[0.75rem] font-medium text-white/55">{short[lead.slug]}</p>
              <h3 className="mt-2 font-display text-[1.5rem] font-medium tracking-tight text-white">
                {lead.name}
              </h3>
              <p className="mt-2 max-w-[38ch] text-[0.875rem] leading-relaxed text-white/70">
                {lead.blurb}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4 text-[0.8125rem] text-white/60">
                <span>From {lead.priceFrom} · {lead.turnaround}</span>
                <ArrowUpRight className="size-4 text-white transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>

          {/* Remaining services */}
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:col-span-6">
            {rest.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group flex flex-col justify-between bg-white p-6 transition-colors hover:bg-paper"
              >
                <div>
                  <p className="text-[0.75rem] font-medium text-muted">{short[service.slug]}</p>
                  <h3 className="mt-1.5 font-display text-[1.0625rem] font-medium tracking-tight text-navy">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-ink">{service.short}</p>
                </div>
                <div className="mt-6 flex items-center justify-between text-[0.75rem] text-muted">
                  <span>From {service.priceFrom}</span>
                  <ArrowUpRight className="size-3.5 text-navy/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-navy" />
                </div>
              </Link>
            ))}

            <Link
              href="/contact"
              className="group flex flex-col justify-between bg-navy p-6 transition-colors hover:bg-navy-600"
            >
              <div>
                <p className="text-[0.75rem] font-medium text-white/45">Not listed</p>
                <h3 className="mt-1.5 font-display text-[1.0625rem] font-medium tracking-tight text-white">
                  Something else
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-white/60">
                  Awkward route, bulk load or a recurring schedule? Dispatch will price it properly.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[0.75rem] text-white/55">
                <span>Talk to dispatch</span>
                <ArrowUpRight className="size-3.5 text-white transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
