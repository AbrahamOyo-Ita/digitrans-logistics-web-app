"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Eyebrow } from "@/components/ui/Bits";

const steps = ["Booked", "Collected", "In transit", "Out for delivery", "Delivered"];

/**
 * Band 7 — tracking: photo on the left, navy panel with the search
 * field and the horizontal status rail on the right.
 */
export function Tracking() {
  const router = useRouter();
  const [ref, setRef] = useState("");

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="container-x">
        <div className="grid overflow-hidden rounded-[18px] border border-line lg:grid-cols-2">
          <div className="relative min-h-[18rem] lg:min-h-[26rem]">
            <Image
              src="/images/handover.jpg"
              alt="A DigiTrans rider scanning a parcel before dispatch"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-[50%_45%]"
            />
          </div>

          <div className="bg-navy p-7 text-white sm:p-10 lg:p-12">
            <Eyebrow tone="light">Track your delivery</Eyebrow>
            <h2 className="display-2 mt-3 text-white">
              Real-time tracking,
              <br />
              <span className="text-cyan-300">made simple.</span>
            </h2>
            <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-white/65">
              Enter your tracking number and get instant updates on every stop — the same timeline
              our dispatch desk sees.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = ref.trim();
                router.push(value ? `/track?ref=${encodeURIComponent(value.toUpperCase())}` : "/track");
              }}
              className="relative mt-7"
            >
              <label htmlFor="track-ref" className="sr-only">
                Tracking number
              </label>
              <input
                id="track-ref"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Enter tracking number…"
                className="field field-pill h-[3.25rem] bg-white pr-16 text-navy"
              />
              <button
                type="submit"
                aria-label="Track parcel"
                className="absolute right-1.5 top-1.5 grid size-11 place-items-center rounded-full bg-cyan text-white transition-colors hover:bg-cyan-600"
              >
                <Search className="size-[1.05rem]" />
              </button>
            </form>

            {/* Status rail */}
            <div className="mt-9">
              <p className="text-[0.6875rem] text-white/45">
                Reference <span className="font-mono text-white/70">DT-CAL-8842-5117</span>
              </p>
              <ol className="mt-4 flex items-start justify-between gap-1">
                {steps.map((step, i) => {
                  const done = i < 4;
                  const current = i === 3;
                  return (
                    <li key={step} className="flex flex-1 flex-col items-center text-center">
                      <span className="relative flex w-full items-center">
                        {i > 0 && (
                          <span
                            aria-hidden
                            className={`h-px flex-1 ${done ? "bg-cyan" : "bg-white/20"}`}
                          />
                        )}
                        <span
                          className={`grid shrink-0 place-items-center rounded-full ${
                            current
                              ? "size-3 bg-white ring-4 ring-white/15"
                              : done
                                ? "size-2.5 bg-cyan"
                                : "size-2.5 bg-white/25"
                          }`}
                        />
                        {i < steps.length - 1 && (
                          <span
                            aria-hidden
                            className={`h-px flex-1 ${i < 3 ? "bg-cyan" : "bg-white/20"}`}
                          />
                        )}
                      </span>
                      <span
                        className={`mt-2.5 text-[0.6875rem] leading-tight ${
                          current ? "font-medium text-white" : done ? "text-white/70" : "text-white/40"
                        }`}
                      >
                        {step}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
