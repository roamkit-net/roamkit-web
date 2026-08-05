import {
  forwardRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Cap2.4 canonical Card (ADR 016 / Cap2b inventory).
 *
 * Container only — no domain knowledge (Orders / eSIM / Wallet / Billing).
 * Spacing lives in CardHeader / CardSection / CardFooter.
 *
 * ```tsx
 * <Card>
 *   <CardHeader>…</CardHeader>
 *   <CardSection>…</CardSection>
 *   <CardSection divider>…</CardSection>
 *   <CardFooter>…</CardFooter>
 * </Card>
 * ```
 *
 * Forbidden API: elevation, shadowLevel, rounded, interactive, columns.
 * Interactive surfaces → ListRow / page composition.
 */

export type CardProps = HTMLAttributes<HTMLElement> & {
  /** Prefer `section` when replacing existing `<section>` panels. */
  as?: "div" | "section" | "article";
  children?: ReactNode;
};

/** App panel chrome — padding belongs on Header / Section / Footer. */
export function cardClassName({
  className = "",
}: { className?: string } = {}): string {
  return ["rounded-2xl border border-slate-200 bg-white shadow-sm", className]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { as = "div", className = "", children, ...rest },
  ref,
) {
  const Comp = as as ElementType;
  return (
    <Comp ref={ref} className={cardClassName({ className })} {...rest}>
      {children}
    </Comp>
  );
});

type SlotProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export type CardSectionProps = SlotProps & {
  /** Top border divider — the only Cap2.4 divider API (no standalone hr). */
  divider?: boolean;
  /** `md` = p-6 (default). `lg` = p-8 (empty states). */
  padding?: "md" | "lg" | "none";
};

const SECTION_PADDING: Record<
  NonNullable<CardSectionProps["padding"]>,
  string
> = {
  md: "p-6",
  lg: "p-8",
  none: "",
};

export function cardSectionClassName({
  divider = false,
  padding = "md",
  className = "",
}: {
  divider?: boolean;
  padding?: CardSectionProps["padding"];
  className?: string;
} = {}): string {
  return [
    SECTION_PADDING[padding ?? "md"],
    divider ? "border-t border-slate-200" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function CardSection({
  divider = false,
  padding = "md",
  className = "",
  children,
  ...rest
}: CardSectionProps) {
  return (
    <div
      className={cardSectionClassName({ divider, padding, className })}
      {...rest}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = SlotProps;

/** Title / actions band — not the same as CardSection. */
export function cardHeaderClassName({
  className = "",
}: {
  className?: string;
} = {}): string {
  return ["px-6 pt-6 pb-4", className].filter(Boolean).join(" ").trim();
}

export function CardHeader({
  className = "",
  children,
  ...rest
}: CardHeaderProps) {
  return (
    <div className={cardHeaderClassName({ className })} {...rest}>
      {children}
    </div>
  );
}

export type CardFooterProps = SlotProps;

/** Actions / meta band — not the same as CardSection. */
export function cardFooterClassName({
  className = "",
}: {
  className?: string;
} = {}): string {
  return ["px-6 pb-6 pt-4", className].filter(Boolean).join(" ").trim();
}

export function CardFooter({
  className = "",
  children,
  ...rest
}: CardFooterProps) {
  return (
    <div className={cardFooterClassName({ className })} {...rest}>
      {children}
    </div>
  );
}
