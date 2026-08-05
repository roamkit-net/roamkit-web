import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Card,
  CardFooter,
  CardHeader,
  CardSection,
  cardClassName,
  cardSectionClassName,
} from "./Card";

describe("cardClassName", () => {
  it("matches Cap2b app panel chrome without padding", () => {
    const classes = cardClassName();
    assert.match(classes, /rounded-2xl/);
    assert.match(classes, /border-slate-200/);
    assert.match(classes, /bg-white/);
    assert.match(classes, /shadow-sm/);
    assert.doesNotMatch(classes, /\bp-6\b/);
  });
});

describe("cardSectionClassName", () => {
  it("defaults to p-6 rhythm", () => {
    assert.match(cardSectionClassName(), /\bp-6\b/);
  });

  it("divider adds top border only", () => {
    const classes = cardSectionClassName({ divider: true });
    assert.match(classes, /border-t/);
    assert.match(classes, /border-slate-200/);
  });

  it("padding lg matches empty-state p-8", () => {
    assert.match(cardSectionClassName({ padding: "lg" }), /\bp-8\b/);
    assert.doesNotMatch(cardSectionClassName({ padding: "lg" }), /\bp-6\b/);
  });
});

describe("Card composition", () => {
  it("renders header, section divider, and footer slots", () => {
    const html = renderToStaticMarkup(
      createElement(
        Card,
        { as: "section" },
        createElement(CardHeader, null, "Header"),
        createElement(CardSection, null, "Body"),
        createElement(CardSection, { divider: true }, "More"),
        createElement(CardFooter, null, "Footer"),
      ),
    );
    assert.match(html, /<section/);
    assert.match(html, /Header/);
    assert.match(html, /Body/);
    assert.match(html, /More/);
    assert.match(html, /Footer/);
    assert.match(html, /border-t/);
  });

  it("supports nested sections without inventing domain props", () => {
    const html = renderToStaticMarkup(
      createElement(
        Card,
        null,
        createElement(
          CardSection,
          null,
          createElement(
            CardSection,
            {
              padding: "none",
              className:
                "rounded-xl border border-slate-100 bg-slate-50/80 p-4",
            },
            "Inset",
          ),
        ),
      ),
    );
    assert.match(html, /Inset/);
  });
});
