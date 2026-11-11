import Image from "next/image";
import { QuoteWidget } from "@/components/ui/QuoteWidget";

export function Quote() {
  return (
    <section id="quote" className="relative isolate overflow-hidden bg-white">
      <div className="grid lg:grid-cols-2">
        {/* Photograph panel */}
        <div className="relative min-h-[22rem] overflow-hidden bg-navy lg:min-h-[44rem]">
          <Image
            src="/images/rider-portrait.jpg"
            alt="A DigiTrans rider with a loaded cargo bike"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-[50%_28%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/95 via-navy/70 to-transparent p-7 sm:p-10">
            <p className="max-w-[34ch] font-display text-[1.25rem] font-medium leading-snug tracking-tight text-white sm:text-[1.5rem]">
              “Our kitchen sends forty orders a day through DigiTrans. Nothing has been lost in
              eighteen months.”
            </p>
            <p className="mt-4 text-[0.8125rem] text-white/60">
              Iniobong Effiong — Calabar Kitchen
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center px-5 py-14 sm:px-10 lg:px-14 lg:py-20">
          <div className="w-full max-w-md">
            <h2 className="display-2">Get a fare before you send.</h2>
            <p className="body-sm mt-4">
              Pick two zones to see the exact charge, distance and delivery window. Extras are
              itemised, never added at the door.
            </p>
            <div className="mt-8">
              <QuoteWidget variant="full" />
            </div>
            <p className="mt-5 text-[0.75rem] leading-relaxed text-muted">
              Student and vendor rates are applied automatically once your account is verified.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
