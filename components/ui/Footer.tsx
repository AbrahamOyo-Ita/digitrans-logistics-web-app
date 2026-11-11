import Link from "next/link";
import { Logo, SocialIcon } from "./Logo";
import { site } from "@/lib/content";

const columns = [
  {
    title: "Services",
    links: [
      { label: "Standard delivery", href: "/services/standard-delivery" },
      { label: "Market runs", href: "/services/market-runs" },
      { label: "Waybills", href: "/services/waybills" },
      { label: "Business & vendor", href: "/services/business-logistics" },
      { label: "Student delivery", href: "/services/student-delivery" },
      { label: "Scheduled pickups", href: "/services/scheduled-pickups" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Coverage", href: "/coverage" },
      { label: "Pricing", href: "/pricing" },
      { label: "Track a delivery", href: "/track" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Book a delivery", href: "/quote" },
      { label: "Vendor account", href: "/contact#vendors" },
      { label: "Ride with us", href: "/contact#riders" },
      { label: "FAQs", href: "/contact#faqs" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="container-x">
        <div className="grid gap-10 border-b border-white/12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-[34ch] text-[0.875rem] leading-relaxed text-white/55">
              Delivery, market runs and waybills across Calabar. Built in Cross River State since{" "}
              {site.founded}.
            </p>

            <div className="mt-6 space-y-2 text-[0.8125rem] text-white/60">
              <a href={site.phoneHref} className="block transition-colors hover:text-white">
                {site.phone}
              </a>
              <a href={site.emailHref} className="block transition-colors hover:text-white">
                {site.email}
              </a>
              <p className="max-w-[30ch] leading-relaxed">{site.address}</p>
            </div>

            <div className="mt-6 flex items-center gap-1">
              {site.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="grid size-8 place-items-center text-white/45 transition-colors hover:text-white"
                >
                  <SocialIcon kind={s.icon} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-white/35">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[0.8125rem] text-white/65 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 py-6 text-[0.75rem] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DigiTrans Logistics Ltd. Calabar, Cross River State.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/contact#privacy" className="transition-colors hover:text-white/70">
              Privacy
            </Link>
            <Link href="/contact#terms" className="transition-colors hover:text-white/70">
              Terms
            </Link>
            <span>{site.hours}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
