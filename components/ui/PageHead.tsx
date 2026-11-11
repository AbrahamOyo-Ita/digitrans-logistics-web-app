import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHead({
  title,
  lead,
  trail,
  image,
  imageAlt,
  eyebrow,
  children,
}: {
  title: string;
  lead?: string;
  trail: { label: string; href?: string }[];
  image?: string;
  imageAlt?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      {image ? (
        <div className="absolute inset-0 -z-10">
          <Image src={image} alt={imageAlt ?? ""} fill priority sizes="100vw" className="object-cover object-[60%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/55" />
          <div className="absolute inset-0 bg-navy/20" />
        </div>
      ) : null}

      <div className="container-x pb-14 pt-10 sm:pb-20 sm:pt-12">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-[0.75rem] text-white/45">
            <li>
              <Link href="/" className="transition-colors hover:text-white">
                Home
              </Link>
            </li>
            {trail.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5">
                <ChevronRight className="size-3 text-white/25" />
                {item.href ? (
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-white/70">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 max-w-3xl">
          {eyebrow && <p className="eyebrow eyebrow-light">{eyebrow}</p>}
          <h1 className={"display-1 text-white" + (eyebrow ? " mt-4" : "")}>{title}</h1>
          {lead && <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed text-white/65">{lead}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
