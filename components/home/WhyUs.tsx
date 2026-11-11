import Image from "next/image";
import { Bike, Building2, Headset, ShieldCheck, Wallet } from "lucide-react";
import { Eyebrow } from "@/components/ui/Bits";
import { site } from "@/lib/content";

/**
 * Band 5 — navy "Why choose us" panel: photograph on the left,
 * heading and a 2×2 grid of icon features on the right.
 */
const points = [
  { icon: Building2, title: "Zones built for Calabar", note: "12 zones, not postcodes" },
  { icon: Bike, title: "Our own riders", note: "Vetted, insured, uniformed" },
  { icon: ShieldCheck, title: "Cover on every trip", note: "Up to ₦50,000 in transit" },
  { icon: Wallet, title: "Fares fixed up front", note: "No charge at the door" },
];

export function WhyUs() {
  return (
    <section className="band section-tight">
      <div className="container-x">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] lg:aspect-[5/4]">
            <Image
              src="/images/depot.jpg"
              alt="The DigiTrans depot on Marian Road"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-[12px] bg-navy/85 px-4 py-3 backdrop-blur-sm">
              <Headset className="size-4 shrink-0 text-cyan-300" aria-hidden />
              <p className="text-[0.75rem] leading-snug text-white/80">
                Marian Road depot — dispatch desk open {site.hours}
              </p>
            </div>
          </div>

          <div>
            <Eyebrow tone="light">Why choose us</Eyebrow>
            <h2 className="display-2 mt-3 text-white">
              A local operator,{" "}
              <span className="text-cyan-300">not a marketplace.</span>
            </h2>
            <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-white/65">
              We hire and equip our own riders in Calabar. That means a guarantor on file, a signed
              rider agreement, and a dispatch team that can pick up the phone when something goes
              wrong.
            </p>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {points.map((point) => (
                <div
                  key={point.title}
                  className="flex items-start gap-3 rounded-[12px] border border-white/12 bg-white/[0.045] p-4"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cyan text-white">
                    <point.icon className="size-[1.05rem]" strokeWidth={1.8} aria-hidden />
                  </span>
                  <div>
                    <dt className="text-[0.875rem] font-medium text-white">{point.title}</dt>
                    <dd className="mt-0.5 text-[0.75rem] text-white/50">{point.note}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
