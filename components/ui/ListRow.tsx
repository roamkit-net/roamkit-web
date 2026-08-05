import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

/**
 * Cap2.4 canonical ListRow (ADR 016 / Cap2b inventory).
 *
 * Composition surface — not a domain card. Slots: leading | content | trailing.
 *
 * ```tsx
 * <ListRow leading={…} trailing={…}>Title and meta</ListRow>
 * ```
 *
 * For Link / button wrappers, use `listRowClassName` (same pattern as Button).
 * Interactive hover chrome is opt-in via `interactive` — not on Card.
 */

export type ListRowProps = HTMLAttributes<HTMLElement> & {
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  /** Hover border/shadow (LocationCard / eSIM list). Default static (PackageRow). */
  interactive?: boolean;
  as?: "div" | "article" | "li";
};

export function listRowClassName({
  interactive = false,
  className = "",
}: {
  interactive?: boolean;
  className?: string;
} = {}): string {
  return [
    "flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm",
    interactive ? "transition hover:border-sky-300 hover:shadow-md" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export const ListRow = forwardRef<HTMLElement, ListRowProps>(function ListRow(
  {
    leading,
    trailing,
    children,
    interactive = false,
    as = "div",
    className = "",
    ...rest
  },
  ref,
) {
  const Comp = as;
  return (
    <Comp
      ref={ref as never}
      className={listRowClassName({ interactive, className })}
      {...rest}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">{children}</div>
      {trailing ? (
        <div className="flex shrink-0 items-center gap-3">{trailing}</div>
      ) : null}
    </Comp>
  );
});
