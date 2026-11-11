import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/ui/PageHead";
import { ContactForm } from "./ContactForm";
import { faqs, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact & support",
  description:
    "Reach DigiTrans Logistics in Calabar — dispatch desk, vendor applications, rider onboarding, complaints and answers to common questions.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHead
        title="Contact the dispatch desk."
        lead="Deliveries, vendor onboarding or a complaint — pick the fastest route below. During operating hours, the phone is answered by someone in Calabar."
        trail={[{ label: "Contact" }]}
        image="/images/merchant.jpg"
        imageAlt="A DigiTrans rider collecting an order from a Calabar business"
      >
        <div className="mt-8 grid max-w-2xl gap-px border border-white/15 bg-white/10 sm:grid-cols-2">
          {[
            { label: "Dispatch desk", value: site.phone, href: site.phoneHref },
            { label: "WhatsApp", value: site.whatsapp, href: site.whatsappHref },
            { label: "Email", value: site.email, href: site.emailHref },
            { label: "Hours", value: site.hours },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="bg-navy/90 px-5 py-4 transition-colors hover:bg-navy-600"
            >
              <span className="text-[0.6875rem] text-white/40">{item.label}</span>
              <span className="mt-1 block text-[0.875rem] font-medium text-white">{item.value}</span>
            </a>
          ))}
        </div>
      </PageHead>

      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="display-2">Send us a message.</h2>
            <p className="body-sm mt-3 max-w-lg">
              Tell us what you need. For anything already on the road, call dispatch — it is always
              faster than a form.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div id="vendors" className="scroll-mt-28 border border-line p-6">
              <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">For businesses</p>
              <h3 className="mt-2 font-display text-[1.125rem] font-medium tracking-tight text-navy">
                Apply for a vendor account
              </h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-ink">
                Send your business name, category, address and registration documents. Approvals
                usually land within 24 hours, and contract rates are agreed on your routes and volume.
              </p>
              <Link href="/services/business-logistics" className="link-underline mt-5">
                What vendors get
              </Link>
            </div>

            <div id="riders" className="mt-4 scroll-mt-28 border border-line p-6">
              <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">For riders</p>
              <h3 className="mt-2 font-display text-[1.125rem] font-medium tracking-tight text-navy">
                Ride with DigiTrans
              </h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-ink">
                Bicycle, e-bike or motorcycle owners in Calabar. You will need a valid ID, a guarantor
                and acceptance of the rider agreement. Riders keep 25% of every completed fare,
                settled the next working day.
              </p>
              <a href={site.whatsappHref} className="btn btn-primary btn-sm mt-5">
                Start rider onboarding
              </a>
            </div>

            <div className="mt-4 border border-line p-6">
              <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">Find us</p>
              <h3 className="mt-2 font-display text-[1.125rem] font-medium tracking-tight text-navy">
                Marian Road depot
              </h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-ink">{site.address}</p>
              <div className="relative mt-4 aspect-[16/10] overflow-hidden bg-[#eef1f2]">
                <svg viewBox="0 0 320 200" className="size-full" aria-hidden>
                  <rect width="320" height="200" fill="#eef1f2" />
                  {Array.from({ length: 4 }).map((_, row) =>
                    Array.from({ length: 6 }).map((_, col) => (
                      <rect key={`${row}-${col}`} x={col * 54 + 8} y={row * 50 + 8} width={38} height={34} fill="#e2e7e9" />
                    ))
                  )}
                  <path d="M0 104h320M160 0v200" stroke="#fff" strokeWidth="12" />
                  <path d="M0 52h320M270 0v200" stroke="#fff" strokeWidth="6" />
                  <path d="M0 160h320M60 0v200" stroke="#fff" strokeWidth="5" />
                  <circle cx="160" cy="104" r="16" fill="#0e7c8b" fillOpacity="0.12" />
                  <circle cx="160" cy="104" r="6" fill="#0b1b2b" stroke="#fff" strokeWidth="2.5" />
                </svg>
                <span className="absolute bottom-2 left-2 bg-white px-2 py-1 text-[0.625rem] text-slate-ink shadow-sm">
                  18 Marian Road
                </span>
              </div>
              <a
                href="https://maps.google.com/?q=Marian+Road+Calabar"
                target="_blank"
                rel="noreferrer noopener"
                className="link-underline mt-4"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="faqs" className="section bg-paper">
        <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="display-2 max-w-[14ch]">Common questions.</h2>
          </div>
          <div className="lg:col-span-8">
            <div className="divide-y divide-line border-y border-line">
              {faqs.map((faq) => (
                <details key={faq.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[0.9375rem] font-medium text-navy marker:hidden">
                    {faq.q}
                    <span className="text-muted transition-transform group-open:rotate-45">
                      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <p className="max-w-[62ch] pb-5 pr-8 text-[0.875rem] leading-relaxed text-slate-ink">{faq.a}</p>
                </details>
              ))}
            </div>

            <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2">
              <div id="privacy" className="scroll-mt-28 bg-white p-5">
                <p className="text-[0.8125rem] font-medium text-navy">Privacy</p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-ink">
                  We collect only what a delivery needs: contact details, addresses and item
                  descriptions. Rider IDs and guarantor records are stored privately. Ask us to delete
                  your account data at any time.
                </p>
              </div>
              <div id="terms" className="scroll-mt-28 bg-white p-5">
                <p className="text-[0.8125rem] font-medium text-navy">Terms</p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate-ink">
                  Estimates are based on route distance and zone pricing. Cash, illegal items,
                  hazardous materials and live animals cannot be carried. Claims for loss or damage
                  must be filed within 24 hours of delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
