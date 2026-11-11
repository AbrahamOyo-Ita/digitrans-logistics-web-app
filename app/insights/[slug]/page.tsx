import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Chip, Eyebrow } from "@/components/ui/Bits";
import { ARTICLE_BY_SLUG, articles } from "@/lib/articles";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLE_BY_SLUG[slug];
  if (!article) return { title: "Article not found" };
  return {
    title: `${article.title} | DigiTrans Logistics`,
    description: article.excerpt,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: { title: article.title, description: article.excerpt, images: [article.image] },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = ARTICLE_BY_SLUG[slug];
  if (!article) notFound();

  const more = articles.filter((a) => a.slug !== article.slug);

  return (
    <article>
      <header className="band">
        <div className="container-x pb-12 pt-8 sm:pb-16 sm:pt-10">
          <nav aria-label="Breadcrumb" className="text-[0.75rem] text-white/45">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-white/25">
                /
              </li>
              <li>
                <Link href="/insights" className="transition-colors hover:text-white">
                  Insights
                </Link>
              </li>
            </ol>
          </nav>

          <div className="mt-8 max-w-3xl">
            <Chip tone="soft">{article.category}</Chip>
            <h1 className="display-1 mt-4 text-white">{article.title}</h1>
            <p className="mt-5 max-w-2xl text-[1rem] leading-relaxed text-white/65">{article.excerpt}</p>
            <p className="mt-6 text-[0.75rem] text-white/45">
              {article.date} · {article.readTime} · DigiTrans dispatch desk
            </p>
          </div>
        </div>
      </header>

      <div className="container-x -mt-8 sm:-mt-10">
        <div className="relative aspect-[16/10] max-h-[26rem] overflow-hidden rounded-[18px] bg-paper sm:aspect-[21/9]">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            priority
            sizes="(max-width: 1240px) 100vw, 1240px"
            className="object-cover"
          />
        </div>
      </div>

      <div className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="space-y-8">
              {article.body.map((block, i) => (
                <section key={i}>
                  {block.heading && <h2 className="display-3">{block.heading}</h2>}
                  <div className={block.heading ? "mt-3 space-y-4" : "space-y-4"}>
                    {block.paragraphs.map((p) => (
                      <p key={p.slice(0, 24)} className="text-[1rem] leading-[1.75] text-slate-ink">
                        {p}
                      </p>
                    ))}
                  </div>
                  {block.bullets && (
                    <ul className="mt-4 space-y-2.5 border-l-2 border-cyan/30 pl-5">
                      {block.bullets.map((b) => (
                        <li key={b.slice(0, 24)} className="text-[0.9375rem] leading-relaxed text-slate-ink">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-8">
              <Link href="/insights" className="pill pill-line pill-sm">
                <ArrowLeft className="size-3.5" />
                All articles
              </Link>
              <Link href="/quote" className="pill pill-navy pill-sm">
                Get a fare
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-28 rounded-[18px] border border-line bg-paper p-6">
              <Eyebrow>Move something today</Eyebrow>
              <h2 className="display-3 mt-3">Fares before you book.</h2>
              <p className="body-sm mt-2">
                Pick two zones and see the exact charge, distance and delivery window.
              </p>
              <Link href="/quote" className="pill pill-navy pill-sm mt-5 w-full">
                Price my delivery
              </Link>
              <Link href="/pricing" className="pill pill-line pill-sm mt-2 w-full">
                See the tariff table
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <section className="border-t border-line bg-paper py-14">
        <div className="container-x">
          <h2 className="display-3">Keep reading</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {more.map((item) => (
              <Link
                key={item.slug}
                href={`/insights/${item.slug}`}
                className="group flex items-center gap-4 rounded-[14px] border border-line bg-white p-4 transition-colors hover:border-line-strong"
              >
                <span className="relative size-20 shrink-0 overflow-hidden rounded-[10px]">
                  <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.6875rem] text-muted">{item.category}</span>
                  <span className="mt-1 block text-[0.9375rem] font-medium leading-snug text-navy group-hover:text-cyan">
                    {item.title}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
