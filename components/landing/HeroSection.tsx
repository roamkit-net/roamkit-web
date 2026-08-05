import Link from "next/link";
import Image from "next/image";

import { routes } from "@/lib/routes";

const HERO_IMAGE = "/landing/hero-travel.jpg";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[min(100svh,52rem)] flex-col justify-end overflow-hidden pb-12 pt-24 sm:justify-center sm:pb-16 sm:pt-28 lg:pb-20 lg:pt-32">
      {/* Ink fallback if image fails / while loading — prevents CLS flash */}
      <div
        className="absolute inset-0 bg-[var(--landing-ink)]"
        aria-hidden="true"
      >
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          quality={75}
          sizes="100vw"
          className="landing-hero-media object-cover object-[72%_center] lg:object-right"
        />
      </div>
      <div
        className="landing-hero-overlay pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="landing-hero-enter flex max-w-xl flex-col gap-8 lg:max-w-2xl">
            <div className="flex flex-col gap-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--landing-muted)]">
                RoamKit
              </p>
              <h1 className="landing-display text-4xl font-bold leading-[1.15] tracking-tight text-[var(--landing-foreground)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
                Stay connected before you land.
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
                Browse global data plans, top up your prepaid balance, and
                activate your eSIM instantly.
              </p>
              <p className="text-sm text-[var(--landing-muted-soft)]">
                Supports prepaid credits via Polygon USDT.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={routes.plans}
                className="landing-cta inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold outline-none"
              >
                Browse plans
              </Link>
              <Link
                href={routes.register}
                className="landing-cta-secondary inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold outline-none"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
