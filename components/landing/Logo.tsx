export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="36" x2="36" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="10" fill="url(#logo-grad)" />
        <circle cx="18" cy="18" r="8" stroke="white" strokeWidth="1.5" fill="none" opacity="0.9" />
        <ellipse cx="18" cy="18" rx="8" ry="3" stroke="white" strokeWidth="1" fill="none" opacity="0.7" />
        <line x1="10" y1="18" x2="26" y2="18" stroke="white" strokeWidth="1" opacity="0.7" />
        <path
          d="M24 10 C28 10 30 12 30 16"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M26 8 C31 8 34 11 34 16"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </svg>
      <span className="text-xl font-bold tracking-tight text-white">
        Roam<span className="landing-gradient-text">Kit</span>
      </span>
    </div>
  );
}
