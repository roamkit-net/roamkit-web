import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isTeamHost, teamNextPath } from "./host";

describe("partner host", () => {
  it("recognizes the team hosts and not the consumer hosts", () => {
    assert.equal(isTeamHost("team.roamkit.net"), true);
    assert.equal(isTeamHost("team.staging.roamkit.net:443"), true);
    assert.equal(isTeamHost("roamkit.net"), false);
    assert.equal(isTeamHost("www.roamkit.net"), false);
    assert.equal(isTeamHost("staging.roamkit.net"), false);
  });

  it("allows only portal routes as next", () => {
    assert.equal(teamNextPath("/customers"), "/customers");
    assert.equal(teamNextPath("/grants"), "/grants");
    assert.equal(teamNextPath("/"), "/");
    assert.equal(teamNextPath("/me/esims"), "/");
    assert.equal(teamNextPath("https://evil.example"), "/");
    assert.equal(teamNextPath("//evil.example"), "/");
  });
});
