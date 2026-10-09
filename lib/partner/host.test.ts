import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isTeamHost, isTeamPublicAsset, teamContentSecurityPolicy, teamNextPath } from "./host";

describe("partner host", () => {
  it("recognizes the team hosts and not the consumer hosts", () => {
    assert.equal(isTeamHost("team.roamkit.net"), true);
    assert.equal(isTeamHost("team.staging.roamkit.net:443"), true);
    assert.equal(isTeamHost("roamkit.net"), false);
    assert.equal(isTeamHost("www.roamkit.net"), false);
    assert.equal(isTeamHost("staging.roamkit.net"), false);
  });

  it("allows Next inline scripts through a per-request nonce", () => {
    const policy = teamContentSecurityPolicy("abc123");
    assert.match(policy, /script-src 'self' 'nonce-abc123' 'strict-dynamic'/);
    assert.doesNotMatch(policy, /script-src[^;]*unsafe-inline/);
  });

  it("serves the logo and other public files on the team host", () => {
    assert.equal(isTeamPublicAsset("/landing/logo-r.png"), true);
    assert.equal(isTeamPublicAsset("/icons/favicon-32x32.png"), true);
    assert.equal(isTeamPublicAsset("/"), false);
    assert.equal(isTeamPublicAsset("/login"), false);
    assert.equal(isTeamPublicAsset("/customers"), false);
    assert.equal(isTeamPublicAsset("/../logo-r.png"), false);
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
