import { type HTMLAttributes } from "react";

/**
 * Cap2.5 canonical Skeleton (ADR 016 / Cap2b inventory).
 *
 * One primitive — compose sizes via `className`. No domain skeletons.
 *
 * ```tsx
 * <Skeleton className="h-5 w-40" />
 * <Skeleton variant="circle" className="h-10 w-10" />
 * <Skeleton variant="line" className="h-3 w-28" />
 * ```
 *
 * One animation (`animate-pulse`). Respects `prefers-reduced-motion`.
 * Call sites must set stable width/height to avoid CLS when content replaces Skeleton.
 */

export type SkeletonVariant = "line" | "circle" | "rectangle";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant;
};

const VARIANT_CLASS: Record<SkeletonVariant, string> = {
  rectangle: "rounded-lg",
  line: "rounded-md",
  circle: "rounded-full",
};

export function skeletonClassName({
  variant = "rectangle",
  className = "",
}: {
  variant?: SkeletonVariant;
  className?: string;
} = {}): string {
  return [
    "animate-pulse bg-slate-200/80 motion-reduce:animate-none",
    VARIANT_CLASS[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function Skeleton({
  variant = "rectangle",
  className = "",
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={skeletonClassName({ variant, className })}
      {...rest}
    />
  );
}
