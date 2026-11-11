import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { zones } from "@/lib/content";

export function Coverage() {
  return (
    <section className="section bg-white">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
        <div className="lg:col-span-5">
          <h2 className="display-2 max-w-[20ch]">Calabar, properly mapped.</h2>
          <p className="body-sm mt-5">
            Our zones follow how people here actually give directions — landmarks, junctions and
            markets first, postcodes never.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-0 border-t border-line">
            {zones.map((zone) => (
              <div key={zone.name} className="flex items-baseline justify-between gap-3 border-b border-line py-3">
                <span className="text-[0.8125rem] font-medium text-navy">{zone.name}</span>
                <span className="text-right text-[0.6875rem] text-muted">{zone.note}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link href="/coverage" className="link-underline">
              Coverage detail
              <ArrowRight className="size-3.5" />
            </Link>
            <Link href="/quote" className="link-underline">
              Price a route
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7">
          <figure className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-navy">
              <Image
                src="/images/market-run.jpg"
                alt="A DigiTrans market runner shopping in Calabar"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-[0.75rem] font-medium text-white/60">Watt Market</p>
                <p className="mt-1.5 max-w-[34ch] font-display text-[1.25rem] font-medium leading-snug tracking-tight text-white">
                  Our runners shop the market, weigh it, and bring you the receipt.
                </p>
              </figcaption>
            </div>
          </figure>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: "12", label: "Zones" },
              { value: "3", label: "LGAs covered" },
              { value: "7am", label: "Daily opening" },
              { value: "24h", label: "Claim window" },
            ].map((stat) => (
              <div key={stat.label} className="border-t border-line pt-3">
                <p className="font-display text-[1.25rem] font-medium tracking-tight text-navy">{stat.value}</p>
                <p className="mt-0.5 text-[0.75rem] text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
