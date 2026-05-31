import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureSections } from "@/components/landing/FeatureSection";
import { BuiltWith } from "@/components/landing/BuiltWith";
import { CTAFooter } from "@/components/landing/CTAFooter";

export default function Home() {
  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />
      <Hero />
      <HowItWorks />
      <FeatureSections />
      <BuiltWith />
      <CTAFooter />
    </main>
  );
}
