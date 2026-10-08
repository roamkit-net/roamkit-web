/** Visible account label: trimmed display name, otherwise the email. */
export function accountLabel(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const name = (displayName ?? "").trim();
  return name || email || "";
}
