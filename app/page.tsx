import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#05070A]">
      <div className="landing-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="landing-grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <Header />
      <main className="relative flex-1">
        <HeroSection />
        <StatsBar />
      </main>
      <Footer />
    </div>
  );
}
