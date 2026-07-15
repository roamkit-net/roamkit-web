import { FeatureGrid } from "./FeatureGrid";
import { PhoneMockup } from "./PhoneMockup";
import { WaitlistForm } from "./WaitlistForm";

export function HeroSection() {
  return (
    <section className="relative px-6 pb-12 pt-4 sm:px-10 sm:pb-16 lg:px-16 lg:pb-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Stay connected.{" "}
              <span className="landing-gradient-text">Anywhere.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              RoamKit provides seamless global connectivity with eSIM technology
              for travelers and digital nomads.{" "}
              <span className="font-medium text-pink-400">
                One eSIM. Every destination.
              </span>
            </p>
          </div>

          <FeatureGrid />
          <WaitlistForm />
        </div>

        <div className="relative flex justify-center overflow-visible lg:justify-end lg:pl-0">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
