/** Browser-facing origin. Next behind a proxy reports ``0.0.0.0``. */

function firstHeader(value: string | null): string {
  return (value ?? "").split(",")[0]?.trim() ?? "";
}

export function publicOrigin(request: {
  url: string;
  headers: { get(name: string): string | null };
}): string {
  const forwardedHost = firstHeader(request.headers.get("x-forwarded-host"));
  const host = firstHeader(request.headers.get("host"));
  const candidate = forwardedHost || host;
  const hostname = candidate.split(":")[0];
  if (candidate && hostname !== "0.0.0.0") {
    const proto =
      firstHeader(request.headers.get("x-forwarded-proto")) ||
      (hostname === "localhost" || hostname === "127.0.0.1" ? "http" : "https");
    return `${proto}://${candidate}`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl) {
    return appUrl;
  }
  return new URL(request.url).origin;
}
