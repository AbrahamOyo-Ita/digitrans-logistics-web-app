import Link from "next/link";

export default function NotFound() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="container-x max-w-xl">
        <p className="font-mono text-[0.75rem] uppercase tracking-[0.2em] text-muted">404</p>
        <h1 className="display-2 mt-4">This page is not on our map.</h1>
        <p className="body-sm mt-4">
          It moved or never existed. Head back to the homepage, or track a delivery if that is what
          you came for.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">
            Back to home
          </Link>
          <Link href="/track" className="btn btn-outline">
            Track a delivery
          </Link>
        </div>
      </div>
    </section>
  );
}
