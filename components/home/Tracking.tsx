import Link from "next/link";
import { ArrowRight, Check, Phone } from "lucide-react";

const stages = [
  { label: "Booking confirmed", time: "09:12", note: "Fare held · ₦2,300" },
  { label: "Rider assigned", time: "09:18", note: "Emeka O. accepted the job" },
  { label: "Collected", time: "09:31", note: "2 parcels scanned at Watt Market" },
  { label: "Out for delivery", time: "09:44", note: "En route to State Housing" },
  { label: "Delivered", time: "10:02", note: "Signed for by A. Bassey" },
];

const activeIndex = 3;

export function Tracking() {
  return (
    <section className="section bg-white">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="display-2 max-w-[20ch]">You can see every step it takes.</h2>
            <p className="body-sm mt-5">
              Each status change is timestamped and attributed to the person responsible. Share one
              link with the recipient and stop answering “where is my order?” calls.
            </p>

            <dl className="mt-8 divide-y divide-line border-y border-line">
              {[
                { title: "Zone-accurate arrival windows", body: "Calculated from real Calabar routes, not guesswork." },
                { title: "Masked rider contact", body: "Call your rider without exposing either phone number." },
                { title: "Proof that stands up", body: "Photo, recipient name and signature on delivery." },
              ].map((item) => (
                <div key={item.title} className="py-4">
                  <dt className="text-[0.9375rem] font-medium text-navy">{item.title}</dt>
                  <dd className="mt-1 text-[0.8125rem] leading-relaxed text-slate-ink">{item.body}</dd>
                </div>
              ))}
            </dl>

            <Link href="/track" className="link-underline mt-8">
              Track a delivery
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-line bg-white shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                <div>
                  <p className="font-display text-[1.0625rem] font-medium tracking-tight text-navy">
                    Watt Market → State Housing
                  </p>
                  <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted">
                    DT-CAL-8842-5117 · 2 parcels · 6.4 km
                  </p>
                </div>
                <p className="text-[0.75rem] font-medium text-cyan">Out for delivery</p>
              </div>

              <div className="grid sm:grid-cols-[1.05fr_1fr]">
                <ol className="divide-y divide-line border-b border-line px-5 sm:border-b-0 sm:border-r sm:px-6">
                  {stages.map((stage, i) => {
                    const done = i < activeIndex;
                    const active = i === activeIndex;
                    return (
                      <li key={stage.label} className="flex gap-3 py-3.5">
                        <span
                          className={
                            done
                              ? "mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded-full bg-cyan text-white"
                              : active
                                ? "mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded-full border-2 border-cyan bg-white"
                                : "mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded-full border border-line-strong bg-white"
                          }
                        >
                          {done && <Check className="size-2.5" strokeWidth={3.5} />}
                          {active && <span className="size-1.5 rounded-full bg-cyan" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <p
                              className={
                                active
                                  ? "text-[0.875rem] font-medium text-navy"
                                  : done
                                    ? "text-[0.875rem] text-slate-ink"
                                    : "text-[0.875rem] text-muted"
                              }
                            >
                              {stage.label}
                            </p>
                            <span className="font-mono text-[0.6875rem] tabular-nums text-muted">{stage.time}</span>
                          </div>
                          <p className="mt-0.5 truncate text-[0.75rem] text-muted">{stage.note}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {/* Map panel */}
                <div className="relative min-h-[16rem] bg-[#eef1f2] p-5">
                  <svg
                    viewBox="0 0 200 200"
                    className="absolute inset-0 size-full"
                    aria-hidden
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <rect width="200" height="200" fill="#eef1f2" />
                    {/* blocks */}
                    {Array.from({ length: 5 }).map((_, row) =>
                      Array.from({ length: 5 }).map((_, col) => (
                        <rect
                          key={`${row}-${col}`}
                          x={col * 42 + 6}
                          y={row * 42 + 6}
                          width={30}
                          height={30}
                          fill="#e3e7e9"
                        />
                      ))
                    )}
                    {/* roads */}
                    <path d="M0 96h200M96 0v200" stroke="#fff" strokeWidth="9" />
                    <path d="M0 150h200M150 0v200" stroke="#fff" strokeWidth="5" />
                    <path d="M0 42h200M42 0v200" stroke="#fff" strokeWidth="4" />
                    {/* water */}
                    <path d="M0 182c40-10 70-6 100 2s64 10 100 4v12H0z" fill="#dfe8ea" />
                    {/* route */}
                    <path
                      d="M42 150v-54h54V54h54"
                      fill="none"
                      stroke="#0e7c8b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="42" cy="150" r="4.5" fill="#fff" stroke="#0b1b2b" strokeWidth="2.5" />
                    <circle cx="150" cy="54" r="4.5" fill="#0b1b2b" />
                    {/* rider position */}
                    <circle cx="96" cy="96" r="9" fill="#0e7c8b" fillOpacity="0.14" />
                    <circle cx="96" cy="96" r="4.5" fill="#0e7c8b" stroke="#fff" strokeWidth="2" />
                  </svg>

                  <div className="relative flex h-full flex-col justify-between">
                    <span className="self-start bg-white px-2 py-1 text-[0.625rem] font-medium text-slate-ink shadow-sm">
                      6.4 km · 22 min left
                    </span>
                    <div className="flex items-center justify-between gap-3 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-full bg-navy text-[0.6875rem] font-medium text-white">
                          EO
                        </span>
                        <div>
                          <p className="text-[0.8125rem] font-medium leading-tight text-navy">Emeka O.</p>
                          <p className="text-[0.6875rem] text-muted">E-bike · 4.9 ★ · 812 trips</p>
                        </div>
                      </div>
                      <span className="grid size-8 place-items-center border border-line text-navy">
                        <Phone className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
