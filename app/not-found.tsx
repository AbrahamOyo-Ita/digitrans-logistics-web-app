import Link from "next/link";
import { ArrowLeft, PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <section className="bg-mist py-24">
      <div className="container-x max-w-xl text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-cyan shadow-[var(--shadow-card)] ring-1 ring-line">
          <PackageSearch className="size-7" />
        </span>
        <p className="mt-6 font-mono text-[0.75rem] uppercase tracking-[0.2em] text-cyan">404</p>
        <h1 className="display-2 mt-2 text-navy">This route isn’t on our map.</h1>
        <p className="lede mt-3">
          The page moved or never existed. Head back home, or track a delivery if that’s what you came for.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-dark">
            <ArrowLeft className="size-4" /> Back home
          </Link>
          <Link href="/track" className="btn btn-outline">
            Track a delivery
          </Link>
        </div>
      </div>
    </section>
  );
}
