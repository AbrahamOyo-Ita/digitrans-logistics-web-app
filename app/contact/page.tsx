import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { faqs, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact & support",
  description:
    "Reach DigiTrans Logistics in Calabar — dispatch desk, vendor applications, rider onboarding, complaints and FAQs.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy py-14 text-white sm:py-20">
        <div className="absolute inset-0 radial-glow opacity-55" aria-hidden />
        <div className="absolute inset-0 grid-lines opacity-20" aria-hidden />
        <div className="container-x relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="eyebrow text-cyan-300">
              <span className="h-px w-6 bg-cyan-300" /> Contact
            </p>
            <h1 className="display-2 mt-3 max-w-xl text-white">A person answers. Every time.</h1>
            <p className="lede mt-4 max-w-lg text-white/70">
              Dispatch, deliveries, vendor onboarding or a complaint — pick the fastest route below and
              we’ll take it from there.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { icon: Phone, label: "Dispatch desk", value: site.phone, href: site.phoneHref },
              { icon: MessageCircle, label: "WhatsApp", value: site.whatsapp, href: site.whatsappHref },
              { icon: Mail, label: "Email", value: site.email, href: site.emailHref },
              { icon: Clock, label: "Hours", value: site.hours },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href ?? undefined}
                className="group rounded-xl border border-white/12 bg-white/5 p-4 backdrop-blur transition hover:border-cyan-300/40 hover:bg-white/10"
              >
                <span className="flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-white/45">
                  <item.icon className="size-3.5 text-cyan-300" /> {item.label}
                </span>
                <span className="mt-1.5 block text-[0.875rem] font-medium text-white">{item.value}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <h2 className="display-3 text-navy">Send us a message</h2>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-slate-ink">
              Tell us what you need. For live deliveries, calling the dispatch desk is always faster.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-line bg-mist">
              <div className="relative h-56 bg-navy">
                <div className="absolute inset-0 grid-lines opacity-40" aria-hidden />
                <svg viewBox="0 0 100 60" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
                  <path d="M0 46 C16 42 26 34 38 30 C52 25 62 20 100 14" fill="none" stroke="#12B8CC" strokeOpacity=".35" strokeWidth="0.7" />
                  <path d="M8 60 C20 52 30 46 44 40 C60 33 74 30 100 26" fill="none" stroke="#5CD6E2" strokeOpacity=".18" strokeWidth="0.5" strokeDasharray="2 2" />
                  <path d="M30 0 C34 14 40 24 46 32 C52 40 56 50 58 60" fill="none" stroke="#5CD6E2" strokeOpacity=".16" strokeWidth="0.5" strokeDasharray="1.6 2" />
                </svg>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="relative flex size-10 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-cyan/30 animate-ping" />
                    <span className="relative grid size-10 place-items-center rounded-full bg-cyan text-white shadow-lg">
                      <MapPin className="size-5" />
                    </span>
                  </span>
                </span>
                <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/12 bg-navy/80 px-3 py-2 backdrop-blur">
                  <p className="text-[0.5625rem] uppercase tracking-[0.14em] text-cyan-300">DigiTrans depot</p>
                  <p className="mt-0.5 text-[0.75rem] text-white/80">{site.address}</p>
                </div>
              </div>
              <div className="p-4">
                <a
                  href="https://maps.google.com/?q=Marian+Road+Calabar"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-outline btn-sm w-full"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>

            <div id="vendors" className="scroll-mt-24 rounded-2xl border border-line bg-white p-5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-cyan">For businesses</p>
              <h3 className="mt-1.5 font-display text-[1.05rem] font-semibold tracking-tight text-navy">
                Apply for a vendor account
              </h3>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-slate-ink">
                Restaurants, pharmacies, laundry, groceries and retail. Send your business name,
                category, address and registration documents — approvals usually within 24 hours.
              </p>
              <Link href="/quote" className="btn btn-dark btn-sm mt-4 w-full">
                Start vendor enquiry
              </Link>
            </div>

            <div id="riders" className="scroll-mt-24 rounded-2xl border border-line bg-navy p-5 text-white">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-cyan-300">For riders</p>
              <h3 className="mt-1.5 font-display text-[1.05rem] font-semibold tracking-tight text-white">
                Ride with DigiTrans
              </h3>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-white/60">
                Bicycle, e-bike or motorcycle owners in Calabar. You’ll need a valid ID, a guarantor
                and acceptance of the rider agreement. 25% of every completed fare is yours, settled
                next day.
              </p>
              <a href={site.whatsappHref} className="btn btn-primary btn-sm mt-4 w-full">
                Start rider onboarding
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="faqs" className="section-pad border-t border-line bg-mist">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="eyebrow">
              <span className="h-px w-6 bg-cyan" /> FAQs
            </p>
            <h2 className="display-2 mt-3 text-navy">Before you ask.</h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-line bg-white p-4 open:shadow-[var(--shadow-card)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.875rem] font-semibold text-navy marker:hidden">
                  {faq.q}
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45 group-open:border-cyan group-open:bg-cyan group-open:text-white">
                    +
                  </span>
                </summary>
                <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-slate-ink">{faq.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div id="privacy" className="scroll-mt-24 rounded-xl border border-line bg-white p-5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Privacy</p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-ink">
                We collect only what a delivery needs: contact details, addresses and item
                descriptions. ID and guarantor records for riders are stored privately and never shared
                publicly. Ask us to delete your account data at any time.
              </p>
            </div>
            <div id="terms" className="scroll-mt-24 rounded-xl border border-line bg-white p-5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Terms</p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-ink">
                Delivery estimates are based on route distance and zone pricing. Prohibited items —
                cash, illegal goods, hazardous materials and live animals — cannot be carried. Claims
                for loss or damage must be filed within 24 hours of delivery.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
