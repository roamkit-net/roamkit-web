import type { ReactNode } from "react";

export type TopBarProps = {
  nav?: ReactNode;
  /** Account cluster today; notifications / switchers later. */
  rightSlot?: ReactNode;
};

/**
 * App chrome top row. CSS grid keeps `rightSlot` pinned right without flex-wrap.
 */
export function TopBar({ nav, rightSlot }: TopBarProps) {
  return (
    <div
      data-testid="top-bar"
      className="grid grid-cols-[1fr_auto] items-start gap-4"
    >
      <div className="min-w-0">{nav}</div>
      <div className="justify-self-end">{rightSlot}</div>
    </div>
  );
}
