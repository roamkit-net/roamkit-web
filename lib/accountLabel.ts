/** Visible account label: trimmed display name, otherwise the email. */
export function accountLabel(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const name = (displayName ?? "").trim();
  return name || email || "";
}

export const ACCOUNT_LABEL_EVENT = "roamkit-account-label";

/** Tell the account menu on this page to show the saved label. */
export function publishAccountLabel(label: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<string>(ACCOUNT_LABEL_EVENT, { detail: label }),
  );
}
