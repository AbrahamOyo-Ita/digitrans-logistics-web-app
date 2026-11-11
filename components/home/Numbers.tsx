import { Bike, Clock, Package, Users } from "lucide-react";
import { Eyebrow } from "@/components/ui/Bits";
import { site } from "@/lib/content";

/** Band 8 — headline numbers: four coloured circular icons over large values. */
const numbers = [
  { icon: Users, value: site.stats.partners, label: "Business partners", tone: "text-cyan" },
  { icon: Bike, value: site.stats.riders, label: "Riders and runners", tone: "text-[#2D6FA8]" },
  { icon: Package, value: site.stats.deliveries, label: "Deliveries completed", tone: "text-[#2C7A4B]" },
  { icon: Clock, value: site.stats.onTime, label: "Delivered on time", tone: "text-[#6D4AA6]" },
];

export function Numbers() {
  return (
    <section className="section-tight bg-paper">
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <div>
          <Eyebrow>Our impact</Eyebrow>
          <h2 className="display-2 mt-3 max-w-[16ch]">Numbers that move the city.</h2>
          <p className="body-sm mt-4 max-w-sm">
            Measured from our own dispatch records — every completed trip, every timestamp.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
          {numbers.map((item) => (
            <div key={item.label}>
              <span className="grid size-12 place-items-center rounded-full border-2 border-current/15 bg-white shadow-[0_6px_18px_-12px_rgba(11,27,43,0.5)]">
                <item.icon className={`size-5 ${item.tone}`} strokeWidth={1.7} aria-hidden />
              </span>
              <dt className="mt-4 font-display text-[1.75rem] font-semibold leading-none tracking-tight text-navy">
                {item.value}
              </dt>
              <dd className="mt-2 text-[0.75rem] leading-snug text-muted">{item.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
