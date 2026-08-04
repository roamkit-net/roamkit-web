import type { PropsWithChildren, ReactNode } from "react";

import { AuthNav } from "@/components/AuthNav";
import { TopBar } from "@/components/TopBar";

const MAX_WIDTH_CLASS = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
} as const;

export type AppShellMaxWidth = keyof typeof MAX_WIDTH_CLASS;

export type AppShellProps = PropsWithChildren<{
  nav?: ReactNode;
  /** Defaults to AuthNav. Override to compose extra chrome in the top-right. */
  rightSlot?: ReactNode;
  maxWidth?: AppShellMaxWidth;
}>;

/**
 * Store / account chrome: TopBar + page body. Not a Next.js `layout.tsx`.
 */
export function AppShell({
  nav,
  rightSlot,
  maxWidth = "4xl",
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className={`mx-auto w-full ${MAX_WIDTH_CLASS[maxWidth]}`}>
        <TopBar nav={nav} rightSlot={rightSlot ?? <AuthNav />} />
        <div data-testid="page-content" className="mt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
