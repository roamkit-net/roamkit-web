import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Logo } from "./Logo";

function visibleText(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

describe("Logo", () => {
  it("renders visible brand text RoamKit.net", () => {
    const html = renderToStaticMarkup(createElement(Logo));
    assert.match(visibleText(html), /RoamKit\.net/);
  });

  it("sets image alt to RoamKit.net", () => {
    const html = renderToStaticMarkup(createElement(Logo));
    assert.match(html, /alt="RoamKit\.net"/);
  });

  it("is the same Logo on landing header and auth shell", () => {
    const header = readFileSync(
      join(process.cwd(), "components/landing/Header.tsx"),
      "utf8",
    );
    const auth = readFileSync(
      join(process.cwd(), "components/AuthForm.tsx"),
      "utf8",
    );

    assert.match(header, /import \{ Logo \} from "@\/components\/landing\/Logo"/);
    assert.match(header, /<Logo \/>/);
    assert.match(auth, /import \{ Logo \} from "@\/components\/landing\/Logo"/);
    assert.match(auth, /<Logo \/>/);
  });
});
