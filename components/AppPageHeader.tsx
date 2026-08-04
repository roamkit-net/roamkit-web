import type { ReactNode } from "react";

export type AppPageHeaderProps = {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/**
 * Dumb page header: renders slots only. Vertical rhythm lives here so pages
 * share one spacing scale (`gap-3`, default `mb-8`).
 */
export function AppPageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "mb-8",
}: AppPageHeaderProps) {
  return (
    <header
      data-testid="app-page-header"
      className={`flex flex-col gap-3 ${className}`.trim()}
    >
      {eyebrow}
      {title}
      {description}
      {actions}
      {children}
    </header>
  );
}
