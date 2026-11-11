"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mail, Phone } from "lucide-react";
import { Logo, SocialIcon } from "./Logo";
import { site } from "@/lib/content";

const columns = [
  {
    title: "Quick links",
    links: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/services" },
      { label: "About", href: "/about" },
      { label: "Coverage", href: "/coverage" },
      { label: "Pricing", href: "/pricing" },
      { label: "Track a delivery", href: "/track" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Our services",
    links: [
      { label: "Standard delivery", href: "/services/standard-delivery" },
      { label: "Market runs", href: "/services/market-runs" },
      { label: "Waybills & parcels", href: "/services/waybills" },
      { label: "Business & vendor", href: "/services/business-logistics" },
      { label: "Student delivery", href: "/services/student-delivery" },
      { label: "Scheduled pickups", href: "/services/scheduled-pickups" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "done">("idle");
  const [note, setNote] = useState<string | null>(null);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "newsletter", email: email.trim() }),
      });
      if (!response.ok) throw new Error("failed");
      setState("done");
      setEmail("");
    } catch {
      setNote("That did not go through — try again, or email hello@digitrans.ng.");
    }
  }

  return (
    <footer className="band">
      <div className="container-x">
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1.3fr] lg:gap-12">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-[30ch] text-[0.875rem] leading-relaxed text-white/55">
              Delivery, market runs and waybills across Calabar. Built in Cross River State since{" "}
              {site.founded}.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-[0.8125rem] text-white/60">
              <a href={site.phoneHref} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                <Phone className="size-3.5 text-white/35" />
                {site.phone}
              </a>
              <a href={site.emailHref} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                <Mail className="size-3.5 text-white/35" />
                {site.email}
              </a>
            </div>

            <div className="mt-6 flex items-center gap-1">
              {site.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="grid size-9 place-items-center rounded-full bg-white/8 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <SocialIcon kind={s.icon} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[0.9375rem] font-medium text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.8125rem] text-white/55 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-[0.9375rem] font-medium text-white">Subscribe to our newsletter</p>
            <p className="mt-2 max-w-[30ch] text-[0.8125rem] leading-relaxed text-white/50">
              Route updates, tariff changes and delivery windows, once a month.
            </p>
            <form onSubmit={subscribe} className="relative mt-4">
              <label htmlFor="newsletter" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="field field-pill h-12 bg-white pr-[8.75rem] text-navy"
              />
              <button
                type="submit"
                className="pill pill-cyan pill-sm absolute right-1.5 top-1.5 !min-h-9"
              >
                {state === "done" ? (
                  <>
                    <Check className="size-3.5" /> Done
                  </>
                ) : (
                  <>
                    Subscribe <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </form>
            <p aria-live="polite" className="mt-2 text-[0.75rem] text-white/45">
              {note ?? (state === "done" ? "You are on the list — thank you." : "No more than one email a month.")}
            </p>

            <p className="mt-6 text-[0.75rem] leading-relaxed text-white/40">{site.address}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/12 py-6 text-[0.75rem] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DigiTrans Logistics Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/contact#privacy" className="transition-colors hover:text-white/75">
              Privacy Policy
            </Link>
            <span aria-hidden className="h-3 w-px bg-white/20" />
            <Link href="/contact#terms" className="transition-colors hover:text-white/75">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
