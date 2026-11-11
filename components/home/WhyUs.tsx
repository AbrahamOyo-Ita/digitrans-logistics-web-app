import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, HandCoins, Headset, MapPinned, ShieldCheck, Wallet } from "lucide-react";

const pillars = [
  {
    icon: MapPinned,
    title: "Coverage that fits the city",
    body: "Zones built around real Calabar landmarks — not postcodes we invented for a form field.",
  },
  {
    icon: Wallet,
    title: "Fares you can read",
    body: "Base fee, distance and surcharges, itemised. Student and vendor rates apply automatically.",
  },
  {
    icon: Bike,
    title: "Bicycles & e-bikes first",
    body: "Cleaner, quieter and cheaper to run in traffic — with motorcycles where distance needs them.",
  },
  {
    icon: HandCoins,
    title: "Riders paid properly",
    body: "25% of every completed trip goes to the rider, settled next day with a visible ledger.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted riders only",
    body: "Guarantors, valid IDs and signed agreements before a rider ever sees a job.",
  },
  {
    icon: Headset,
    title: "Humans on support",
    body: "A Calabar number that answers, plus WhatsApp while a delivery is live.",
  },
];

export function WhyUs() {
  return (
    <section className="section-pad bg-white">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-line">
              <Image
                src="/images/depot.jpg"
                alt="DigiTrans e-bike depot in Calabar"
                width={900}
                height={1100}
                className="h-full max-h-[34rem] w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 text-white">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Marian Road depot
                </p>
                <p className="mt-1.5 font-display text-lg font-semibold leading-snug">
                  Bicycles, e-bikes and a dispatch desk that opens at 7am.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-line bg-mist p-4">
                <p className="font-display text-2xl font-bold tracking-tight text-navy">25%</p>
                <p className="mt-1 text-[0.75rem] leading-snug text-muted">
                  of each completed fare goes directly to the rider
                </p>
              </div>
              <div className="rounded-xl border border-line bg-mist p-4">
                <p className="font-display text-2xl font-bold tracking-tight text-navy">₦500</p>
                <p className="mt-1 text-[0.75rem] leading-snug text-muted">
                  flat campus rate for verified students
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="eyebrow">
              <span className="h-px w-6 bg-cyan" /> Why DigiTrans
            </p>
            <h2 className="display-2 mt-3 text-navy">
              Built for the last mile,{" "}
              <span className="text-cyan">not the long haul.</span>
            </h2>
            <p className="lede mt-4 max-w-xl">
              We are not a national courier with a local phone number. DigiTrans runs its own riders,
              own depot and own pricing rules — so a detour, a market list, or a campus run is normal
              work, not an exception.
            </p>

            <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="group">
                  <span className="inline-grid size-10 place-items-center rounded-xl border border-cyan/20 bg-cyan/10 text-cyan transition group-hover:bg-cyan group-hover:text-white">
                    <pillar.icon className="size-[1.15rem]" />
                  </span>
                  <h3 className="mt-3 font-display text-[1rem] font-semibold tracking-tight text-navy">
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-[0.875rem] leading-relaxed text-slate-ink">{pillar.body}</p>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-navy transition hover:text-cyan"
            >
              More about how we operate
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
