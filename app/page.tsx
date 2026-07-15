import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";

export default function Home() {
  return (
    <div className="landing-page-bg relative flex min-h-screen flex-col overflow-hidden">
      <div className="landing-page-overlay pointer-events-none absolute inset-0" aria-hidden="true" />

      <Header />
      <main className="relative flex-1">
        <HeroSection />
        <StatsBar />
      </main>
      <Footer />
    </div>
  );
}
