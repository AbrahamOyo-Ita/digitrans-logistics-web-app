import type { Metadata } from "next";
import { Hero, FeatureStrip } from "@/components/home/Hero";
import { Intro, ServiceCards } from "@/components/home/Intro";
import { WhyUs } from "@/components/home/WhyUs";
import { Industries } from "@/components/home/Industries";
import { Tracking } from "@/components/home/Tracking";
import { Numbers } from "@/components/home/Numbers";
import { Testimonials } from "@/components/home/Testimonials";
import { ClosingCta } from "@/components/home/ClosingCta";
import { Insights } from "@/components/home/Insights";

export const metadata: Metadata = {
  title: "DigiTrans Logistics — Delivery, market runs & waybills in Calabar",
  description:
    "Same-day delivery, market runs, waybills and business dispatch across Calabar. Fares quoted before you book, live tracking and vetted riders in Cross River State.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureStrip />
      <Intro />
      <ServiceCards />
      <WhyUs />
      <Industries />
      <Tracking />
      <Numbers />
      <Testimonials />
      <Insights />
      <ClosingCta />
    </>
  );
}
