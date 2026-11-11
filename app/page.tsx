import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { Services } from "@/components/home/Services";
import { Quote } from "@/components/home/Quote";
import { Tracking } from "@/components/home/Tracking";
import { Operations } from "@/components/home/Operations";
import { Pricing } from "@/components/home/Pricing";
import { Coverage } from "@/components/home/Coverage";
import { Testimonials } from "@/components/home/Testimonials";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Faq } from "@/components/home/Faq";
import { ClosingCta } from "@/components/home/ClosingCta";

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
      <Intro />
      <Services />
      <Quote />
      <Tracking />
      <Operations />
      <Pricing />
      <Coverage />
      <Testimonials />
      <HowItWorks />
      <Faq />
      <ClosingCta />
    </>
  );
}
