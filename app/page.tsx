import { FeaturedPlans } from "@/components/landing/FeaturedPlans";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import {
  ClosingCta,
  HowItWorks,
  WhyRoamKit,
} from "@/components/landing/LandingSections";
import { fetchAllLocations } from "@/lib/api";
import { selectFeaturedLocations } from "@/lib/landing/featuredLocations";

/**
 * Await catalog in the page so Featured is present (or absent) on first paint.
 * Avoids Suspense skeleton → empty CLS when the API is down or returns no matches.
 */
async function loadFeaturedLocations() {
  try {
    return selectFeaturedLocations(await fetchAllLocations());
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await loadFeaturedLocations();

  return (
    <div className="landing-page-bg relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="landing-page-overlay pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <Header />
      <main className="relative flex-1">
        <HeroSection />
        <FeaturedPlans locations={featured} />
        <HowItWorks />
        <WhyRoamKit />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
