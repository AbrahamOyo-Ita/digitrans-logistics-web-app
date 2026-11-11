"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { Logo } from "./Logo";
import { site } from "@/lib/content";
import { cn } from "@/lib/cn";

const nav = [
  { label: "Services", href: "/services", children: true },
  { label: "Coverage", href: "/#coverage" },
  { label: "Track", href: "/track" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const serviceLinks = [
  { label: "Standard delivery", href: "/services/standard-delivery", hint: "Same-day parcels" },
  { label: "Market runs", href: "/services/market-runs", hint: "We shop, we deliver" },
  { label: "Waybills & parcels", href: "/services/waybills", hint: "Weight-based pricing" },
  { label: "Business & vendor", href: "/services/business-logistics", hint: "Contract dispatch" },
  { label: "Student delivery", href: "/services/student-delivery", hint: "Flat ₦500 campus rate" },
  { label: "Scheduled pickups", href: "/services/scheduled-pickups", hint: "Plan ahead" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Utility bar */}
      <div className="relative z-50 hidden bg-navy text-white/70 md:block">
        <div className="container-x flex h-9 items-center justify-between text-[0.75rem]">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative inline-flex size-1.5 text-cyan-300">
                <span className="absolute inset-0 rounded-full bg-cyan-300 pulse-ring" />
                <span className="size-1.5 rounded-full bg-cyan-300" />
              </span>
              Riders online in Calabar now
            </span>
            <span className="hidden items-center gap-1.5 lg:inline-flex">
              <span className="text-white/40">|</span>
              {site.hours}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/contact#vendors" className="transition hover:text-white">
              Become a vendor
            </Link>
            <Link href="/contact#riders" className="transition hover:text-white">
              Ride with us
            </Link>
            <a href={site.phoneHref} className="inline-flex items-center gap-1.5 text-white transition hover:text-cyan-300">
              <Phone className="size-3" />
              {site.phone}
            </a>
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-white/105 backdrop-blur-xl transition-[box-shadow,border-color] duration-300",
          scrolled ? "border-line shadow-[0_10px_30px_-24px_rgba(10,27,53,0.5)]" : "border-transparent"
        )}
      >
        <div className="container-x flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {nav.map((item) =>
              item.children ? (
                <div key={item.label} className="group relative">
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-[0.875rem] font-medium text-slate-ink transition hover:bg-mist hover:text-navy"
                  >
                    {item.label}
                    <ChevronDown className="size-3.5 opacity-60 transition group-hover:rotate-180" />
                  </Link>
                  <div className="invisible absolute left-1/2 top-full z-50 w-[34rem] -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-[0_30px_70px_-30px_rgba(10,27,53,0.45)]">
                      {serviceLinks.map((s) => (
                        <Link
                          key={s.href}
                          href={s.href}
                          className="rounded-xl px-3 py-2.5 transition hover:bg-mist"
                        >
                          <span className="block text-[0.875rem] font-semibold text-navy">{s.label}</span>
                          <span className="mt-0.5 block text-[0.75rem] text-muted">{s.hint}</span>
                        </Link>
                      ))}
                      <Link
                        href="/services"
                        className="col-span-2 mt-1 flex items-center justify-between rounded-xl bg-navy px-3.5 py-2.5 text-[0.8125rem] font-semibold text-white transition hover:bg-navy-700"
                      >
                        Compare every service
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-[0.875rem] font-medium text-slate-ink transition hover:bg-mist hover:text-navy"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/quote" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Get a quote
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid size-11 place-items-center rounded-xl border border-line text-navy transition hover:bg-mist lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn("absolute inset-0 bg-navy/40 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")}
        />
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(24rem,92vw)] flex-col bg-white shadow-2xl transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-10 place-items-center rounded-xl border border-line text-navy"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <p className="eyebrow mb-3">Services</p>
            <div className="grid gap-1">
              {serviceLinks.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-[0.9375rem] font-medium text-navy transition hover:bg-mist"
                >
                  <span>
                    {s.label}
                    <span className="mt-0.5 block text-[0.75rem] font-normal text-muted">{s.hint}</span>
                  </span>
                  <span className="text-muted" aria-hidden>→</span>
                </Link>
              ))}
            </div>

            <div className="my-5 hairline" />
            <div className="grid gap-1">
              {[
                { label: "Track a delivery", href: "/track" },
                { label: "Coverage map", href: "/#coverage" },
                { label: "About us", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium text-navy transition hover:bg-mist"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-2 border-t border-line p-5">
            <Link href="/quote" onClick={() => setOpen(false)} className="btn btn-primary w-full">
              Get a quote
            </Link>
            <a href={site.whatsappHref} className="btn btn-outline w-full">
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
