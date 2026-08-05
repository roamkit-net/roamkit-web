import { cookies, headers } from "next/headers";

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
import { selectFeaturedFromPopular } from "@/lib/landing/featuredLocations";
import { isPopularGeoRankingEnabled } from "@/lib/popular/flags";
import { selectPopularLocations } from "@/lib/popular/ranking";
import { getViewerCountry } from "@/lib/popular/viewer-country";

/**
 * Await catalog in the page so Featured is present (or absent) on first paint.
 * Avoids Suspense skeleton → empty CLS when the API is down or returns no matches.
 *
 * Single fetch: ranking and Featured share the same dataset.
 */
async function loadFeaturedLocations() {
  try {
    const locations = await fetchAllLocations();
    const cookieStore = await cookies();
    const headerStore = await headers();
    const geoRankingEnabled = isPopularGeoRankingEnabled();
    const viewerCountry = geoRankingEnabled
      ? getViewerCountry({
          cookieCountry: cookieStore.get("rk_viewer_country")?.value,
          profileCountry: null,
          headerCountry: headerStore.get("cf-ipcountry"),
        })
      : null;

    const { locations: popular, ranking_source } = selectPopularLocations({
      locations,
      viewerCountry,
      geoRankingEnabled,
    });

    return selectFeaturedFromPopular({
      popular,
      rankingSource: ranking_source,
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await loadFeaturedLocations();

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--landing-ink)] text-[var(--landing-foreground)]">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 z-20">
          <Header />
        </div>
        <HeroSection />
      </div>
      <main className="relative flex-1">
        <FeaturedPlans locations={featured} />
        <HowItWorks />
        <WhyRoamKit />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
