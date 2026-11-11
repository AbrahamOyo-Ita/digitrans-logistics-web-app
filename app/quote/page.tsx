import type { Metadata } from "next";
import { PageHead } from "@/components/ui/PageHead";
import { BookingForm } from "./BookingForm";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Book a delivery",
  description:
    "Build a live delivery estimate and request a rider anywhere in Calabar. Base fee, distance and extras shown before you confirm.",
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <>
      <PageHead
        eyebrow="Book a delivery"
        title="Book a delivery."
        lead="Pick a service and two zones. The fare, distance and delivery window update as you go — the same calculation dispatch uses."
        trail={[{ label: "Book a delivery" }]}
        image="/images/handover.jpg"
        imageAlt="A DigiTrans rider handing over a parcel"
      />

      <section className="section-tight bg-white">
        <div className="container-x">
          <BookingForm />
        </div>
      </section>

      <section className="border-t border-line bg-paper py-8">
        <div className="container-x flex flex-col items-start justify-between gap-3 text-[0.8125rem] sm:flex-row sm:items-center">
          <p className="text-slate-ink">
            Dispatch answers {site.hours}. Cash, transfer and online payment are all accepted.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={site.phoneHref} className="pill pill-line pill-sm">
              Call {site.phone}
            </a>
            <a href={site.whatsappHref} className="pill pill-navy pill-sm">
              Message dispatch
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
