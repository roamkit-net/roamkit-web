import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { adminMemberPath, routes } from "@/lib/routes";

describe("ops routes", () => {
  it("exposes admin paths", () => {
    assert.equal(routes.adminDashboard, "/admin/dashboard");
    assert.equal(routes.adminMembers, "/admin/members");
    assert.equal(routes.adminForbidden, "/admin/forbidden");
    assert.equal(adminMemberPath(42), "/admin/members/42");
  });
});

describe("ops health client surface", () => {
  it("exports fetchOpsHealth alongside dashboard", async () => {
    const client = await import("@/lib/ops/client");
    assert.equal(typeof client.fetchOpsDashboard, "function");
    assert.equal(typeof client.fetchOpsHealth, "function");
  });
});
