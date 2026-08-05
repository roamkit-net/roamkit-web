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
