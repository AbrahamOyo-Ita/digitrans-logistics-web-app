import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { zones } from "@/lib/content";

const dots = [
  { left: "18%", top: "58%", label: "Anantigha" },
  { left: "27%", top: "46%", label: "Ikot Ishie" },
  { left: "36%", top: "38%", label: "Watt Market" },
  { left: "44%", top: "30%", label: "Marian" },
  { left: "56%", top: "34%", label: "State Housing" },
  { left: "63%", top: "44%", label: "Ekorinim" },
  { left: "71%", top: "28%", label: "UNICAL" },
  { left: "78%", top: "50%", label: "8 Miles" },
  { left: "30%", top: "70%", label: "Akpabuyo" },
];

export function Coverage() {
  return (
    <section id="coverage" className="section-pad bg-white">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
        <div>
          <p className="eyebrow">
            <span className="h-px w-6 bg-cyan" /> Coverage
          </p>
          <h2 className="display-2 mt-3 text-navy">
            Twelve zones across <span className="text-cyan">Calabar.</span>
          </h2>
          <p className="lede mt-4 max-w-lg">
            From Duke Town’s old streets to Akpabuyo’s edge, our zones are drawn around how people
            give directions here — landmarks, junctions and markets first.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {zones.map((zone) => (
              <div key={zone.name} className="group flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-cyan" />
                <div>
                  <p className="text-[0.8125rem] font-medium leading-tight text-navy">{zone.name}</p>
                  <p className="text-[0.7rem] text-muted">{zone.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/quote" className="btn btn-primary btn-sm">
              Check your zone
            </Link>
            <Link href="/contact" className="btn btn-outline btn-sm">
              Request a new zone
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-mist p-2">
            <div className="relative aspect-[4/3.4] overflow-hidden rounded-xl bg-navy">
              <div className="absolute inset-0 grid-lines opacity-40" aria-hidden />
              <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
                {/* stylised Calabar coastline + river */}
                <defs>
                  <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0B2A4A" />
                    <stop offset="100%" stopColor="#0A1B35" />
                  </linearGradient>
                  <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#123353" />
                    <stop offset="100%" stopColor="#0E2743" />
                  </linearGradient>
                </defs>
                <rect width="100" height="100" fill="url(#water)" />
                <path
                  d="M0 78 C14 74 22 66 30 60 C40 53 46 44 58 40 C70 36 82 40 100 32 L100 100 L0 100 Z"
                  fill="url(#land)"
                />
                <path
                  d="M0 78 C14 74 22 66 30 60 C40 53 46 44 58 40 C70 36 82 40 100 32"
                  fill="none"
                  stroke="#12B8CC"
                  strokeOpacity="0.45"
                  strokeWidth="0.6"
                />
                <path
                  d="M22 88 C30 80 34 72 44 68 C54 64 62 60 74 56"
                  fill="none"
                  stroke="#5CD6E2"
                  strokeOpacity="0.28"
                  strokeWidth="0.4"
                  strokeDasharray="1.6 1.6"
                />
                <path
                  d="M10 62 C22 58 30 50 40 46 C52 41 60 34 74 32"
                  fill="none"
                  stroke="#5CD6E2"
                  strokeOpacity="0.18"
                  strokeWidth="0.4"
                  strokeDasharray="1.4 2"
                />
              </svg>

              {dots.map((dot, i) => (
                <div
                  key={dot.label}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: dot.left, top: dot.top }}
                >
                  <span className="relative flex size-2.5 items-center justify-center">
                    <span className="absolute size-2.5 rounded-full bg-cyan-300/40 animate-ping [animation-delay:var(--d)]" style={{ "--d": `${i * 220}ms` } as React.CSSProperties} />
                    <span className="relative size-1.5 rounded-full bg-cyan-300 ring-2 ring-cyan-300/25" />
                  </span>
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-navy/90 px-1.5 py-0.5 text-[0.5625rem] font-medium text-white/85 opacity-0 ring-1 ring-inset ring-white/10 transition group-hover:opacity-100">
                    {dot.label}
                  </span>
                </div>
              ))}

              <div className="absolute bottom-3 left-3 rounded-lg border border-white/12 bg-navy/80 px-3 py-2 backdrop-blur">
                <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-cyan-300">Live zone map</p>
                <p className="mt-0.5 text-[0.6875rem] text-white/55">Calabar South · Municipality · Akpabuyo</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-mist px-4 py-3">
            <p className="text-[0.75rem] text-slate-ink">
              Outside these zones? We route to <strong className="font-semibold text-navy">Uyo, Port Harcourt &amp; Abuja</strong> by waybill.
            </p>
            <Link href="/services/waybills" className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-cyan">
              See waybill routes <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
