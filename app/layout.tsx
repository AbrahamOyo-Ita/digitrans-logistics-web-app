import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
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
    images: [{ url: "/images/hero-courier.jpg", width: 1024, height: 1536, alt: "DigiTrans rider in Calabar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiTrans Logistics — move Calabar, door to door",
    description: "Same-day delivery, market runs and waybills across Calabar.",
    images: ["/images/hero-courier.jpg"],
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0A1B35",
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
        <WhatsAppFab />
      </body>
    </html>
  );
}
