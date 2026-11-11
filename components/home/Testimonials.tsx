import Image from "next/image";

const quotes = [
  {
    quote:
      "Our kitchen sends forty orders a day through DigiTrans. Nothing has been lost in eighteen months, and the rider is always the same two or three people.",
    name: "Iniobong Effiong",
    role: "Owner, Calabar Kitchen",
  },
  {
    quote:
      "I send market lists from the clinic and everything arrives weighed and bagged with receipts. The budget approval means I never overpay.",
    name: "Grace Etim",
    role: "Operations Lead, Marian Road Clinics",
  },
  {
    quote:
      "The flat student rate makes a real difference. I order food and printouts to the hostel and it costs the same every time.",
    name: "Daniel Otu",
    role: "UNICAL student",
  },
];

export function Testimonials() {
  return (
    <section className="bg-paper">
      <div className="container-x section">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="display-2 max-w-[18ch]">What people here say.</h2>
            <p className="body-sm mt-5 max-w-sm">
              Only customers with a completed delivery can leave a rating — one review per tracking
              reference, checked by our operations team.
            </p>
            <div className="mt-8 border-t border-line pt-5">
              <p className="font-display text-[2rem] font-medium leading-none tracking-tight text-navy">4.9</p>
              <p className="mt-2 text-[0.8125rem] text-muted">Average across 1,700 rated deliveries</p>
              <div className="mt-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" className="size-3.5 fill-navy" aria-hidden>
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L1.5 7.7l5.9-.9z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid gap-px bg-line sm:grid-cols-2">
              {quotes.map((q, i) => (
                <figure
                  key={q.name}
                  className={`flex flex-col justify-between bg-white p-6 sm:p-8 ${i === 0 ? "sm:col-span-2" : ""}`}
                >
                  <blockquote
                    className={`text-navy ${i === 0 ? "font-display text-[1.25rem] font-medium leading-snug tracking-tight sm:text-[1.5rem]" : "text-[0.9375rem] leading-relaxed"}`}
                  >
                    {q.quote}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-4">
                    <div>
                      <p className="text-[0.8125rem] font-medium text-navy">{q.name}</p>
                      <p className="mt-0.5 text-[0.75rem] text-muted">{q.role}</p>
                    </div>
                    <span className="text-[0.6875rem] text-muted">Verified delivery</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Merchant strip */}
      <div className="container-x pb-16">
        <div className="grid items-stretch gap-0 border border-line bg-white lg:grid-cols-2">
          <div className="relative min-h-[16rem]">
            <Image
              src="/images/merchant.jpg"
              alt="A restaurant owner handing a delivery bag to a DigiTrans rider"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <p className="text-[0.75rem] font-medium text-muted">For businesses</p>
            <h3 className="display-3 mt-2 max-w-[26ch]">
              Contract rates, a dispatch board and exportable reports.
            </h3>
            <p className="body-sm mt-3">
              Restaurants, pharmacies, laundry, groceries and retail stores run their deliveries on
              DigiTrans. No subscription — you pay per delivery, invoiced weekly.
            </p>
            <div className="mt-6">
              <a href="/contact#vendors" className="btn btn-primary btn-sm">
                Apply for a vendor account
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
