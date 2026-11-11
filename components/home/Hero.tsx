import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/content";

const facts = [
  { value: "38,000+", label: "deliveries completed" },
  { value: "97.4%", label: "delivered on time" },
  { value: "240", label: "riders and runners" },
  { value: "12", label: "zones across Calabar" },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      {/* Photograph bleeds in from the right and dissolves into the navy field */}
      <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[64%]">
        <Image
          src="/images/street-wide.jpg"
          alt="A DigiTrans rider crossing Calabar at dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[42%_58%] sm:object-[50%_54%] lg:object-[54%_52%]"
        />
        {/* dissolve edges: left, bottom, top */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/70 to-navy/25 sm:via-navy/80 lg:via-navy/60 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy via-navy/80 to-transparent lg:h-52" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy/85 to-transparent" />
      </div>
      <div className="absolute inset-0 -z-10 bg-navy/15 lg:bg-navy/25" />

      <div className="container-x">
        <div className="flex min-h-[36rem] flex-col justify-center py-16 md:min-h-[40rem] md:py-24 lg:min-h-[44rem]">
          <p className="text-[0.8125rem] font-medium text-white/55">Calabar, Cross River State</p>

          <h1 className="display-1 mt-6 max-w-[17ch] text-white">
            Delivery, market runs and waybills, handled properly.
          </h1>

          <p className="mt-6 max-w-[44ch] text-[1.0625rem] leading-relaxed text-white/70">
            We run our own riders and our own dispatch desk in Calabar. Fares are quoted before you
            book, every stop is timestamped, and someone local answers when you call.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/quote" className="btn btn-on-dark">
              Book a delivery
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/track" className="btn btn-outline-dark">
              Track a parcel
            </Link>
          </div>

          <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-7 border-t border-white/15 pt-8 sm:grid-cols-4 md:mt-20">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="font-display text-[1.5rem] font-medium leading-none tracking-tight text-white">
                  {fact.value}
                </dt>
                <dd className="mt-2 text-[0.75rem] leading-snug text-white/50">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="relative border-t border-white/12">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-4 text-[0.75rem] text-white/50">
          <p>Operating {site.hours}</p>
          <p className="hidden sm:block">{site.address}</p>
          <a href={site.phoneHref} className="font-medium text-white/75 transition-colors hover:text-white">
            {site.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
