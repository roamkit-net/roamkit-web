import { NextResponse } from "next/server";

import { publicOrigin } from "@/lib/partner/publicOrigin";

export const dynamic = "force-dynamic";

function apiBase(): string {
  return (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const signed = await fetch(`${apiBase()}/api/internal/partner/join-sign/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });
  if (!signed.ok) {
    return new NextResponse("Not found", {
      status: signed.status === 429 ? 429 : 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const body = (await signed.json()) as { payload?: string };
  if (!body.payload) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const origin = publicOrigin(request);
  const response = NextResponse.redirect(new URL("/join/complete", origin));
  response.cookies.set("partner_pending", body.payload, {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
