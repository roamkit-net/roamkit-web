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
