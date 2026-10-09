import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { partnerPendingHeaders } from "@/lib/partner/inviteFlow";
import { publicOrigin } from "@/lib/partner/publicOrigin";

export const dynamic = "force-dynamic";

function apiBase(): string {
  return (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

export async function POST(request: Request) {
  const body = await request.text();
  const pending = (await cookies()).get("partner_pending")?.value;
  const headers = new Headers({
    "Content-Type": request.headers.get("content-type") ?? "application/json",
    Accept: "application/json",
    ...partnerPendingHeaders(pending),
  });
  const upstream = await fetch(`${apiBase()}/api/v1/auth/google/`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });
  const text = await upstream.text();
  const response = new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
  if (upstream.ok && pending) {
    const secure = publicOrigin(request).startsWith("https://");
    response.cookies.set("partner_pending", "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
