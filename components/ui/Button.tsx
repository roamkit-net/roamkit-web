import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Cap2.1 canonical Button (ADR 016 / Cap2b inventory).
 *
 * Small API on purpose — do not add variants during migration; note gaps instead.
 *
 * ```tsx
 * <Button variant="primary" size="md">Browse plans</Button>
 * ```
 *
 * Themes via `tone` (not extra variants):
 * - app = store primary via `--app-*` (Cap3.4)
 * - auth = AuthShell primary via `--auth-*` (Cap4.2)
 *
 * Cap2.1 gaps (do not expand the API yet — log and revisit):
 * - DepositCta sky outline secondary (`border-sky-300 bg-sky-50`) ≠ slate secondary
 * - Text “link” CTAs (`text-sky-700`) — not a Button variant; keep as Link styles
 * - Landing `.landing-cta*` — Reuse until Cap2 landing tone (if ever)
 * - Avatar / tab / segment controls — Replace / Reuse per Cap2b
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
/** Theme binding — not a visual variant. Default `app`. */
export type ButtonTone = "app" | "auth";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  children?: ReactNode;
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "rounded-lg px-3 py-1.5 text-sm",
  md: "rounded-lg px-4 py-2.5 text-sm",
  /** Matches deposit / voucher primary chrome (rounded-xl). */
  lg: "rounded-xl px-4 py-2.5 text-sm",
};

/** Match AuthNav / AccountCluster: ring gap must sit on dark AppShell, not default white. */
const APP_RING_OFFSET =
  "focus-visible:ring-offset-[var(--app-background)]";

/** AuthShell frame is dark — ring gap must sit on `--auth-background`. */
const AUTH_RING_OFFSET =
  "focus-visible:ring-offset-[var(--auth-background)]";

const VARIANT_CLASS: Record<
  ButtonTone,
  Record<ButtonVariant, string>
> = {
  app: {
    primary: `bg-[var(--app-primary)] font-semibold text-[var(--app-primary-foreground)] hover:bg-[var(--app-primary-hover)] focus-visible:ring-[var(--app-focus-ring)] ${APP_RING_OFFSET}`,
    secondary: `border border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50 focus-visible:ring-sky-500 ${APP_RING_OFFSET}`,
    ghost: `font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-sky-500 ${APP_RING_OFFSET}`,
    danger: `bg-red-600 font-semibold text-white hover:bg-red-700 focus-visible:ring-red-500 ${APP_RING_OFFSET}`,
  },
  auth: {
    primary: `bg-[var(--auth-primary)] font-semibold text-[var(--auth-primary-foreground)] hover:bg-[var(--auth-primary-hover)] focus-visible:ring-[var(--auth-focus-ring)] ${AUTH_RING_OFFSET}`,
    secondary: `border border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50 focus-visible:ring-[var(--auth-focus-ring)] ${AUTH_RING_OFFSET}`,
    ghost: `font-medium text-[var(--auth-primary)] hover:text-[var(--auth-primary-hover)] focus-visible:ring-[var(--auth-focus-ring)] ${AUTH_RING_OFFSET}`,
    danger: `bg-red-600 font-semibold text-white hover:bg-red-700 focus-visible:ring-red-500 ${AUTH_RING_OFFSET}`,
  },
};

const BASE_CLASS =
  "inline-flex items-center justify-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Shared class builder for `<button>` and polymorphic callers (e.g. Next `Link`).
 */
export function buttonClassName({
  variant = "primary",
  size = "md",
  tone = "app",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  className?: string;
} = {}): string {
  return [BASE_CLASS, SIZE_CLASS[size], VARIANT_CLASS[tone][variant], className]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      tone = "app",
      className = "",
      type = "button",
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName({ variant, size, tone, className })}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
