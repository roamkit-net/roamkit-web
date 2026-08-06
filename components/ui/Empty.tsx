import { type HTMLAttributes, type ReactNode } from "react";

/**
 * Cap2.5 canonical Empty (ADR 016 / Cap2b inventory).
 *
 * Generic empty layout — no domain `type` props. Page owns copy and actions.
 *
 * ```tsx
 * <Card>
 *   <CardSection padding="lg">
 *     <Empty
 *       title="No eSIMs yet"
 *       description="…"
 *       action={…}
 *     />
 *   </CardSection>
 * </Card>
 * ```
 */

export type EmptyAlignment = "center" | "start";

export type EmptyProps = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  alignment?: EmptyAlignment;
  /** Tighter title (no text-lg) for nested / filter empties. */
  compact?: boolean;
};

export function emptyClassName({
  alignment = "center",
  className = "",
}: {
  alignment?: EmptyAlignment;
  className?: string;
} = {}): string {
  return [alignment === "center" ? "text-center" : "text-left", className]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function Empty({
  icon,
  title,
  description,
  action,
  alignment = "center",
  compact = false,
  className = "",
  ...rest
}: EmptyProps) {
  return (
    <div className={emptyClassName({ alignment, className })} {...rest}>
      {icon ? (
        <div
          className={
            alignment === "center"
              ? "mx-auto mb-4 flex justify-center text-slate-400"
              : "mb-4 text-slate-400"
          }
        >
          {icon}
        </div>
      ) : null}
      <p
        className={
          compact
            ? "font-medium text-slate-900"
            : "text-lg font-medium text-slate-900"
        }
      >
        {title}
      </p>
      {description ? (
        <div className="mt-2 text-sm text-slate-600">{description}</div>
      ) : null}
      {action ? (
        <div
          className={
            alignment === "center"
              ? "mt-6 flex flex-wrap items-center justify-center gap-3"
              : "mt-6 flex flex-wrap items-center gap-3"
          }
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}
