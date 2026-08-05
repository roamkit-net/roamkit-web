import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Empty } from "./Empty";

describe("Empty", () => {
  it("renders title, description, and action without domain types", () => {
    const html = renderToStaticMarkup(
      createElement(Empty, {
        title: "No items",
        description: "Try again later.",
        action: createElement("button", { type: "button" }, "Retry"),
      }),
    );
    assert.match(html, /No items/);
    assert.match(html, /Try again later/);
    assert.match(html, /Retry/);
    assert.match(html, /text-center/);
    assert.doesNotMatch(html, /type="wallet"/);
  });

  it("compact drops text-lg; start alignment left-aligns", () => {
    const compact = renderToStaticMarkup(
      createElement(Empty, { title: "T", compact: true }),
    );
    assert.doesNotMatch(compact, /text-lg/);

    const start = renderToStaticMarkup(
      createElement(Empty, { title: "T", alignment: "start" }),
    );
    assert.match(start, /text-left/);
  });
});
