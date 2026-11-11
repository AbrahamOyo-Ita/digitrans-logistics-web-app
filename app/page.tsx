import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { Services } from "@/components/home/Services";
import { Tracking } from "@/components/home/Tracking";
import { WhyUs } from "@/components/home/WhyUs";
import { Pricing } from "@/components/home/Pricing";
import { Coverage } from "@/components/home/Coverage";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { Faq } from "@/components/home/Faq";
import { ContactCta } from "@/components/home/ContactCta";

export const metadata: Metadata = {
  title: "DigiTrans Logistics — Delivery, market runs & waybills in Calabar",
  description:
    "Same-day delivery, market runs, waybills and business dispatch across Calabar. Transparent fares from ₦1,000, live tracking and vetted riders in Cross River State.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Services />
      <Tracking />
      <WhyUs />
      <Pricing />
      <Coverage />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <ContactCta />
    </>
  );
}
