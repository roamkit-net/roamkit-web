import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/landing/logo-r.png"
        alt="RoamKit"
        width={120}
        height={80}
        priority
        unoptimized
        className="h-10 w-auto shrink-0 object-contain sm:h-11"
      />
      <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
        Roam<span className="landing-gradient-text">Kit</span>
      </span>
    </div>
  );
}
