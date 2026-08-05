import { CONTACT_EMAIL, contactMailto } from "@/lib/routes";

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--landing-border)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-center text-sm text-[var(--landing-muted-soft)] sm:text-left">
          © 2026 RoamKit.
          <br className="sm:hidden" />{" "}
          All rights reserved.
        </p>
        <a
          href={contactMailto}
          className="landing-link text-sm outline-none"
        >
          Contact
          <span className="sr-only"> ({CONTACT_EMAIL})</span>
        </a>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-[var(--landing-cta)] opacity-40"
        aria-hidden="true"
      />
    </footer>
  );
}
