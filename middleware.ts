import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isTeamHost, isTeamPublicAsset, teamContentSecurityPolicy } from "@/lib/partner/host";

const TEAM_PAGES = new Set(["/", "/customers", "/grants", "/login"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const team = isTeamHost(host);
  const path = request.nextUrl.pathname;
  const headers = new Headers(request.headers);
  headers.set("x-roamkit-host", team ? "team" : "consumer");

  if (!team && (path === "/partner" || path.startsWith("/partner/"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!team) {
    return NextResponse.next({ request: { headers } });
  }

  if (
    !TEAM_PAGES.has(path) &&
    !path.startsWith("/_next") &&
    !path.startsWith("/api/") &&
    !isTeamPublicAsset(path)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (
    path === "/login" ||
    path.startsWith("/_next") ||
    path.startsWith("/api/") ||
    isTeamPublicAsset(path)
  ) {
    return NextResponse.next({ request: { headers } });
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = teamContentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV === "development",
  });
  headers.set("Content-Security-Policy", csp);
  const url = request.nextUrl.clone();
  url.pathname = path === "/" ? "/partner" : `/partner${path}`;
  const response = NextResponse.rewrite(url, { request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
