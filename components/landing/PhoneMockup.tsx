import Image from "next/image";

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full">
      <div className="relative mx-auto mt-2 flex justify-center sm:mt-4">
        <Image
          src="/landing/phone-mockup.png"
          alt="RoamKit mobile app showing Europe eSIM plan and data usage"
          width={1536}
          height={1024}
          priority
          className="h-auto w-[780px] max-w-[min(780px,100%)] rotate-[-2deg] drop-shadow-2xl drop-shadow-purple-500/30 sm:w-[900px] sm:max-w-[min(900px,100%)] lg:w-[1050px] lg:max-w-[min(1050px,100%)]"
        />
      </div>
    </div>
  );
}
