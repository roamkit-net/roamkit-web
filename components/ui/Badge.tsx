import { type HTMLAttributes, type ReactNode } from "react";

/**
 * Cap2.5 canonical Badge (ADR 016 / Cap2b inventory).
 *
 * Visual variants only — pages map domain status → `variant`.
 *
 * ```tsx
 * <Badge variant="neutral">Ready</Badge>
 * <Badge variant="warning">Polygon only</Badge>
 * ```
 *
 * Forbidden: status="paid", walletStatus, domain enums.
 */

export type BadgeVariant =
  "default" | "primary" | "success" | "warning" | "danger" | "neutral";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children?: ReactNode;
};

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  neutral: "bg-slate-200 text-slate-600",
  primary: "bg-sky-100 text-sky-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "border border-amber-200 bg-amber-50 text-amber-950",
  danger: "bg-red-100 text-red-800",
};

export function badgeClassName({
  variant = "default",
  className = "",
}: {
  variant?: BadgeVariant;
  className?: string;
} = {}): string {
  return [
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
    VARIANT_CLASS[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function Badge({
  variant = "default",
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={badgeClassName({ variant, className })} {...rest}>
      {children}
    </span>
  );
}
