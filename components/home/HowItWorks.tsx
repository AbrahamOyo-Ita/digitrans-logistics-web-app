import Link from "next/link";
import { ArrowRight, Bike, MapPin, PackageCheck, Wallet } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    step: "01",
    title: "Set the route",
    body: "Choose a service, pick your zones or type a landmark. You get an itemised fare immediately.",
  },
  {
    icon: Wallet,
    step: "02",
    title: "Confirm & pay",
    body: "Pay online, by transfer, or cash to the rider. Vendors settle weekly on contract rates.",
  },
  {
    icon: Bike,
    step: "03",
    title: "A rider is matched",
    body: "The nearest verified rider is assigned within minutes — bicycle, e-bike or motorcycle.",
  },
  {
    icon: PackageCheck,
    step: "04",
    title: "Track to the door",
    body: "Follow live statuses, share the link, and receive photo proof when it lands.",
  },
];

export function HowItWorks() {
  return (
    <section className="section-pad border-y border-line bg-mist">
      <div className="container-x">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mx-auto justify-center">
            <span className="h-px w-6 bg-cyan" /> How it works
          </p>
          <h2 className="display-2 mt-3 text-navy">Four steps, under a minute.</h2>
          <p className="lede mt-4">
            No app download required to book. The rider app and customer portal deliver the rest.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.step}
              className="group relative flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-cyan/10 text-cyan transition group-hover:bg-cyan group-hover:text-white">
                  <step.icon className="size-[1.15rem]" />
                </span>
                <span className="font-display text-2xl font-bold tracking-tight text-navy/15">{step.step}</span>
              </div>
              <h3 className="mt-4 font-display text-[1rem] font-semibold tracking-tight text-navy">{step.title}</h3>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-slate-ink">{step.body}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 hidden size-4 -translate-y-1/2 text-line lg:block" aria-hidden />
              )}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-navy p-6 text-white sm:flex-row sm:p-7">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">A business? Get the vendor dashboard.</p>
            <p className="mt-1 text-[0.875rem] text-white/60">
              Contract pricing, multi-stop dispatch and exportable reports — no subscription.
            </p>
          </div>
          <Link href="/contact#vendors" className="btn btn-primary shrink-0">
            Apply as a vendor
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
