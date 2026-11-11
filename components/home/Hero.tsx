import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike } from "lucide-react";
import { site } from "@/lib/content";
import { cn } from "@/lib/cn";

/**
 * Band 1 — full-bleed photographic hero.
 * Left: eyebrow, two-tone headline, lead, rounded CTA pills.
 * The feature strip overlaps the bottom edge of the photo.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/street-wide.jpg"
          alt="A DigiTrans rider crossing Calabar at dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[55%_58%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 via-45% to-navy/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-navy/15" />
      </div>

      <div className="container-x pb-20 pt-14 sm:pt-20 lg:pb-28 lg:pt-24">
        <div className="max-w-[38rem]">
          <p className="eyebrow eyebrow-light">Logistics &amp; delivery, Calabar</p>

          <h1 className="display-1 mt-5 text-white">
            Your parcel,
            <br />
            <span className="text-cyan-300">our commitment.</span>
          </h1>

          <p className="mt-6 max-w-[42ch] text-[1rem] leading-relaxed text-white/70">
            We move your business forward with fast, tracked and reliable delivery across Calabar —
            same-day parcels, market runs and waybills, priced before you book.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/quote" className="pill pill-cyan">
              Get a free quote
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/track" className="pill pill-ghost">
              <Bike className="size-4" />
              Track your delivery
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Band 2 — the white feature strip that overlaps the hero photo. */
export function FeatureStrip() {
  const items = [
    {
      title: "Same-day delivery",
      note: "Across Calabar",
      glyph: (
        <path d="M3 16.5h1.6m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m6.4 0H9m7.4 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0M4.6 16.5V7.4a1 1 0 0 1 1-1h7.1a1 1 0 0 1 1 1v9.1m0-6.2h2.7l2.6 3.1v3.1" />
      ),
    },
    {
      title: "Real-time tracking",
      note: "Every stop timestamped",
      glyph: (
        <>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M12 7.6V12l3 1.8" />
        </>
      ),
    },
    {
      title: "Secure handling",
      note: "Safe & reliable",
      glyph: (
        <>
          <path d="M12 3.4l6.6 2.4v5.4c0 4-2.7 6.9-6.6 8.1-3.9-1.2-6.6-4.1-6.6-8.1V5.8L12 3.4Z" />
          <path d="m9.2 11.9 2 2 3.6-3.9" />
        </>
      ),
    },
    {
      title: "On-time delivery",
      note: "97.4% on schedule",
      glyph: (
        <>
          <circle cx="12" cy="12" r="8.2" />
          <path d="m8.4 12.2 2.5 2.5 4.8-5.2" />
        </>
      ),
    },
    {
      title: "Local support",
      note: "A desk that answers",
      glyph: (
        <>
          <path d="M4.5 12a7.5 7.5 0 0 1 15 0" />
          <rect x="3.4" y="12" width="3.6" height="5.4" rx="1.3" />
          <rect x="17" y="12" width="3.6" height="5.4" rx="1.3" />
          <path d="M19 17.4v.8a2.4 2.4 0 0 1-2.4 2.4h-2.4" />
        </>
      ),
    },
  ];

  return (
    <section className="relative z-10 bg-white">
      <div className="container-x">
        <div className="-mt-12 rounded-[18px] border border-line bg-white px-4 py-6 shadow-[0_18px_50px_-30px_rgba(11,27,43,0.45)] sm:-mt-14 sm:px-8 sm:py-7 lg:-mt-16">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0">
            {items.map((item, i) => (
              <li
                key={item.title}
                className={cn(
                  "lg:px-5",
                  i < items.length - 1 && "lg:border-r lg:border-line",
                  i === items.length - 1 && "col-span-2 sm:col-span-1"
                )}
              >
                <span className="grid size-11 place-items-center rounded-full bg-navy/5 text-navy">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-[1.35rem]"
                    aria-hidden
                  >
                    {item.glyph}
                  </svg>
                </span>
                <p className="mt-3 font-display text-[0.9375rem] font-medium tracking-tight text-navy">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[0.75rem] text-muted">{item.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="container-x mt-4 pb-2 text-center text-[0.75rem] text-muted sm:text-left">
        Operating {site.hours} · Call {site.phone}
      </p>
    </section>
  );
}
