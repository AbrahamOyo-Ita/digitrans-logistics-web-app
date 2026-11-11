import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Truck } from "lucide-react";
import { Eyebrow, ReadMore, iconFor } from "@/components/ui/Bits";
import { services } from "@/lib/content";

/** Band 3 — "Our services": copy on the left, stacked photography on the right. */
export function Intro() {
  return (
    <section className="section bg-white">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow>Our services</Eyebrow>
          <h2 className="display-2 mt-3 max-w-[22ch]">
            Everything that moves,{" "}
            <span className="text-cyan">handled in one place.</span>
          </h2>
          <p className="body-sm mt-4 max-w-md">
            From a single document in Duke Town to a full market list from Watt Market, we run our
            own riders, our own runners and our own dispatch desk — so nothing gets handed to a
            stranger.
          </p>

          <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              "Fares quoted before you book",
              "Live tracking on every trip",
              "Photo and signature on delivery",
              "Vetted riders, not freelancers",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[0.875rem] text-slate-ink">
                <span className="mt-0.5 grid size-[1.1rem] shrink-0 place-items-center rounded-full bg-cyan/12 text-cyan">
                  <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m4 12.5 5 5L20 6.5" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link href="/services" className="pill pill-navy">
              Explore all services
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Two stacked photographs with a floating navy card, as in the template */}
        <div className="relative">
          <div className="grid grid-cols-[1.15fr_0.85fr] gap-3 sm:gap-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[18px]">
              <Image
                src="/images/handover.jpg"
                alt="A DigiTrans rider handing a parcel to a customer"
                fill
                sizes="(max-width: 1024px) 55vw, 28vw"
                className="object-cover object-[50%_40%]"
              />
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative aspect-square overflow-hidden rounded-[18px]">
                <Image
                  src="/images/market-run.jpg"
                  alt="A market runner collecting produce at Watt Market"
                  fill
                  sizes="(max-width: 1024px) 40vw, 20vw"
                  className="object-cover"
                />
              </div>
              <div className="rounded-[18px] bg-navy p-4 text-white sm:p-5">
                <span className="grid size-9 place-items-center rounded-full bg-cyan text-white">
                  <Truck className="size-4" strokeWidth={1.8} aria-hidden />
                </span>
                <p className="mt-3 font-display text-[0.9375rem] font-medium leading-snug tracking-tight">
                  Dispatch desk
                  <br />
                  in Calabar
                </p>
                <p className="mt-1 text-[0.6875rem] leading-relaxed text-white/55">
                  We answer, every day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Band 4 — the four service cards with photography and coloured icon badges. */
export function ServiceCards() {
  const tones = ["cyan", "amber", "green", "violet"] as const;
  const badgeTint: Record<string, string> = {
    cyan: "bg-cyan/12 text-cyan",
    amber: "bg-[#B5762B]/12 text-[#B5762B]",
    green: "bg-[#2C7A4B]/12 text-[#2C7A4B]",
    violet: "bg-[#6D4AA6]/12 text-[#6D4AA6]",
  };

  const featured = services.slice(0, 4);

  return (
    <section className="bg-white pb-16 pt-4 sm:pb-20">
      <div className="container-x">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((service, i) => {
            const Icon = iconFor(service.icon);
            return (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group overflow-hidden rounded-[16px] border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(11,27,43,0.45)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span className={`grid size-9 place-items-center rounded-full ${badgeTint[tones[i % 4]]}`}>
                    <Icon className="size-[1.05rem]" strokeWidth={1.7} aria-hidden />
                  </span>
                  <p className="font-display text-[0.9375rem] font-medium tracking-tight text-navy">
                    {service.name}
                  </p>
                </div>
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted">{service.short}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-cyan">
                  View service
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <ReadMore href="/services" label="See all six services" />
        </div>
      </div>
    </section>
  );
}
