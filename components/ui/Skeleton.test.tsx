import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Skeleton, skeletonClassName } from "./Skeleton";

describe("Skeleton", () => {
  it("uses one pulse animation and reduced-motion escape", () => {
    const classes = skeletonClassName();
    assert.match(classes, /animate-pulse/);
    assert.match(classes, /motion-reduce:animate-none/);
    assert.match(classes, /bg-slate-200\/80/);
    assert.match(classes, /rounded-lg/);
  });

  it("circle and line variants change radius only", () => {
    assert.match(skeletonClassName({ variant: "circle" }), /rounded-full/);
    assert.match(skeletonClassName({ variant: "line" }), /rounded-md/);
  });

  it("is decorative (aria-hidden) and accepts size className for CLS", () => {
    const html = renderToStaticMarkup(
      createElement(Skeleton, { className: "h-5 w-40" }),
    );
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /h-5/);
    assert.match(html, /w-40/);
  });
});
