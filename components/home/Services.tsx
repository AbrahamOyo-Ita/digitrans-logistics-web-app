import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, Wallet } from "lucide-react";
import { services } from "@/lib/content";
import { cn } from "@/lib/cn";

const shortLabels: Record<string, string> = {
  "standard-delivery": "Delivery",
  "market-runs": "Market run",
  waybills: "Waybill",
  "business-logistics": "Business",
  "student-delivery": "Student",
  "scheduled-pickups": "Scheduled",
};

const iconMap: Record<string, string> = {
  truck: "M3 7h11v8H3zM14 10h4l3 3v2h-7z",
  basket: "M5 9h14l-1.5 9h-11zM9 9V6a3 3 0 0 1 6 0v3",
  package: "M3 8.5 12 4l9 4.5v7L12 20l-9-4.5zM3 8.5 12 13l9-4.5M12 13v7",
  store: "M4 9h16v11H4zM4 9l2-4h12l2 4zM9 20v-6h6v6",
  student: "M3 9l9-4 9 4-9 4zM7 12v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2",
};

export function Services() {
  return (
    <section id="services" className="section-pad relative bg-mist">
      <div className="container-x">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">
              <span className="h-px w-6 bg-cyan" /> What we do
            </p>
            <h2 className="display-2 mt-3 text-navy">
              Six ways to get it <span className="text-cyan">where it’s going.</span>
            </h2>
            <p className="lede mt-4 max-w-xl">
              A local operating model built for Calabar traffic, campus life and market hours — not a
              national template with our logo on it.
            </p>
          </div>
          <Link
            href="/services"
            className="group inline-flex shrink-0 items-center gap-2 self-start text-sm font-semibold text-navy transition hover:text-cyan md:self-end"
          >
            Compare all services
            <span className="grid size-8 place-items-center rounded-full border border-navy/15 transition group-hover:border-cyan group-hover:bg-cyan group-hover:text-white">
              <ArrowUpRight className="size-4" />
            </span>
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const featured = index === 0;
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition duration-300 hover:-translate-y-1",
                  featured
                    ? "border-navy/10 shadow-[var(--shadow-lift)] sm:col-span-2 lg:col-span-1"
                    : "border-line shadow-[var(--shadow-card)] hover:border-navy/15 hover:shadow-[var(--shadow-lift)]"
                )}
              >
                <div className={cn("relative overflow-hidden", featured ? "h-52" : "h-40")}>
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/10 to-transparent" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-navy backdrop-blur">
                    <svg viewBox="0 0 24 24" className="size-3.5 text-cyan" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={iconMap[service.icon] ?? iconMap.package} />
                    </svg>
                    {shortLabels[service.slug] ?? service.name}
                  </span>
                  <div className="absolute inset-x-4 bottom-3 flex items-center gap-3 text-[0.6875rem] font-medium text-white/85">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {service.turnaround}
                    </span>
                    <span className="size-1 rounded-full bg-white/40" />
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="size-3" /> from {service.priceFrom}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-navy">{service.name}</h3>
                  <p className="mt-1.5 flex-1 text-[0.875rem] leading-relaxed text-slate-ink">{service.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-cyan">
                    Explore service
                    <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
