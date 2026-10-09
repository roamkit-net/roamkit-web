import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { GET } from "../../app/join/[token]/route";
import {
  ACCOUNT_EXISTS_LOGIN_MESSAGE,
  INVITE_REGISTER_PATH,
  JOIN_COMPLETE_PATH,
  PORTAL_PATH,
  accountExistsLoginPath,
  accountExistsNotice,
  googleLandingPath,
  isAccountExistsCode,
  isInviteRegistration,
  partnerPendingHeaders,
  registerLandingPath,
} from "./inviteFlow";

const root = process.cwd();

function source(path: string): string {
  return readFileSync(`${root}/${path}`, "utf8");
}

describe("invite registration landing", () => {
  it("sends an authenticated invite visitor to consume and leaves normal register alone", () => {
    assert.equal(isInviteRegistration("invite"), true);
    assert.equal(isInviteRegistration("other"), false);
    assert.equal(
      registerLandingPath({ fromInvite: true, authenticated: true }),
      JOIN_COMPLETE_PATH,
    );
    assert.equal(
      registerLandingPath({ fromInvite: false, authenticated: true }),
      PORTAL_PATH,
    );
    assert.equal(
      registerLandingPath({ fromInvite: true, authenticated: false }),
      INVITE_REGISTER_PATH,
    );
    assert.equal(googleLandingPath(), PORTAL_PATH);
  });

  it("forwards the cookie as a header and never as a visit id", () => {
    assert.deepEqual(partnerPendingHeaders(undefined), {});
    assert.deepEqual(partnerPendingHeaders("signed"), {
      "X-Partner-Pending": "signed",
    });
    assert.equal("visit_id" in partnerPendingHeaders("signed"), false);
  });
});

describe("GET /join/[token]", () => {
  it("sets the cookie and redirects to register without UTM", async () => {
    const previous = globalThis.fetch;
    let posted: { token?: string; utm_source?: string } = {};
    globalThis.fetch = (async (_input, init) => {
      posted = JSON.parse(String(init?.body)) as typeof posted;
      return new Response(JSON.stringify({ payload: "signed-visit" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;
    try {
      const response = await GET(
        new Request(
          "https://staging.roamkit.net/join/ABC123?utm_source=tiktok&utm_source=later",
        ),
        { params: Promise.resolve({ token: "ABC123" }) },
      );
      assert.equal(response.status, 307);
      const location = response.headers.get("location") ?? "";
      assert.equal(
        location,
        "https://staging.roamkit.net/register?from=invite",
      );
      assert.equal(location.includes("utm_"), false);
      assert.equal(location.includes("ABC123"), false);
      assert.equal(posted.token, "ABC123");
      assert.equal(posted.utm_source, "tiktok");
      const cookie = response.headers.get("set-cookie") ?? "";
      assert.match(cookie, /partner_pending=signed-visit/);
      assert.match(cookie, /HttpOnly/i);
      assert.match(cookie, /SameSite=Lax/i);
      assert.match(cookie, /Secure/i);
    } finally {
      globalThis.fetch = previous;
    }
  });

  it("does not set an invite cookie when the token is rejected", async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("", { status: 404 })) as typeof fetch;
    try {
      const response = await GET(
        new Request("https://staging.roamkit.net/join/missing"),
        { params: Promise.resolve({ token: "missing" }) },
      );
      assert.equal(response.status, 404);
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal(response.headers.get("location"), null);
    } finally {
      globalThis.fetch = previous;
    }
  });
});

describe("invite web wiring", () => {
  it("keeps email registration on the same-origin proxy without clearing the cookie", () => {
    const client = source("lib/api.ts");
    const register = source("app/api/auth/register/route.ts");
    assert.match(client, /fetch\("\/api\/auth\/register"/);
    assert.match(register, /X-Partner-Pending/);
    assert.equal(register.includes("maxAge: 0"), false);
    assert.equal(register.includes("visit_id"), false);
  });

  it("sends Google login through the same-origin proxy", () => {
    const client = source("lib/api.ts");
    const proxy = source("app/api/auth/google/route.ts");
    const googleFn = client.slice(client.indexOf("export async function loginWithGoogle"));
    assert.match(googleFn, /fetch\("\/api\/auth\/google"/);
    assert.equal(googleFn.includes("/api/v1/auth/google/"), false);
    assert.match(googleFn, /JSON\.stringify\(\{ credential \}\)/);
    assert.equal(googleFn.includes("visit_id"), false);
    assert.match(proxy, /\/api\/v1\/auth\/google\//);
    assert.match(proxy, /partnerPendingHeaders/);
    assert.match(proxy, /maxAge: 0/);
  });

  it("shows invite copy without a fixed bonus amount", () => {
    const page = source("app/register/page.tsx");
    assert.match(page, /Register through this invitation to join the partner account/);
    assert.match(page, /registration bonus/);
    assert.equal(page.includes("10 USDT"), false);
    assert.match(page, /registerLandingPath/);
    assert.match(page, /googleLandingPath/);
  });

  it("treats an existing attribution and an invalid invite as a finished consume", () => {
    const page = source("app/join/complete/page.tsx");
    assert.match(page, /window\.location\.assign\("\/me\/esims"\)/);
    assert.match(page, /created, noop, and ignored/);
  });

  it("sends only account_exists to login and keeps the invite cookie", () => {
    assert.equal(isAccountExistsCode("account_exists"), true);
    assert.equal(isAccountExistsCode("account_disabled"), false);
    assert.equal(isAccountExistsCode(null), false);
    assert.equal(
      accountExistsLoginPath(),
      `/login?next=${encodeURIComponent(JOIN_COMPLETE_PATH)}&notice=account-exists`,
    );
    assert.equal(accountExistsNotice("account-exists"), ACCOUNT_EXISTS_LOGIN_MESSAGE);
    assert.equal(accountExistsNotice("other"), null);
    assert.equal(accountExistsNotice(null), null);

    const register = source("app/register/page.tsx");
    const branch = register.slice(register.indexOf("isAccountExistsCode"));
    assert.match(branch, /router\.replace\(accountExistsLoginPath\(\)\)/);
    assert.match(branch, /return;/);
    assert.match(branch.slice(branch.indexOf("return;")), /setSubmittedEmail/);
    assert.equal(register.includes("Check your email") && branch.includes("setSubmittedEmail"), true);
    assert.equal(register.includes("maxAge: 0"), false);

    const login = source("app/login/page.tsx");
    assert.match(login, /accountExistsNotice/);
    assert.equal(login.includes("partner_pending"), false);
    assert.equal(login.includes("maxAge"), false);

    const proxy = source("app/api/auth/register/route.ts");
    assert.equal(proxy.includes("maxAge: 0"), false);
  });
});
