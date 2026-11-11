import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHead } from "@/components/ui/PageHead";
import { Eyebrow } from "@/components/ui/Bits";
import { QuoteWidget } from "@/components/ui/QuoteWidget";
import { PRICING, formatNaira } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing & tariffs",
  description:
    "DigiTrans published tariffs: base fee plus distance for delivery, weight tiers for waybills, flat campus rate for students and contract pricing for vendors in Calabar.",
  alternates: { canonical: "/pricing" },
};

const table = [
  {
    service: "Standard delivery",
    basis: `Base ${formatNaira(PRICING.baseFee)} + ${formatNaira(PRICING.ratePerKm)} per km`,
    minimum: formatNaira(PRICING.minimumFee),
    notes: "Surcharges below apply.",
  },
  {
    service: "Market run",
    basis: `Shopping budget + ${formatNaira(PRICING.marketRunFee)} service fee`,
    minimum: "—",
    notes: "Budget held and reconciled; change returned.",
  },
  {
    service: "Waybill — under 5 kg",
    basis: "Flat weight tier",
    minimum: formatNaira(1_500),
    notes: "Weight verified at the counter.",
  },
  {
    service: "Waybill — 5 to 10 kg",
    basis: "Flat weight tier",
    minimum: formatNaira(3_000),
    notes: "Volumetric weight may apply.",
  },
  {
    service: "Waybill — above 10 kg",
    basis: `${formatNaira(250)} per kilogram`,
    minimum: "—",
    notes: "Declared-value cover quoted separately.",
  },
  {
    service: "Verified student",
    basis: "Flat rate inside campus zones",
    minimum: formatNaira(PRICING.studentFlat),
    notes: "Requires approved student ID.",
  },
  {
    service: "Vendor contract",
    basis: "10% off standard tariff",
    minimum: "By agreement",
    notes: "Invoiced weekly or monthly.",
  },
];

const extras = [
  { label: "Priority delivery", amount: formatNaira(PRICING.urgentSurcharge), body: "Next available rider, ahead of queued jobs." },
  { label: "Careful handling", amount: formatNaira(PRICING.fragileSurcharge), body: "For glassware, electronics and liquids." },
  { label: "Declared-value cover", amount: "From " + formatNaira(1_000), body: "On waybills above ₦50,000 in value." },
  { label: "Scheduled pickup", amount: "No premium", body: "Standard tariff, reserved window." },
];

export default function PricingPage() {
  return (
    <>
      <PageHead
        eyebrow="Pricing"
        title="Published tariffs, no enquiry form."
        lead="These are the rates we work to across Calabar. Every fare you see in the app is calculated from this table — plus only the extras you choose."
        trail={[{ label: "Pricing" }]}
        image="/images/depot.jpg"
        imageAlt="DigiTrans depot on Marian Road"
      />

      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow>Rate card</Eyebrow>
            <h2 className="display-3 mt-2.5">Core tariffs</h2>
            <div className="mt-5 border-t border-line">
              {table.map((row) => (
                <div key={row.service} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[1.1fr_1.3fr_auto] sm:items-baseline sm:gap-6">
                  <p className="text-[0.875rem] font-medium text-navy">{row.service}</p>
                  <div>
                    <p className="text-[0.8125rem] tabular-nums text-slate-ink">{row.basis}</p>
                    <p className="mt-0.5 text-[0.75rem] text-muted">{row.notes}</p>
                  </div>
                  <p className="text-[0.8125rem] tabular-nums text-navy sm:text-right">{row.minimum}</p>
                </div>
              ))}
            </div>

            <h2 className="display-3 mt-14">Optional extras</h2>
            <div className="mt-5 grid gap-px bg-line sm:grid-cols-2">
              {extras.map((extra) => (
                <div key={extra.label} className="bg-white p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[0.875rem] font-medium text-navy">{extra.label}</p>
                    <p className="shrink-0 text-[0.8125rem] tabular-nums text-navy">{extra.amount}</p>
                  </div>
                  <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted">{extra.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 border-l-2 border-cyan bg-paper p-5">
              <p className="text-[0.875rem] font-medium text-navy">Zone fallback</p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-slate-ink">
                Where a landmark cannot be resolved to GPS, we charge a fixed zone-to-zone rate agreed
                in advance, so the fare never changes mid-trip. Deliveries outside our twelve zones
                are routed daily through Uyo, Port Harcourt and Abuja at waybill rates.
              </p>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <Eyebrow>Calculator</Eyebrow>
              <h2 className="display-3 mt-2.5">Work out a fare</h2>
              <p className="body-sm mt-2">
                Choose two zones to see the exact charge, distance and delivery window.
              </p>
              <div className="mt-5">
                <QuoteWidget variant="full" />
              </div>
              <p className="mt-4 text-[0.75rem] leading-relaxed text-muted">
                Prices shown include every applicable line. Nothing is added at the door.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-line bg-paper py-12">
        <div className="container-x flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-[1.125rem] font-medium tracking-tight text-navy">
              Moving more than a few parcels a week?
            </p>
            <p className="mt-1 text-[0.8125rem] text-slate-ink">
              Vendor contracts are priced on your routes and volume — usually below the table above.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact#vendors" className="pill pill-navy pill-sm">
              Ask about vendor rates
            </Link>
            <Link href="/quote" className="pill pill-line pill-sm">
              Book a delivery <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
