import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function apiBase(): string {
  return (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      { code: "authentication_required" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const pending = (await cookies()).get("partner_pending")?.value ?? "";
  const upstream = await fetch(`${apiBase()}/api/internal/partner/consume/`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ payload: pending }),
    cache: "no-store",
  });
  const text = await upstream.text();
  const response = new NextResponse(text || "{}", {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
  if (upstream.ok) {
    response.cookies.set("partner_pending", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
