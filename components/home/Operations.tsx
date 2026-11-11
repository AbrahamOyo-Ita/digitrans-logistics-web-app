import Image from "next/image";

const rows = [
  {
    label: "Fares",
    title: "Quoted before you commit",
    body: "Base fee, distance and any extras are itemised on screen. No renegotiating at the door, no fuel surcharge invented on arrival.",
  },
  {
    label: "Riders",
    title: "Employed, vetted, equipped",
    body: "A guarantor on file, a signed agreement and a valid ID before a rider sees a single job. Bicycles and e-bikes for short runs.",
  },
  {
    label: "Settlement",
    title: "Riders keep 25%",
    body: "A published split of every completed fare, settled the next working day with a ledger the rider can check themselves.",
  },
  {
    label: "Support",
    title: "A Calabar number that answers",
    body: "Our dispatch desk is in the city, staffed by people who can call the rider directly when something goes wrong.",
  },
];

export function Operations() {
  return (
    <section className="bg-navy text-white">
      <div className="container-x section-tight">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <Image
                src="/images/depot.jpg"
                alt="The DigiTrans depot on Marian Road"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <p className="mt-3 text-[0.75rem] text-white/45">
              Marian Road depot — dispatch desk, waybill counter and charging dock.
            </p>
          </div>

          <div className="lg:col-span-7">
            <h2 className="display-2 max-w-[24ch] text-white">
              The unglamorous parts, done well.
            </h2>
            <div className="mt-10 divide-y divide-white/15 border-t border-white/15">
              {rows.map((row, i) => (
                <div key={row.title} className="grid grid-cols-[auto_1fr] gap-x-6 py-6 sm:gap-x-10">
                  <span className="pt-1 font-mono text-[0.6875rem] tabular-nums text-white/35">
                    0{i + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h3 className="font-display text-[1.0625rem] font-medium tracking-tight text-white">
                        {row.title}
                      </h3>
                      <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-white/35">
                        {row.label}
                      </span>
                    </div>
                    <p className="mt-2 max-w-[52ch] text-[0.875rem] leading-relaxed text-white/60">
                      {row.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
