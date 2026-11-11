import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/lib/content";

export function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/handover.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[62%_38%] opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/92 to-navy/55" />
      </div>

      <div className="container-x py-[clamp(4rem,7vw,6.5rem)]">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="display-2 max-w-[24ch] text-white">
              Something needs to move today. We are already out there.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-white/65">
              Book in under a minute, or call the dispatch desk and speak to someone in Calabar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quote" className="btn btn-on-dark">
                Get a fare
                <ArrowRight className="size-4" />
              </Link>
              <a href={site.whatsappHref} target="_blank" rel="noreferrer noopener" className="btn btn-outline-dark">
                Message dispatch
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 lg:pl-10"><div className="bg-navy/50 p-6 backdrop-blur-[2px] lg:bg-navy/40">
            <dl className="divide-y divide-white/15 border-y border-white/15">
              {[
                { icon: Phone, label: "Dispatch desk", value: site.phone, href: site.phoneHref },
                { icon: Mail, label: "Email", value: site.email, href: site.emailHref },
                { icon: MapPin, label: "Depot", value: site.address },
                { icon: MapPin, label: "Hours", value: site.hours },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4 py-4">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-white/35" />
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.14em] text-white/35">{item.label}</dt>
                    <dd className="mt-1 text-[0.875rem] text-white/85">
                      {item.href ? (
                        <a href={item.href} className="transition-colors hover:text-white">
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
