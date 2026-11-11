import type { Metadata } from "next";
import { generateReference, lookupTracking } from "@/lib/tracking";

export const metadata: Metadata = {
  title: "Track a delivery",
  description: "Track a DigiTrans delivery or waybill in real time with your reference number.",
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
      <section className="relative overflow-hidden bg-navy py-14 text-white sm:py-20">
        <div className="absolute inset-0 radial-glow opacity-60" aria-hidden />
        <div className="absolute inset-0 grid-lines opacity-20" aria-hidden />
        <div className="container-x relative">
          <p className="eyebrow text-cyan-300">
            <span className="h-px w-6 bg-cyan-300" /> Tracking
          </p>
          <h1 className="display-2 mt-3 max-w-2xl text-white">Where is my delivery?</h1>
          <p className="lede mt-4 max-w-xl text-white/70">
            Enter the reference from your booking confirmation — it looks like{" "}
            <span className="font-mono text-cyan-300">{generateReference()}</span>.
          </p>

          <form action="/track" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="ref">
              Tracking reference
            </label>
            <input
              id="ref"
              name="ref"
              defaultValue={reference ?? ""}
              placeholder="DT-CAL-0000-0000"
              className="field flex-1 border-white/15 bg-white/10 text-white placeholder:text-white/35 focus:border-cyan-300 focus:bg-white/15"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="btn btn-primary">
              Track it
            </button>
          </form>
        </div>
      </section>

      <section className="pb-16 pt-10 sm:pb-20 sm:pt-12 bg-mist">
        <div className="container-x max-w-3xl">
          {!reference && (
            <div className="rounded-2xl border border-line bg-white p-8 text-center">
              <p className="font-display text-lg font-semibold text-navy">No reference yet?</p>
              <p className="mx-auto mt-2 max-w-md text-[0.875rem] leading-relaxed text-slate-ink">
                Your reference is in the confirmation SMS, email and receipt. If you booked by phone or
                WhatsApp, our dispatch desk can look it up with your name and phone number.
              </p>
            </div>
          )}

          {reference && !result && (
            <div className="rounded-2xl border border-danger/25 bg-danger/5 p-6">
              <p className="font-display text-lg font-semibold text-navy">
                We couldn’t find {reference}
              </p>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-slate-ink">
                Check the reference and try again. References use the format DT-CAL-####-####. For
                waybills the reference starts with DT-WB. If it still doesn’t resolve, contact dispatch.
              </p>
            </div>
          )}

          {result && (
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-mist p-5 sm:p-6">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    {result.service}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold tracking-tight text-navy">
                    {result.pickup} → {result.dropoff}
                  </p>
                  <p className="mt-1 font-mono text-[0.75rem] text-muted">{result.reference}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/10 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-cyan-600 ring-1 ring-inset ring-cyan/25">
                  {result.status}
                </span>
              </div>

              <div className="grid gap-px bg-line sm:grid-cols-3">
                {[
                  { label: "Booked", value: formatDate(result.createdAt) },
                  { label: "Recipient", value: result.recipient },
                  { label: "Rider", value: result.rider },
                ].map((item) => (
                  <div key={item.label} className="bg-white p-5">
                    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</p>
                    <p className="mt-1 text-[0.875rem] font-medium text-navy">{item.value}</p>
                  </div>
                ))}
              </div>

              <ol className="relative space-y-5 border-t border-line p-5 sm:p-6">
                <span className="absolute left-[1.65rem] top-8 bottom-8 w-px bg-line sm:left-[1.9rem]" aria-hidden />
                {result.events.map((event, i) => {
                  const latest = i === result.events.length - 1;
                  return (
                    <li key={event.label} className="relative flex gap-3.5">
                      <span
                        className={
                          latest
                            ? "relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-cyan bg-cyan text-white ring-4 ring-cyan/15"
                            : "relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-line bg-white text-[0.6rem] font-bold text-muted"
                        }
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className={latest ? "text-[0.9375rem] font-semibold text-navy" : "text-[0.9375rem] font-medium text-slate-ink"}>
                          {event.label}
                          {latest && (
                            <span className="ml-2 rounded bg-cyan/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-cyan-600">
                              latest
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[0.75rem] text-muted">
                          {formatDate(event.at)} · {event.note}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-line bg-white p-5 text-[0.8125rem] leading-relaxed text-slate-ink">
            <strong className="font-semibold text-navy">Demo tracking:</strong> this preview resolves
            these sample references — <span className="font-mono">DT-CAL-8842-5117</span> (in transit),{" "}
            <span className="font-mono">DT-CAL-3016-7702</span> (delivered) and{" "}
            <span className="font-mono">DT-WB-4471-2200</span> (waybill). Live tracking connects to the
            operations backend in the next build phase.
          </div>
        </div>
      </section>
    </>
  );
}
