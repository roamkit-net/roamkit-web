import { NextResponse } from "next/server";

/**
 * Non-secret build metadata for smoke tests and release verification.
 * Shape mirrors API GET /version (ADR 013).
 */
export function GET() {
  const gitSha = process.env.ROAMKIT_GIT_SHA?.trim() || "";
  const payload = {
    git_sha: gitSha,
    build_date: process.env.ROAMKIT_BUILD_DATE?.trim() || "",
    image_tag: process.env.ROAMKIT_IMAGE_TAG?.trim() || "",
    environment: process.env.ROAMKIT_ENVIRONMENT?.trim() || "",
  };

  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  });
  if (gitSha) {
    headers.set("X-Release", gitSha);
  }

  return NextResponse.json(payload, { headers });
}
