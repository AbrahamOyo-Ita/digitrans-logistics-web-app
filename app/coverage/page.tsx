import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHead } from "@/components/ui/PageHead";
import { ZONES } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Coverage across Calabar",
  description:
    "Twelve delivery zones across Calabar Municipality, Calabar South and Akpabuyo — plus daily waybill routes to Uyo, Port Harcourt and Abuja.",
  alternates: { canonical: "/coverage" },
};

const landmarks: Record<string, string[]> = {
  "duke-town": ["Duke Town clock", "Old Residency", "Marina Road"],
  "watt-market": ["Watt Market", "Harbour Road", "Target Road"],
  marian: ["Marian Road", "Atekong Drive", "Palm Street"],
  "state-housing": ["State Housing Estate", "Federal Housing", "Big Qua"],
  ekorinim: ["Ekorinim Junction", "Goldie Street", "Hostel row"],
  unical: ["UNICAL main gate", "Faculty of Law", "Staff quarters"],
  unicross: ["UNICROSS Calabar campus", "College Road"],
  "8-miles": ["8 Miles Junction", "Airport Road", "Calabar free trade zone"],
  "ikot-ishie": ["Ikot Ishie market", "Ndidem Usang Iso Road"],
  anantigha: ["Anantigha junction", "Ekpo Abasi Street"],
  "henshaw-town": ["Henshaw Town", "Bedwell Street"],
  ediba: ["Ediba quay", "Calabar South waterfront"],
  akpabuyo: ["Akpabuyo town", "Ikot Nakanda road"],
  atakpa: ["Atakpa", "Parliament Road"],
};

const byLga = ["Calabar Municipality", "Calabar South", "Akpabuyo"] as const;

export default function CoveragePage() {
  return (
    <>
      <PageHead
        eyebrow="Coverage"
        title="Calabar, mapped the way people give directions."
        lead="Twelve zones built around landmarks, junctions and markets — not postcodes. Every zone carries a fixed rate card, with GPS distance used wherever a landmark resolves cleanly."
        trail={[{ label: "Coverage" }]}
        image="/images/market-run.jpg"
        imageAlt="A DigiTrans runner in a Calabar market"
      >
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-6">
          {[
            { value: "12", label: "Delivery zones" },
            { value: "3", label: "LGAs covered" },
            { value: "3", label: "Inter-state routes" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-[1.5rem] font-medium leading-none tracking-tight text-white">{s.value}</p>
              <p className="mt-1.5 text-[0.75rem] text-white/45">{s.label}</p>
            </div>
          ))}
        </div>
      </PageHead>

      <section className="section bg-white">
        <div className="container-x">
          <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="display-2 max-w-[18ch]">Every zone, and what is inside it.</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <p className="body-sm">
                If your street is not listed, send us the nearest landmark — we resolve most
                requests within a working day. Zones outside this list can still be served by
                arrangement.
              </p>
            </div>
          </div>

          {byLga.map((lga) => {
            const list = ZONES.filter((z) => z.lga === lga);
            return (
              <div key={lga} className="grid gap-6 border-b border-line py-10 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-3">
                  <h3 className="display-3">{lga}</h3>
                  <p className="mt-1.5 text-[0.75rem] text-muted">
                    {list.length} {list.length === 1 ? "zone" : "zones"}
                  </p>
                </div>
                <div className="grid gap-px bg-line sm:grid-cols-2 lg:col-span-9 lg:grid-cols-3">
                  {list.map((zone) => (
                    <div key={zone.id} className="bg-white p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[0.875rem] font-medium text-navy">{zone.name}</p>
                        {zone.campus && (
                          <span className="shrink-0 text-[0.625rem] uppercase tracking-[0.1em] text-cyan">
                            Student rate
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[0.75rem] leading-relaxed text-muted">
                        {(landmarks[zone.id] ?? []).join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mt-12 grid gap-0 border border-line lg:grid-cols-2">
            <div className="relative min-h-[18rem]">
              <Image
                src="/images/waybill.jpg"
                alt="A DigiTrans clerk weighing a parcel"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="p-7 sm:p-10">
              <p className="text-[0.75rem] font-medium text-muted">Beyond the city</p>
              <h3 className="display-3 mt-2">Daily waybill routes.</h3>
              <p className="body-sm mt-3 max-w-[44ch]">
                Parcels leaving Calabar move on scheduled line-haul runs, with scans at dispatch and
                arrival. Weight is verified at our Marian Road counter.
              </p>
              <dl className="mt-6 divide-y divide-line border-y border-line">
                {[
                  { route: "Calabar → Uyo", time: "Next day" },
                  { route: "Calabar → Port Harcourt", time: "Next day" },
                  { route: "Calabar → Abuja", time: "2 – 3 days" },
                ].map((r) => (
                  <div key={r.route} className="flex items-baseline justify-between py-3">
                    <dt className="text-[0.875rem] text-navy">{r.route}</dt>
                    <dd className="text-[0.8125rem] text-muted">{r.time}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/services/waybills" className="link-underline mt-6">
                Waybill pricing
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-paper py-12">
        <div className="container-x flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-[1.125rem] font-medium tracking-tight text-navy">
              Not sure which zone you are in?
            </p>
            <p className="mt-1 text-[0.8125rem] text-slate-ink">
              Tell us the landmark and we will confirm the fare and window.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/quote" className="pill pill-navy pill-sm">
              Price a route
            </Link>
            <Link href="/contact" className="pill pill-line pill-sm">
              Ask dispatch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
