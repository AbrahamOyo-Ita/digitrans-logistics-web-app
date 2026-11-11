const partners = [
  "Calabar Kitchen",
  "Marian Pharmacy",
  "Watt Market Runners",
  "UNICAL Hostels",
  "Bluebird Eateries",
  "Effio-Ette Foods",
  "Cross River Fresh",
  "Paradise Laundry",
];

export function TrustBar() {
  return (
    <section className="border-y border-line bg-white py-7">
      <div className="container-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-10">
          <p className="shrink-0 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted lg:max-w-[11rem]">
            Trusted by Calabar businesses &amp; campuses
          </p>
          <div className="mask-fade-x relative flex-1 overflow-hidden">
            <div className="marquee-track flex w-max items-center gap-10">
              {[...partners, ...partners].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="whitespace-nowrap font-display text-[0.95rem] font-semibold tracking-tight text-navy/35 transition hover:text-navy"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
