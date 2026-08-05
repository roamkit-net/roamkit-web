import type { ReactNode } from "react";

export type TopBarProps = {
  nav?: ReactNode;
  /** Account cluster today; notifications / switchers later. */
  rightSlot?: ReactNode;
};

/** Shared class for AppShell back/nav links (dark shell contrast). */
export const appShellNavLinkClassName = "app-shell-nav-link";

/**
 * Cap3.2 — Shell navigation chrome (part of AppShell, not a page header).
 * Static, always visible; height from `--app-topbar-height`.
 */
export function TopBar({ nav, rightSlot }: TopBarProps) {
  return (
    <div data-testid="top-bar" className="app-topbar">
      <div className="app-topbar-nav">{nav}</div>
      <div className="app-topbar-end">{rightSlot}</div>
    </div>
  );
}
