import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PageHead } from "@/components/ui/PageHead";
import { generateReference, lookupTracking } from "@/lib/tracking";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Track a delivery",
  description: "Track a DigiTrans delivery or waybill in real time using your reference number.",
  alternates: { canonical: "/track" },
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.ref?.trim().toUpperCase();
  const result = reference ? lookupTracking(reference) : null;

  return (
    <>
      <PageHead
        title="Where is my delivery?"
        lead="Enter the reference from your booking confirmation. It looks like DT-CAL-0000-0000, and waybill references start with DT-WB."
        trail={[{ label: "Track" }]}
      >
        <form action="/track" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="ref">
            Tracking reference
          </label>
          <input
            id="ref"
            name="ref"
            defaultValue={reference ?? ""}
            placeholder={generateReference()}
            className="field field-dark flex-1"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="btn btn-on-dark">
            Track
          </button>
        </form>
      </PageHead>

      <section className="section-tight bg-white">
        <div className="container-x max-w-4xl">
          {!reference && (
            <div className="border border-line p-6 sm:p-8">
              <p className="font-display text-[1.125rem] font-medium tracking-tight text-navy">No reference yet?</p>
              <p className="mt-2 max-w-xl text-[0.875rem] leading-relaxed text-slate-ink">
                Your reference is on the booking confirmation, receipt and SMS. If you booked by phone
                or WhatsApp, dispatch can look it up with your name and number.
              </p>
            </div>
          )}

          {reference && !result && (
            <div className="border-l-2 border-danger bg-paper p-6">
              <p className="font-display text-[1.125rem] font-medium tracking-tight text-navy">
                We could not find {reference}
              </p>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-slate-ink">
                Check the reference and try again — the format is DT-CAL-####-####, or DT-WB for
                waybills. If it still does not resolve,{" "}
                <a href={site.phoneHref} className="font-medium text-navy underline decoration-line-strong underline-offset-2">
                  call dispatch
                </a>
                .
              </p>
            </div>
          )}

          {result && (
            <div className="border border-line bg-white">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
                <div>
                  <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">{result.service}</p>
                  <p className="mt-1.5 font-display text-[1.25rem] font-medium tracking-tight text-navy">
                    {result.pickup} → {result.dropoff}
                  </p>
                  <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted">
                    {result.reference}
                  </p>
                </div>
                <p className="border border-cyan/40 px-2.5 py-1 text-[0.75rem] font-medium text-cyan">
                  {result.status}
                </p>
              </div>

              <dl className="grid border-b border-line sm:grid-cols-3">
                {[
                  { label: "Booked", value: formatDate(result.createdAt) },
                  { label: "Recipient", value: result.recipient },
                  { label: "Rider", value: result.rider },
                ].map((item) => (
                  <div key={item.label} className="border-b border-line px-6 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                    <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-muted">{item.label}</dt>
                    <dd className="mt-1 text-[0.875rem] text-navy">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <ol className="px-6 py-2">
                {result.events.map((event, i) => {
                  const latest = i === result.events.length - 1;
                  return (
                    <li key={event.label} className="flex gap-4 border-b border-line py-4 last:border-b-0">
                      <span
                        className={
                          latest
                            ? "mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded-full bg-cyan text-white"
                            : "mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded-full bg-navy/10 text-navy"
                        }
                      >
                        {latest ? <Check className="size-2.5" strokeWidth={3.5} /> : <span className="size-1 rounded-full bg-navy/30" />}
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                          <p className={latest ? "text-[0.9375rem] font-medium text-navy" : "text-[0.9375rem] text-slate-ink"}>
                            {event.label}
                          </p>
                          <span className="font-mono text-[0.6875rem] tabular-nums text-muted">{formatDate(event.at)}</span>
                        </div>
                        <p className="mt-0.5 text-[0.8125rem] text-muted">{event.note}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="mt-6 border border-line bg-paper p-5 text-[0.8125rem] leading-relaxed text-slate-ink">
            <span className="font-medium text-navy">Demo tracking.</span> This preview resolves three
            sample references: <span className="font-mono text-navy">DT-CAL-8842-5117</span> (out for
            delivery), <span className="font-mono text-navy">DT-CAL-3016-7702</span> (delivered) and{" "}
            <span className="font-mono text-navy">DT-WB-4471-2200</span> (waybill). Live lookups connect
            to the operations backend in the next build phase.
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[0.8125rem] text-slate-ink">Need a delivery moving today?</p>
            <Link href="/quote" className="btn btn-primary btn-sm">
              Book a delivery
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
