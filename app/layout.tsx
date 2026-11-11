import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  metadataBase: new URL("https://digitrans.ng"),
  title: {
    default: "DigiTrans Logistics — Delivery, market runs & waybills in Calabar",
    template: "%s · DigiTrans Logistics",
  },
  description:
    "Same-day delivery, market runs, waybills and business dispatch across Calabar. Transparent fares, live tracking and vetted riders in Cross River State.",
  keywords: [
    "delivery in Calabar",
    "dispatch rider Calabar",
    "market run Calabar",
    "waybill Cross River",
    "logistics Calabar",
    "DigiTrans Logistics",
  ],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: site.name,
    title: "DigiTrans Logistics — Delivery, market runs & waybills in Calabar",
    description:
      "Same-day delivery, market runs, waybills and business dispatch across Calabar, Cross River State.",
    images: [{ url: "/images/street-wide.jpg", width: 1536, height: 864, alt: "A DigiTrans rider crossing Calabar at dusk" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiTrans Logistics — delivery, market runs and waybills in Calabar",
    description: "Same-day delivery, market runs and waybills across Calabar.",
    images: ["/images/street-wide.jpg"],
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0B1B2B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body className="min-h-screen bg-white antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
