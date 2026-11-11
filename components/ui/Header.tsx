"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import { Logo } from "./Logo";
import { site } from "@/lib/content";
import { cn } from "@/lib/cn";

const nav = [
  { label: "Services", href: "/services" },
  { label: "Coverage", href: "/coverage" },
  { label: "Pricing", href: "/pricing" },
  { label: "Track", href: "/track" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const serviceLinks = [
  { label: "Standard delivery", href: "/services/standard-delivery", hint: "Same-day parcels across Calabar" },
  { label: "Market runs", href: "/services/market-runs", hint: "We shop Watt Market for you" },
  { label: "Waybills & parcels", href: "/services/waybills", hint: "Weight-priced, tracked to arrival" },
  { label: "Business & vendor", href: "/services/business-logistics", hint: "Contract dispatch and reporting" },
  { label: "Student delivery", href: "/services/student-delivery", hint: "Flat ₦500 campus rate" },
  { label: "Scheduled pickups", href: "/services/scheduled-pickups", hint: "Recurring runs, planned ahead" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-white transition-colors duration-300",
          scrolled ? "border-line" : "border-transparent"
        )}
      >
        <div className="container-x flex h-[4.5rem] items-center justify-between gap-6">
          <Logo />

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
              if (item.label === "Services") {
                return (
                  <div key={item.label} className="group relative">
                    <Link
                      href={item.href}
                      className={cn(
                        "py-2 text-[0.875rem] transition-colors",
                        active ? "text-navy" : "text-slate-ink hover:text-navy"
                      )}
                    >
                      {item.label}
                    </Link>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-navy transition-transform duration-200 group-hover:scale-x-100",
                        active && "scale-x-100"
                      )}
                    />
                    <div className="invisible absolute -left-6 top-full z-50 w-[38rem] pt-5 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <div className="overflow-hidden border border-line bg-white shadow-[var(--shadow-panel)]">
                        <div className="grid grid-cols-2">
                          {serviceLinks.map((s) => (
                            <Link
                              key={s.href}
                              href={s.href}
                              className="group/item border-b border-line px-5 py-4 transition-colors last:border-b-0 odd:border-r hover:bg-paper"
                            >
                              <span className="flex items-center justify-between gap-2 text-[0.875rem] font-medium text-navy">
                                {s.label}
                                <ArrowRight className="size-3.5 -translate-x-1 text-muted opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                              </span>
                              <span className="mt-1 block text-[0.75rem] leading-relaxed text-muted">{s.hint}</span>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/pricing"
                          className="flex items-center justify-between border-t border-line bg-paper px-5 py-3 text-[0.8125rem] font-medium text-navy transition-colors hover:bg-mist"
                        >
                          Compare tariffs and services
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "group relative py-2 text-[0.875rem] transition-colors",
                    active ? "text-navy" : "text-slate-ink hover:text-navy"
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-navy transition-transform duration-200 group-hover:scale-x-100",
                      active && "scale-x-100"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={site.phoneHref}
              className="hidden items-center gap-2 text-[0.8125rem] font-medium text-slate-ink transition-colors hover:text-navy xl:inline-flex"
            >
              <Phone className="size-3.5" />
              {site.phone}
            </a>
            <span aria-hidden className="hidden h-4 w-px bg-line xl:block" />
            <Link href="/quote" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Book a delivery
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="-mr-2 grid size-11 place-items-center text-navy lg:hidden"
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
        className={cn("fixed inset-0 z-[60] lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-navy/35 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(26rem,94vw)] flex-col bg-white transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex h-[4.5rem] items-center justify-between border-b border-line px-5">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-2 grid size-11 place-items-center text-navy"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="px-5 py-6">
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted">Services</p>
              <div className="mt-3">
                {serviceLinks.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="flex items-center justify-between border-b border-line py-3 text-[0.9375rem] text-navy"
                  >
                    {s.label}
                    <ArrowRight className="size-4 text-muted" />
                  </Link>
                ))}
              </div>

              <p className="mt-8 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted">Company</p>
              <div className="mt-3">
                {nav
                  .filter((n) => n.label !== "Services")
                  .map((n) => (
                    <Link
                      key={n.href}
                      href={n.href}
                      className="flex items-center justify-between border-b border-line py-3 text-[0.9375rem] text-navy"
                    >
                      {n.label}
                      <ArrowRight className="size-4 text-muted" />
                    </Link>
                  ))}
              </div>
            </nav>
          </div>

          <div className="border-t border-line p-5">
            <Link href="/quote" className="btn btn-primary w-full">
              Book a delivery
            </Link>
            <a
              href={site.phoneHref}
              className="mt-3 flex items-center justify-center gap-2 text-[0.8125rem] font-medium text-slate-ink"
            >
              <Phone className="size-3.5" />
              {site.phone}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
