import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRICING, formatNaira } from "@/lib/pricing";

const rows = [
  { service: "Standard delivery", basis: "Base fee plus distance", rate: `${formatNaira(PRICING.baseFee)} + ${formatNaira(PRICING.ratePerKm)}/km`, minimum: formatNaira(PRICING.minimumFee) },
  { service: "Market run", basis: "Shopping budget plus service fee", rate: `${formatNaira(PRICING.marketRunFee)} fee`, minimum: "Budget held" },
  { service: "Waybill — under 5 kg", basis: "Weight tier, verified at the counter", rate: formatNaira(1_500), minimum: "—" },
  { service: "Waybill — 5 to 10 kg", basis: "Weight tier, verified at the counter", rate: formatNaira(3_000), minimum: "—" },
  { service: "Waybill — above 10 kg", basis: "Per kilogram above 10 kg", rate: `${formatNaira(250)}/kg`, minimum: "—" },
  { service: "Verified student", basis: "Flat rate inside campus zones", rate: formatNaira(PRICING.studentFlat), minimum: "₦500 flat" },
  { service: "Vendor contract", basis: "Standard tariff with contract discount", rate: "10% off", minimum: "By agreement" },
];

export function Pricing() {
  return (
    <section className="section bg-paper">
      <div className="container-x">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="display-2 max-w-[22ch]">Published tariffs, no enquiry form.</h2>
          </div>
          <div className="lg:col-span-5">
            <p className="body-sm">
              These are the rates we work to. Priority adds {formatNaira(PRICING.urgentSurcharge)} and
              careful handling adds {formatNaira(PRICING.fragileSurcharge)}. Nothing else is added on
              the day.
            </p>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-white">
                <th className="px-5 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">Service</th>
                <th className="px-5 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">How it is calculated</th>
                <th className="px-5 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">Rate</th>
                <th className="px-5 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">Minimum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.service} className="transition-colors hover:bg-paper">
                  <td className="px-5 py-4 text-[0.875rem] font-medium text-navy">{row.service}</td>
                  <td className="px-5 py-4 text-[0.8125rem] text-slate-ink">{row.basis}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[0.875rem] tabular-nums text-navy">{row.rate}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[0.8125rem] tabular-nums text-muted">{row.minimum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-xl text-[0.8125rem] leading-relaxed text-muted">
            Where a landmark cannot be resolved to GPS, we fall back to a fixed zone-to-zone rate so
            the fare never changes mid-trip.
          </p>
          <Link href="/quote" className="link-underline shrink-0">
            Price my delivery
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
