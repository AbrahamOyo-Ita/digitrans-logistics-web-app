import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { PRICING, formatNaira } from "@/lib/pricing";

const cards = [
  {
    title: "Standard delivery",
    rate: "from " + formatNaira(PRICING.minimumFee),
    formula: `${formatNaira(PRICING.baseFee)} base + ${formatNaira(PRICING.ratePerKm)}/km`,
    points: ["Minimum fare " + formatNaira(PRICING.minimumFee), "Priority +" + formatNaira(PRICING.urgentSurcharge), "Careful handling +" + formatNaira(PRICING.fragileSurcharge)],
    accent: false,
  },
  {
    title: "Market runs",
    rate: formatNaira(PRICING.marketRunFee) + " fee",
    formula: "Shopping budget + flat service fee",
    points: ["Budget held, then reconciled", "Receipts on every purchase", "Unspent balance returned"],
    accent: true,
  },
  {
    title: "Waybills",
    rate: "from " + formatNaira(PRICING.waybillTiers[0].price),
    formula: "Tiered by weight, verified at the counter",
    points: ["Under 5 kg " + formatNaira(1_500), "5 – 10 kg " + formatNaira(3_000), "Above 10 kg ₦250/kg"],
    accent: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="section-pad relative overflow-hidden bg-mist">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mx-auto justify-center">
            <span className="h-px w-6 bg-cyan" /> Transparent pricing
          </p>
          <h2 className="display-2 mt-3 text-navy">A fare you can predict.</h2>
          <p className="lede mt-4">
            Our engine calculates base fee, distance and surcharges before you confirm. Student and
            vendor rates are applied automatically — never after the fact.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className={
                card.accent
                  ? "relative flex flex-col rounded-2xl bg-navy p-6 pt-7 text-white shadow-[var(--shadow-lift)] ring-1 ring-white/10"
                  : "relative flex flex-col rounded-2xl border border-line bg-white p-6 pt-7 shadow-[var(--shadow-card)]"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <p className={card.accent ? "text-[0.8125rem] font-medium text-cyan-300" : "text-[0.8125rem] font-medium text-muted"}>
                  {card.title}
                </p>
                {card.accent && (
                  <span className="rounded-full bg-cyan px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-white">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight">{card.rate}</p>
              <p className={card.accent ? "mt-1 text-[0.75rem] text-white/55" : "mt-1 text-[0.75rem] text-muted"}>
                {card.formula}
              </p>
              <ul className={card.accent ? "mt-5 space-y-2.5 border-t border-white/10 pt-5" : "mt-5 space-y-2.5 border-t border-line pt-5"}>
                {card.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[0.8125rem]">
                    <span
                      className={
                        card.accent
                          ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-300"
                          : "mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan"
                      }
                    />
                    <span className={card.accent ? "text-white/75" : "text-slate-ink"}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center">
          <p className="flex items-start gap-3 text-[0.8125rem] leading-relaxed text-slate-ink">
            <Info className="mt-0.5 size-4 shrink-0 text-cyan" />
            <span>
              <strong className="font-semibold text-navy">Zone fallback pricing.</strong> Where a landmark
              can’t be resolved to GPS, we fall back to a fixed zone-to-zone rate so the fare never
              changes mid-trip.
            </span>
          </p>
          <Link href="/quote" className="btn btn-dark btn-sm shrink-0">
            Price my delivery
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
