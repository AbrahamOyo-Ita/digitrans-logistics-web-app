import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHead } from "@/components/ui/PageHead";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "DigiTrans Logistics is a Calabar-built delivery company running bicycles, e-bikes and motorcycles across Cross River State. Meet the team and the operating model.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    title: "Fares, not guesswork",
    body: "Pricing is calculated from zones and distance. Nobody should have to haggle at the door, and nobody should be surprised by a charge added in traffic.",
  },
  {
    title: "Riders are staff, not contractors",
    body: "A published commission split, next-day settlement and a ledger riders can read for themselves.",
  },
  {
    title: "Cleaner last mile",
    body: "Bicycles and electric cargo bikes cover short campus and market runs; motorcycles handle distance and inter-city waybills.",
  },
  {
    title: "Local accountability",
    body: "The dispatch desk sits on Marian Road, staffed by people who know the streets we serve.",
  },
];

const timeline = [
  { year: "2021", title: "One bicycle, one rider", body: "Campus deliveries around UNICAL and the Ekorinim hostels." },
  { year: "2022", title: "Market runs", body: "Watt Market runners added for busy professionals and clinics." },
  { year: "2023", title: "Vendor accounts", body: "Restaurants, pharmacies and groceries move dispatch onto our board." },
  { year: "2024", title: "Waybill network", body: "Calabar to Uyo, Port Harcourt and Abuja line-haul routes open." },
  { year: "2025", title: "Electric cargo fleet", body: "E-bikes join the bicycle and motorcycle fleet at Marian Road." },
  { year: "2026", title: "Operations platform", body: "Customer portal, rider app and the dispatch console roll out." },
];

export default function AboutPage() {
  return (
    <>
      <PageHead
        eyebrow="About us"
        title="We started with one bicycle in Calabar."
        lead="DigiTrans Logistics is a delivery company built in Cross River State — our own riders, our own runners and a dispatch desk that answers. The platform is the upgrade, not the origin story."
        trail={[{ label: "About" }]}
        image="/images/depot.jpg"
        imageAlt="The DigiTrans depot"
      >
        <div className="mt-8 grid max-w-2xl grid-cols-2 gap-x-10 gap-y-5 border-t border-white/15 pt-6 sm:grid-cols-4">
          {[
            { k: "Deliveries", v: site.stats.deliveries },
            { k: "Riders & runners", v: site.stats.riders },
            { k: "On time", v: site.stats.onTime },
            { k: "Business partners", v: site.stats.partners },
          ].map((s) => (
            <div key={s.k}>
              <p className="font-display text-[1.375rem] font-medium leading-none tracking-tight text-white">{s.v}</p>
              <p className="mt-1.5 text-[0.75rem] text-white/45">{s.k}</p>
            </div>
          ))}
        </div>
      </PageHead>

      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="display-2 max-w-[22ch]">An operator, not a marketplace.</h2>
            <div className="mt-6 space-y-5 body-sm">
              <p>
                We hire, vet and equip our own riders. That means a guarantor on file, a signed rider
                agreement and a dispatch team that can pick up the phone when something goes wrong.
              </p>
              <p>
                Because we control the last mile end to end, we can commit to things aggregators
                cannot: a fixed campus rate, a reconciled market run, and a fare that does not change
                between the quote and the door.
              </p>
              <p>
                We are deliberately small. Calabar is our whole market, not a pilot city — so the
                routes, the riders and the pricing are all built around how this city actually moves.
              </p>
            </div>

            <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2">
              {values.map((value) => (
                <div key={value.title} className="bg-white p-5">
                  <p className="text-[0.9375rem] font-medium text-navy">{value.title}</p>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-slate-ink">{value.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <figure>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-navy">
                <Image
                  src="/images/rider-portrait.jpg"
                  alt="A DigiTrans rider with his cargo bike"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-[50%_25%]"
                />
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-[0.75rem] text-muted">
                <span>Emeka O. — rider since 2023</span>
                <span>CRD-114</span>
              </figcaption>
            </figure>

            <div className="mt-8 border-t border-line pt-5">
              <p className="text-[0.875rem] font-medium text-navy">Operating details</p>
              <dl className="mt-3 divide-y divide-line border-y border-line">
                {[
                  { k: "Legal name", v: "DigiTrans Logistics Ltd." },
                  { k: "Depot", v: site.address },
                  { k: "Hours", v: site.hours },
                  { k: "Service area", v: "Calabar Municipality, Calabar South, Akpabuyo" },
                ].map((row) => (
                  <div key={row.k} className="flex items-start justify-between gap-6 py-2.5">
                    <dt className="shrink-0 text-[0.75rem] text-muted">{row.k}</dt>
                    <dd className="text-right text-[0.8125rem] text-navy">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-paper">
        <div className="container-x">
          <h2 className="display-2 max-w-[20ch]">From one rider to a city platform.</h2>
          <ol className="mt-10 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {timeline.map((item) => (
              <li key={item.year} className="bg-white p-6">
                <span className="font-mono text-[0.6875rem] tabular-nums text-muted">{item.year}</span>
                <p className="mt-3 text-[0.9375rem] font-medium text-navy">{item.title}</p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-slate-ink">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          <h2 className="display-2 max-w-[20ch]">Work with us.</h2>
          <div className="mt-10 grid gap-px border border-line bg-line lg:grid-cols-3">
            {[
              {
                title: "Ride with DigiTrans",
                body: "Bicycle, e-bike or motorcycle owners in Calabar. Bring a valid ID and a guarantor, accept the rider agreement, and start earning on the next-day settlement cycle.",
                cta: "Start rider onboarding",
                href: "/contact#riders",
              },
              {
                title: "Become a vendor",
                body: "Restaurants, pharmacies, laundry and grocery stores get contract rates, a dispatch board and exportable delivery reports.",
                cta: "Apply as a vendor",
                href: "/contact#vendors",
              },
              {
                title: "Join operations",
                body: "Dispatch, market-run and support roles open regularly in Calabar. Tell us what you are good at and we will keep your details on file.",
                cta: "Send your details",
                href: "/contact",
              },
            ].map((card) => (
              <div key={card.title} className="flex flex-col bg-white p-6">
                <h3 className="text-[1.0625rem] font-medium text-navy">{card.title}</h3>
                <p className="mt-2 flex-1 text-[0.8125rem] leading-relaxed text-slate-ink">{card.body}</p>
                <Link href={card.href} className="link-underline mt-6 self-start">
                  {card.cta}
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
