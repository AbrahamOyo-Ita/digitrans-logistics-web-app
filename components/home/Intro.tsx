import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/content";

export function Intro() {
  return (
    <section className="section bg-white">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="display-2 max-w-[22ch]">A local operator, not an app with a phone number.</h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <div className="space-y-5 body-sm">
              <p>
                DigiTrans has moved things around Calabar since {site.founded}. We started with one
                bicycle and a campus route; today we run bicycles, electric cargo bikes and
                motorcycles from a depot on Marian Road.
              </p>
              <p>
                Because we employ the riders and control the dispatch, we can commit to the things
                that actually matter: a fixed campus rate, a reconciled market run, a fare that does
                not change in traffic, and proof of delivery on every parcel.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Link href="/about" className="link-underline">
                How we operate
                <ArrowRight className="size-3.5" />
              </Link>
              <Link href="/coverage" className="link-underline">
                See our coverage
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
