/** Only same-origin relative paths (blocks open redirects). */
export function isSafeReturnPath(path: string): boolean {
  if (!path || typeof path !== "string") {
    return false;
  }
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }
  if (path.includes("\\") || path.includes("\0")) {
    return false;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return false;
  }

  if (decoded.startsWith("//") || decoded.includes("\\") || decoded.includes("\0")) {
    return false;
  }
  if (decoded.includes("://")) {
    return false;
  }
  return true;
}

export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/me/esims",
): string {
  return raw && isSafeReturnPath(raw) ? raw : fallback;
}

export function loginHref(next?: string | null): string {
  if (!next || !isSafeReturnPath(next)) {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(next)}`;
}
