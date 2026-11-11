import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHead } from "@/components/ui/PageHead";
import { Chip, Eyebrow } from "@/components/ui/Bits";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Guides & notes — delivery in Calabar | DigiTrans Logistics",
  description:
    "Practical notes from the DigiTrans dispatch desk: what a Calabar delivery should cost, how to send a market list, and how waybills work.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
  return (
    <>
      <PageHead
        title="Notes from the dispatch desk."
        lead="Practical writing about moving things around Calabar — pricing arithmetic, market runs and the waybill counter. No growth hacks, just what we have learned."
        trail={[{ label: "Insights" }]}
      />

      <section className="section bg-white">
        <div className="container-x">
          <div className="grid gap-6 md:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.slug}
                className="group flex flex-col overflow-hidden rounded-[16px] border border-line bg-white transition-all duration-300 hover:shadow-[0_20px_44px_-30px_rgba(11,27,43,0.5)]"
              >
                <Link href={`/insights/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <Chip tone="soft">{article.category}</Chip>
                  <h2 className="mt-3 font-display text-[1.125rem] font-medium leading-snug tracking-tight text-navy">
                    <Link href={`/insights/${article.slug}`} className="transition-colors hover:text-cyan">
                      {article.title}
                    </Link>
                  </h2>
                  <p className="mt-2.5 flex-1 text-[0.875rem] leading-relaxed text-muted">
                    {article.excerpt}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="text-[0.6875rem] text-muted">
                      {article.date} · {article.readTime}
                    </span>
                    <Link
                      href={`/insights/${article.slug}`}
                      className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-cyan hover:text-cyan-600"
                    >
                      Read more
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-[18px] border border-line bg-paper p-7 sm:p-9">
            <Eyebrow>Stay in the loop</Eyebrow>
            <h2 className="display-3 mt-3">Route and tariff changes, once a month.</h2>
            <p className="body-sm mt-2 max-w-lg">
              Subscribe in the footer, or follow dispatch on WhatsApp for same-day service notices.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/quote" className="pill pill-navy">
                Book a delivery
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/contact" className="pill pill-line">
                Contact dispatch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
