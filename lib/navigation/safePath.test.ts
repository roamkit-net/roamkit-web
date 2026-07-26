import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isSafeReturnPath, loginHref, safeNextPath } from "./safePath";

describe("isSafeReturnPath", () => {
  it("allows same-origin relative paths", () => {
    assert.equal(isSafeReturnPath("/me"), true);
    assert.equal(isSafeReturnPath("/croatia-esim"), true);
    assert.equal(isSafeReturnPath("/me/esims/12"), true);
    assert.equal(isSafeReturnPath("/me/esims/123"), true);
    assert.equal(isSafeReturnPath("/plans?tab=local"), true);
    assert.equal(isSafeReturnPath("/me/esims?id=1"), true);
    assert.equal(isSafeReturnPath("/me/esims#install"), true);
  });

  it("rejects open redirects and unsafe variants", () => {
    assert.equal(isSafeReturnPath("//"), false);
    assert.equal(isSafeReturnPath("//evil.example"), false);
    assert.equal(isSafeReturnPath("https://evil.example"), false);
    assert.equal(isSafeReturnPath("http://evil.example"), false);
    assert.equal(isSafeReturnPath("javascript:alert(1)"), false);
    assert.equal(isSafeReturnPath("/\\evil"), false);
    assert.equal(isSafeReturnPath("/%2F%2Fevil.com"), false);
    assert.equal(isSafeReturnPath("croatia-esim"), false);
    assert.equal(isSafeReturnPath("/ok://no"), false);
  });
});

describe("safeNextPath", () => {
  it("returns safe paths and falls back otherwise", () => {
    assert.equal(safeNextPath("/me/esims/123"), "/me/esims/123");
    assert.equal(safeNextPath("https://evil.example"), "/me/esims");
    assert.equal(safeNextPath(null), "/me/esims");
    assert.equal(safeNextPath(undefined, "/plans"), "/plans");
  });
});

describe("loginHref", () => {
  it("builds login URLs with encoded next when safe", () => {
    assert.equal(loginHref("/me/esims/123"), "/login?next=%2Fme%2Fesims%2F123");
    assert.equal(loginHref("https://evil.example"), "/login");
    assert.equal(loginHref(null), "/login");
  });
});
