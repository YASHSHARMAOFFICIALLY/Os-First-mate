import { Navbar } from "@/features/landing/Navbar";
import { Hero } from "@/features/landing/Hero";
import { HowItWorks } from "@/features/landing/HowItWorks";
import { FeatureSections } from "@/features/landing/FeatureSection";
import { BuiltWith } from "@/features/landing/BuiltWith";
import { CTAFooter } from "@/features/landing/CTAFooter";

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
