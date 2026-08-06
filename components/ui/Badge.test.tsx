import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Badge, badgeClassName } from "./Badge";

describe("Badge", () => {
  it("default matches eSIM status pill chrome", () => {
    const classes = badgeClassName({ variant: "default" });
    assert.match(classes, /rounded-full/);
    assert.match(classes, /bg-slate-100/);
    assert.match(classes, /text-slate-700/);
    assert.match(classes, /text-xs/);
  });

  it("warning uses amber chrome for network callouts", () => {
    assert.match(badgeClassName({ variant: "warning" }), /border-amber-200/);
    assert.match(badgeClassName({ variant: "warning" }), /bg-amber-50/);
  });

  it("renders children only (no domain status props)", () => {
    const html = renderToStaticMarkup(
      createElement(Badge, { variant: "primary" }, "Ready"),
    );
    assert.match(html, /Ready/);
    assert.match(html, /bg-sky-100/);
  });
});
