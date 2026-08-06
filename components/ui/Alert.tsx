import type { HTMLAttributes, ReactNode } from "react";

/**
 * Cap2.2 canonical Alert (ADR 016 / Cap2b inventory).
 *
 * Semantic variants only — colors come from tokens/classes, not the API.
 *
 * ```tsx
 * <Alert variant="warning" title="Unable to load">
 *   Something went wrong.
 * </Alert>
 * ```
 *
 * Alert ≠ Toast. This is an in-layout banner/panel, not a notification stack.
 *
 * Cap2.2 gaps (do not expand the API yet):
 * - DepositNetworkWarning (p-5, amber-950, structured list) — domain aside; compose later
 * - Voucher rose error chrome (`rose-50`) — map to `error` later or keep local
 * - Interactive amber boxes with focus rings (wallet/CEX verify panels)
 * - DepositPendingBanner domain layout (actions + dismiss) — compose Alert later
 */

export type AlertVariant = "info" | "success" | "warning" | "error";
/** `md` = page panel (rounded-2xl p-6); `sm` = inline / auth (rounded-lg px-3 py-2). */
export type AlertSize = "sm" | "md";

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  variant?: AlertVariant;
  size?: AlertSize;
  title?: ReactNode;
  children?: ReactNode;
  /** Optional trailing action (button/link). */
  action?: ReactNode;
  /** Optional leading icon. */
  icon?: ReactNode;
};

const VARIANT_CLASS: Record<AlertVariant, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
};

const SIZE_CLASS: Record<AlertSize, string> = {
  sm: "rounded-lg px-3 py-2 text-sm",
  md: "rounded-2xl p-6",
};

const BASE_CLASS = "border";

export function alertClassName({
  variant = "info",
  size = "md",
  className = "",
}: {
  variant?: AlertVariant;
  size?: AlertSize;
  className?: string;
} = {}): string {
  return [BASE_CLASS, SIZE_CLASS[size], VARIANT_CLASS[variant], className]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function Alert({
  variant = "info",
  size = "md",
  title,
  children,
  action,
  icon,
  className = "",
  role,
  ...rest
}: AlertProps) {
  const resolvedRole =
    role ?? (variant === "error" || variant === "warning" ? "alert" : "status");

  return (
    <div
      role={resolvedRole}
      className={alertClassName({ variant, size, className })}
      {...rest}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          {icon ? <div className="shrink-0">{icon}</div> : null}
          <div className="min-w-0 space-y-1">
            {title ? <p className="font-medium">{title}</p> : null}
            {children ? (
              <div className={title ? "text-sm" : undefined}>{children}</div>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
