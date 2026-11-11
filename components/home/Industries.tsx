import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pill, Scissors, Shirt, ShoppingBasket, Smartphone, Store, UtensilsCrossed } from "lucide-react";
import { Eyebrow } from "@/components/ui/Bits";

/**
 * Band 6 — industries: navy photographic header, then a 4×2 grid of white tiles.
 */
const industries = [
  { icon: UtensilsCrossed, title: "Food & beverage", note: "Restaurants, eateries, catering", tone: "bg-[#B5762B]/12 text-[#B5762B]" },
  { icon: Store, title: "Pharmacies", note: "Prescriptions & medical supplies", tone: "bg-[#2C7A4B]/12 text-[#2C7A4B]" },
  { icon: ShoppingBasket, title: "Groceries & markets", note: "Produce and household goods", tone: "bg-cyan/12 text-cyan" },
  { icon: Scissors, title: "Laundry & services", note: "Pickup and return runs", tone: "bg-[#6D4AA6]/12 text-[#6D4AA6]" },
  { icon: Shirt, title: "Retail & fashion", note: "Boutiques and online stores", tone: "bg-[#2D6FA8]/12 text-[#2D6FA8]" },
  { icon: Smartphone, title: "Electronics", note: "Phones, laptops and parts", tone: "bg-[#B5762B]/12 text-[#B5762B]" },
  { icon: Pill, title: "Clinics & labs", note: "Samples, records and refills", tone: "bg-[#2C7A4B]/12 text-[#2C7A4B]" },
  { icon: ArrowRight, title: "Something else", note: "Tell dispatch what you move", tone: "bg-cyan/12 text-cyan" },
];

export function Industries() {
  return (
    <section className="bg-white">
      {/* Photographic header */}
      <div className="relative isolate overflow-hidden bg-navy">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/market-run.jpg"
            alt="Traders at Watt Market, Calabar"
            fill
            sizes="100vw"
            className="object-cover object-[65%_45%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/88 to-navy/25" />
        </div>
        <div className="container-x py-14 sm:py-16">
          <div className="max-w-xl">
            <Eyebrow tone="light">Our customers</Eyebrow>
            <h2 className="display-2 mt-3 text-white">Businesses we serve</h2>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/65">
              We provide tailored delivery for a wide range of Calabar businesses — helping them
              move faster, with rates that hold.
            </p>
            <div className="mt-7">
              <Link href="/services/business-logistics" className="pill pill-white">
                View vendor services
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tile grid */}
      <div className="container-x -mt-10 pb-4">
        <ul className="grid grid-cols-2 gap-3 rounded-[18px] border border-line bg-white p-3 shadow-[0_18px_50px_-34px_rgba(11,27,43,0.4)] sm:gap-4 sm:p-4 lg:grid-cols-4">
          {industries.map((item) => (
            <li
              key={item.title}
              className="rounded-[12px] border border-line/70 px-4 py-5 transition-colors hover:border-line-strong hover:bg-paper"
            >
              <span className={`grid size-10 place-items-center rounded-full ${item.tone}`}>
                <item.icon className="size-[1.05rem]" strokeWidth={1.7} aria-hidden />
              </span>
              <p className="mt-3 font-display text-[0.9375rem] font-medium tracking-tight text-navy">
                {item.title}
              </p>
              <p className="mt-0.5 text-[0.75rem] leading-relaxed text-muted">{item.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
