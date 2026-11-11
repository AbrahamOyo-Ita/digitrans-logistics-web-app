import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Band 10 — photographic CTA strip above the footer. */
export function ClosingCta() {
  return (
    <section className="px-4 pb-10 sm:px-6">
      <div className="relative isolate mx-auto max-w-[1240px] overflow-hidden rounded-[20px] bg-navy">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/street-wide.jpg"
            alt=""
            fill
            sizes="(max-width: 1240px) 100vw, 1240px"
            className="object-cover object-[62%_45%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/35" />
        </div>

        <div className="px-6 py-12 sm:px-10 sm:py-14 lg:py-16">
          <div className="max-w-xl">
            <h2 className="display-2 text-white">Ready to send something today?</h2>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/70">
              Get a fare in under a minute, or call the dispatch desk and speak to a person who
              knows the route.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/quote" className="pill pill-cyan">
                Get a free quote
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/contact" className="pill pill-ghost">
                Talk to dispatch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
