import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const pending = (await cookies()).get("partner_pending")?.value;
  const headers = new Headers({
    "Content-Type": request.headers.get("content-type") ?? "application/json",
    Accept: "application/json",
  });
  if (pending) {
    headers.set("X-Partner-Pending", pending);
  }
  const base = (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");
  const upstream = await fetch(`${base}/api/v1/auth/register/`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });
  const text = await upstream.text();
  // Do not clear partner_pending. Email submit must not reveal whether the
  // address was new, and the pending row becomes the authority after submit.
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
