import { CONTACT_EMAIL, contactMailto } from "@/lib/routes";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 px-6 py-8 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-center text-sm text-slate-500 sm:text-left">
          © 2026 RoamKit.
          <br className="sm:hidden" />{" "}
          All rights reserved.
        </p>
        <a
          href={contactMailto}
          className="text-sm text-slate-400 outline-none transition hover:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a]"
        >
          Contact
          <span className="sr-only"> ({CONTACT_EMAIL})</span>
        </a>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 landing-gradient-bg opacity-60" />
    </footer>
  );
}
