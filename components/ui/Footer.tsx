import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Logo, SocialIcon } from "./Logo";
import { site } from "@/lib/content";

const columns = [
  {
    title: "Services",
    links: [
      { label: "Standard delivery", href: "/services/standard-delivery" },
      { label: "Market runs", href: "/services/market-runs" },
      { label: "Waybills & parcels", href: "/services/waybills" },
      { label: "Business & vendor", href: "/services/business-logistics" },
      { label: "Student delivery", href: "/services/student-delivery" },
      { label: "Scheduled pickups", href: "/services/scheduled-pickups" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About DigiTrans", href: "/about" },
      { label: "Coverage", href: "/#coverage" },
      { label: "How pricing works", href: "/#pricing" },
      { label: "Track a delivery", href: "/track" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Request a quote", href: "/quote" },
      { label: "Become a vendor", href: "/contact#vendors" },
      { label: "Ride with DigiTrans", href: "/contact#riders" },
      { label: "FAQs", href: "/contact#faqs" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" aria-hidden />
      <div className="pointer-events-none absolute -left-40 top-0 size-[38rem] rounded-full bg-cyan/10 blur-3xl" aria-hidden />

      <div className="relative">
        {/* CTA strip */}
        <div className="border-b border-white/10">
          <div className="container-x flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xl font-semibold tracking-tight text-white">
                Ready to send something across Calabar?
              </p>
              <p className="mt-1 text-sm text-white/60">
                Instant quotes, live tracking, and riders who know every street.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/quote" className="btn btn-primary">
                Get a quote
              </Link>
              <a href={site.whatsappHref} className="btn btn-ghost">
                WhatsApp us
              </a>
            </div>
          </div>
        </div>

        <div className="container-x grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.15fr_repeat(3,minmax(0,0.8fr))]">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              {site.tagline} Built in Cross River State, for the way people actually move things.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <a href={site.phoneHref} className="flex items-start gap-3 text-white/75 transition hover:text-white">
                <Phone className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                {site.phone}
              </a>
              <a href={site.emailHref} className="flex items-start gap-3 text-white/75 transition hover:text-white">
                <Mail className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                {site.email}
              </a>
              <p className="flex items-start gap-3 text-white/75">
                <MapPin className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                {site.address}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {site.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="grid size-9 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-cyan-300/60 hover:text-white"
                >
                  <SocialIcon kind={s.icon} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/40">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-white/70 transition hover:text-white"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-70" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="container-x flex flex-col gap-3 py-6 text-[0.75rem] text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} DigiTrans Logistics Ltd. RC 1234567 · Calabar, Cross River State.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/contact#privacy" className="transition hover:text-white">
                Privacy
              </Link>
              <Link href="/contact#terms" className="transition hover:text-white">
                Terms
              </Link>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-success" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
