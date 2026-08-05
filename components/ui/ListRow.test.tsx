import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ListRow, listRowClassName } from "./ListRow";

describe("listRowClassName", () => {
  it("static row matches PackageRow chrome", () => {
    const classes = listRowClassName();
    assert.match(classes, /rounded-xl/);
    assert.match(classes, /border-slate-200/);
    assert.match(classes, /px-4/);
    assert.match(classes, /py-4/);
    assert.match(classes, /shadow-sm/);
    assert.doesNotMatch(classes, /hover:border-sky-300/);
  });

  it("interactive adds hover chrome", () => {
    const classes = listRowClassName({ interactive: true });
    assert.match(classes, /hover:border-sky-300/);
    assert.match(classes, /hover:shadow-md/);
  });
});

describe("ListRow", () => {
  it("renders leading content trailing slots", () => {
    const html = renderToStaticMarkup(
      createElement(
        ListRow,
        {
          leading: createElement("span", null, "L"),
          trailing: createElement("span", null, "T"),
        },
        "Body",
      ),
    );
    assert.match(html, />L</);
    assert.match(html, />Body</);
    assert.match(html, />T</);
  });

  it("stays keyboard-focusable when used as native control chrome (no tabindex=-1)", () => {
    const html = renderToStaticMarkup(
      createElement(ListRow, { interactive: true }, "Row"),
    );
    assert.doesNotMatch(html, /tabindex="-1"/);
  });
});
