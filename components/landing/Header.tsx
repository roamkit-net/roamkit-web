import Link from "next/link";

import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
      <Logo />
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-cyan-300">
            In Development
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-slate-300 transition hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}
