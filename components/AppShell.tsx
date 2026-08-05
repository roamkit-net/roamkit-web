import type { PropsWithChildren, ReactNode } from "react";

import { AuthNav } from "@/components/AuthNav";
import { TopBar } from "@/components/TopBar";

/**
 * Cap3.1 — AppShell owns layout; pages own content.
 * Spacing / background via `--app-*` only (see globals.css `.app-shell*`).
 */

const MAX_WIDTH_CLASS = {
  "2xl": "app-shell-main--narrow",
  "3xl": "app-shell-main--mid",
  "4xl": "app-shell-main--default",
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
 * Sole layout entry point for Cap3 AppShell routes.
 */
export function AppShell({
  nav,
  rightSlot,
  maxWidth = "4xl",
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <main className={`app-shell-main ${MAX_WIDTH_CLASS[maxWidth]}`}>
        <TopBar nav={nav} rightSlot={rightSlot ?? <AuthNav />} />
        <div data-testid="page-content" className="app-shell-content">
          {children}
        </div>
      </main>
    </div>
  );
}
