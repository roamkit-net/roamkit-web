import { NextResponse } from "next/server";

import { INVITE_REGISTER_PATH } from "@/lib/partner/inviteFlow";
import { publicOrigin } from "@/lib/partner/publicOrigin";

export const dynamic = "force-dynamic";

const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

function firstQuery(url: URL, name: string): string {
  return url.searchParams.getAll(name)[0] ?? "";
}

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
  const url = new URL(request.url);
  const utm = Object.fromEntries(
    UTM_FIELDS.map((field) => [field, firstQuery(url, field)]),
  );
  const signed = await fetch(`${apiBase()}/api/internal/partner/join-sign/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ token, ...utm }),
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
  const response = NextResponse.redirect(new URL(INVITE_REGISTER_PATH, origin));
  response.cookies.set("partner_pending", body.payload, {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
