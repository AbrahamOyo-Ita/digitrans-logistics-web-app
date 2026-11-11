import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    step: "1",
    title: "Set the route",
    body: "Choose a service, pick your zones or add a landmark. You see the fare and window immediately.",
  },
  {
    step: "2",
    title: "Confirm and pay",
    body: "Pay online, by transfer, or in cash to the rider. Vendors settle weekly on contract rates.",
  },
  {
    step: "3",
    title: "A rider is matched",
    body: "The nearest verified rider is assigned within minutes — bicycle, e-bike or motorcycle.",
  },
  {
    step: "4",
    title: "Track to the door",
    body: "Follow each status update, share the link, and receive photo proof when it lands.",
  },
];

export function HowItWorks() {
  return (
    <section className="section bg-white">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="display-2 max-w-[16ch]">Four steps, under a minute.</h2>
            <p className="body-sm mt-5 max-w-sm">
              No app download required to book. The rider app and customer portal handle the rest.
            </p>
            <Link href="/quote" className="pill pill-navy mt-7">
              Start a booking
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ol className="grid gap-px bg-line sm:grid-cols-2 lg:col-span-8">
            {steps.map((s) => (
              <li key={s.step} className="bg-white p-6 sm:p-7">
                <span className="font-mono text-[0.6875rem] tabular-nums text-muted">0{s.step}</span>
                <h3 className="mt-3 font-display text-[1.0625rem] font-medium tracking-tight text-navy">
                  {s.title}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-ink">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
