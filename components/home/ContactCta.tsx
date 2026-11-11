import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { site } from "@/lib/content";

export function ContactCta() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 radial-glow opacity-70" aria-hidden />
      <div className="absolute inset-0 grid-lines opacity-25" aria-hidden />

      <div className="container-x relative grid gap-12 py-[clamp(3.5rem,6vw,5.5rem)] lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <p className="eyebrow text-cyan-300">
            <span className="h-px w-6 bg-cyan-300" /> Let’s move something
          </p>
          <h2 className="display-2 mt-3 max-w-lg text-white">
            Need it across town today? We’re already out there.
          </h2>
          <p className="lede mt-4 max-w-md text-white/65">
            Book online in under a minute, or call the dispatch desk and speak to a person in Calabar.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/quote" className="btn btn-primary">
              Get an instant quote
              <ArrowRight className="size-4" />
            </Link>
            <a href={site.whatsappHref} target="_blank" rel="noreferrer noopener" className="btn btn-ghost">
              <MessageCircle className="size-4" />
              WhatsApp dispatch
            </a>
          </div>

          <dl className="mt-10 grid gap-x-8 gap-y-5 border-t border-white/12 pt-7 sm:grid-cols-2">
            {[
              { icon: Phone, label: "Dispatch desk", value: site.phone, href: site.phoneHref },
              { icon: Mail, label: "Email", value: site.email, href: site.emailHref },
              { icon: MapPin, label: "Depot", value: site.address },
              { icon: MapPin, label: "Hours", value: site.hours },
            ].map((item) => (
              <div key={item.label} className="flex gap-3">
                <item.icon className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                <div>
                  <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-white/40">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-[0.875rem] text-white/80">
                    {item.href ? (
                      <a href={item.href} className="transition hover:text-white">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-6 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="font-display text-[1.05rem] font-semibold tracking-tight text-white">
                Two ways to start
              </p>
              <span className="rounded-full bg-cyan/15 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-cyan-300 ring-1 ring-inset ring-cyan-300/25">
                No app needed
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  title: "Send a parcel today",
                  body: "Instant fare, rider matched in minutes.",
                  href: "/quote",
                  cta: "Start a booking",
                },
                {
                  title: "Put your business on it",
                  body: "Vendor rates, dispatch board and reports.",
                  href: "/contact#vendors",
                  cta: "Apply as vendor",
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group block rounded-xl border border-white/10 bg-navy/50 p-4 transition hover:border-cyan-300/40 hover:bg-navy/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.9375rem] font-semibold text-white">{card.title}</p>
                      <p className="mt-0.5 text-[0.8125rem] text-white/55">{card.body}</p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-cyan-300 transition group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-cyan-300/80">
                    {card.cta}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[0.75rem] text-white/55">
              <span className="size-1.5 rounded-full bg-success" />
              Dispatch is online · {site.hours}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
