import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Chip, Eyebrow, ReadMore } from "@/components/ui/Bits";
import { articles } from "@/lib/articles";

/** Band 11 — insights: three article cards with photographs. */
export function Insights() {
  return (
    <section className="section-tight bg-white">
      <div className="container-x">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Guides &amp; notes</Eyebrow>
            <h2 className="display-2 mt-3 max-w-[15ch]">Latest from the dispatch desk.</h2>
          </div>
          <ReadMore href="/insights" label="View all articles" />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
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
                <h3 className="mt-3 font-display text-[1.0625rem] font-medium leading-snug tracking-tight text-navy">
                  <Link href={`/insights/${article.slug}`} className="transition-colors hover:text-cyan">
                    {article.title}
                  </Link>
                </h3>
                <p className="mt-2.5 flex-1 text-[0.8125rem] leading-relaxed text-muted">
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
      </div>
    </section>
  );
}
