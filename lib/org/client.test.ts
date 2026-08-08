import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { ApiError, setTokens } from "@/lib/api";
import {
  acceptOrganizationInvite,
  createOrganization,
  createOrganizationInvite,
  listOrganizations,
  revokeOrganizationMember,
  updateOrganizationMemberRole,
} from "@/lib/org/client";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  setTokens("test-access", "test-refresh");
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("org API client", () => {
  it("listOrganizations calls GET /api/v1/orgs/ with auth", async () => {
    let calledPath = "";
    let auth = "";
    globalThis.fetch = async (input, init) => {
      calledPath = String(input);
      auth = new Headers(init?.headers).get("Authorization") ?? "";
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const result = await listOrganizations();
    assert.deepEqual(result, []);
    assert.match(calledPath, /\/api\/v1\/orgs\/$/);
    assert.equal(auth, "Bearer test-access");
  });

  it("createOrganization POSTs trimmed name payload", async () => {
    let method = "";
    let body = "";
    globalThis.fetch = async (input, init) => {
      method = String(init?.method ?? "GET");
      body = String(init?.body ?? "");
      assert.match(String(input), /\/api\/v1\/orgs\/$/);
      return new Response(
        JSON.stringify({
          id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          name: "Fleet",
          status: "active",
          account_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          my_role: "owner",
          permissions: {
            can_view: true,
            can_spend: true,
            can_manage_members: true,
            can_invite: true,
            can_transfer_ownership: true,
            can_archive_org: true,
            can_assign_esim: true,
            can_device_bind: true,
          },
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    };

    const org = await createOrganization("Fleet");
    assert.equal(method, "POST");
    assert.equal(body, JSON.stringify({ name: "Fleet" }));
    assert.equal(org.my_role, "owner");
  });

  it("createOrganizationInvite returns one-shot token from response body", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          created: true,
          token: "plaintext-token-once",
          invite: {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            organization_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            email: "a@example.com",
            email_normalized: "a@example.com",
            role: "member",
            status: "pending",
            expires_at: "2026-01-08T00:00:00Z",
            invited_by_email: "owner@example.com",
            accepted_at: null,
            revoked_at: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );

    const result = await createOrganizationInvite(
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      { email: "a@example.com", role: "member" },
    );
    assert.equal(result.token, "plaintext-token-once");
    assert.equal(result.created, true);
  });

  it("updateOrganizationMemberRole PATCHes role", async () => {
    let method = "";
    let body = "";
    globalThis.fetch = async (input, init) => {
      method = String(init?.method ?? "GET");
      body = String(init?.body ?? "");
      assert.match(String(input), /\/members\/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb\/$/);
      return new Response(
        JSON.stringify({
          id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          user_id: 2,
          user_email: "m@example.com",
          role: "admin",
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };

    const row = await updateOrganizationMemberRole(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "admin",
    );
    assert.equal(method, "PATCH");
    assert.equal(body, JSON.stringify({ role: "admin" }));
    assert.equal(row.role, "admin");
  });

  it("revokeOrganizationMember POSTs revoke", async () => {
    let method = "";
    globalThis.fetch = async (input, init) => {
      method = String(init?.method ?? "GET");
      assert.match(String(input), /\/revoke\/$/);
      return new Response(
        JSON.stringify({
          id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          user_id: 2,
          user_email: "m@example.com",
          role: "member",
          status: "revoked",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };

    const row = await revokeOrganizationMember(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    );
    assert.equal(method, "POST");
    assert.equal(row.status, "revoked");
  });

  it("acceptOrganizationInvite posts token to accept endpoint", async () => {
    let body = "";
    let path = "";
    globalThis.fetch = async (input, init) => {
      path = String(input);
      body = String(init?.body ?? "");
      return new Response(
        JSON.stringify({
          organization_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          already_accepted: false,
          membership: {
            id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            user_id: 1,
            user_email: "invitee@example.com",
            role: "member",
            status: "active",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };

    const result = await acceptOrganizationInvite("token-xyz");
    assert.match(path, /\/api\/v1\/orgs\/invites\/accept\/$/);
    assert.match(body, /token-xyz/);
    assert.equal(result.already_accepted, false);
  });

  it("surfaces API detail on failure", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ detail: "Invite has been revoked." }), {
        status: 400,
        statusText: "Bad Request",
        headers: { "Content-Type": "application/json" },
      });

    await assert.rejects(
      () => acceptOrganizationInvite("dead"),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.message, "Invite has been revoked.");
        return true;
      },
    );
  });
});
