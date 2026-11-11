import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, Building2, HeartHandshake, Leaf, Target, Users } from "lucide-react";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "About DigiTrans Logistics",
  description:
    "DigiTrans Logistics is a Calabar-built delivery company running bicycles, e-bikes and motorcycles across Cross River State. Meet the team and operating model.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Target,
    title: "Fares, not guesswork",
    body: "Pricing is calculated from zones and distance. Nobody should have to haggle at the door.",
  },
  {
    icon: Users,
    title: "Riders are partners",
    body: "A published commission split, next-day settlement and a ledger riders can actually read.",
  },
  {
    icon: Leaf,
    title: "Cleaner last mile",
    body: "Bicycles and e-bikes cover short campus and market runs; motorcycles handle distance.",
  },
  {
    icon: HeartHandshake,
    title: "Local accountability",
    body: "Our dispatch desk is in Calabar, staffed by people who know the streets we serve.",
  },
];

const timeline = [
  { year: "2021", title: "One bicycle, one rider", body: "DigiTrans starts with campus deliveries around UNICAL and Ekorinim hostels." },
  { year: "2022", title: "Market runs launch", body: "Watt Market runners added after demand from busy professionals and clinics." },
  { year: "2023", title: "Vendor accounts", body: "Restaurants, pharmacies and groceries move their dispatch to the DigiTrans board." },
  { year: "2024", title: "Waybill network", body: "Calabar to Uyo, Port Harcourt and Abuja line-haul routes open." },
  { year: "2025", title: "E-bike fleet", body: "Electric cargo bikes join the fleet at the Marian Road depot." },
  { year: "2026", title: "Digital platform", body: "Customer portal, rider PWA and the operations console roll out." },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy py-14 text-white sm:py-20">
        <div className="absolute inset-0" aria-hidden>
          <Image src="/images/depot.jpg" alt="" fill priority className="object-cover opacity-30" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
          <div className="absolute inset-0 grid-lines opacity-20" />
        </div>
        <div className="container-x relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="eyebrow text-cyan-300">
              <span className="h-px w-6 bg-cyan-300" /> About us
            </p>
            <h1 className="display-2 mt-3 max-w-2xl text-white">
              We started with one bicycle in Calabar. We still know every street.
            </h1>
            <p className="lede mt-4 max-w-xl text-white/70">
              DigiTrans Logistics is a delivery company built in Cross River State — riders, runners
              and a dispatch desk that answers. Our platform is the upgrade, not the origin story.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-2">
            {[
              { k: "Deliveries completed", v: site.stats.deliveries },
              { k: "Riders & runners", v: site.stats.riders },
              { k: "On-time rate", v: site.stats.onTime },
              { k: "Business partners", v: site.stats.partners },
            ].map((stat) => (
              <div key={stat.k} className="rounded-xl border border-white/12 bg-white/5 p-4 backdrop-blur">
                <dt className="text-[0.625rem] uppercase tracking-[0.14em] text-white/45">{stat.k}</dt>
                <dd className="mt-1 font-display text-2xl font-bold tracking-tight text-white">{stat.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-line">
              <Image
                src="/images/handover.jpg"
                alt="A DigiTrans rider handing a parcel to a customer"
                width={900}
                height={1000}
                className="h-[26rem] w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
            <div className="absolute -bottom-5 left-5 right-5 rounded-xl border border-line bg-white p-4 shadow-[var(--shadow-lift)] sm:right-auto sm:max-w-xs">
              <p className="flex items-center gap-2 text-[0.75rem] font-semibold text-navy">
                <Building2 className="size-4 text-cyan" /> Marian Road depot
              </p>
              <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
                Dispatch, waybill counter and rider charging dock in one place.
              </p>
            </div>
          </div>

          <div>
            <p className="eyebrow">
              <span className="h-px w-6 bg-cyan" /> Our model
            </p>
            <h2 className="display-2 mt-3 text-navy">An operator, not a marketplace.</h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-slate-ink">
              We hire, vet and equip our riders. That means a guarantor on file, a signed rider
              agreement, and a dispatch team that can pick up the phone when something goes wrong.
              Because we control the last mile end to end, we can also promise things aggregators
              can’t: a fixed campus rate, a reconciled market run, and a fare that doesn’t change
              in traffic.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {values.map((value) => (
                <div key={value.title} className="rounded-xl border border-line bg-mist p-4">
                  <span className="grid size-9 place-items-center rounded-lg bg-white text-cyan ring-1 ring-line">
                    <value.icon className="size-4" />
                  </span>
                  <p className="mt-3 text-[0.9375rem] font-semibold text-navy">{value.title}</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate-ink">{value.body}</p>
                </div>
              ))}
            </div>

            <Link href="/quote" className="btn btn-primary mt-7">
              Send your first delivery <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad border-y border-line bg-mist">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="eyebrow">
              <span className="h-px w-6 bg-cyan" /> Milestones
            </p>
            <h2 className="display-2 mt-3 text-navy">From one rider to a city platform.</h2>
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {timeline.map((item) => (
              <li key={item.year} className="relative rounded-xl border border-line bg-white p-5">
                <span className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-cyan">
                  {item.year}
                </span>
                <p className="mt-2 font-display text-[1rem] font-semibold tracking-tight text-navy">{item.title}</p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate-ink">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-x grid gap-8 lg:grid-cols-3">
          {[
            {
              icon: Bike,
              title: "Ride with us",
              body: "Own a bicycle, e-bike or motorcycle? Onboard with your documents and guarantor, then start earning on the next-day settlement cycle.",
              cta: "Start rider onboarding",
              href: "/contact#riders",
            },
            {
              icon: Building2,
              title: "Partner as a vendor",
              body: "Restaurants, pharmacies, laundry and grocery stores get contract rates, a dispatch board and exportable reports.",
              cta: "Apply as a vendor",
              href: "/contact#vendors",
            },
            {
              icon: HeartHandshake,
              title: "Work with us",
              body: "Operations, dispatch and market-run roles open regularly in Calabar. Tell us what you’re good at.",
              cta: "See open roles",
              href: "/contact",
            },
          ].map((card) => (
            <div key={card.title} className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-card)]">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan/10 text-cyan">
                <card.icon className="size-5" />
              </span>
              <h3 className="display-3 mt-4 text-navy">{card.title}</h3>
              <p className="mt-2 flex-1 text-[0.875rem] leading-relaxed text-slate-ink">{card.body}</p>
              <Link href={card.href} className="mt-5 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-cyan">
                {card.cta} <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
