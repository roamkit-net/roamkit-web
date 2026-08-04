import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppPageHeader } from "./AppPageHeader";

/** Visual scenarios for the shared page header (Storybook substitute). */
describe("AppPageHeader scenarios", () => {
  it("title only", () => {
    const html = renderToStaticMarkup(
      createElement(AppPageHeader, {
        title: createElement("h1", null, "My eSIMs"),
      }),
    );

    assert.match(html, /data-testid="app-page-header"/);
    assert.match(html, /flex flex-col gap-3/);
    assert.match(html, /mb-8/);
    assert.match(html, /My eSIMs/);
    assert.doesNotMatch(html, /account-cluster/);
  });

  it("title + description", () => {
    const html = renderToStaticMarkup(
      createElement(AppPageHeader, {
        title: createElement("h1", null, "Deposit"),
        description: createElement("p", null, "Add prepaid credits."),
      }),
    );

    assert.match(html, /Deposit/);
    assert.match(html, /Add prepaid credits/);
  });

  it("title + actions", () => {
    const html = renderToStaticMarkup(
      createElement(AppPageHeader, {
        title: createElement("h1", null, "My eSIMs"),
        actions: createElement("button", { type: "button" }, "Deposit credits"),
      }),
    );

    assert.match(html, /Deposit credits/);
  });

  it("eyebrow + title + description + actions + children", () => {
    const html = renderToStaticMarkup(
      createElement(
        AppPageHeader,
        {
          eyebrow: createElement("p", null, "RoamKit"),
          title: createElement("h1", null, "My eSIMs"),
          description: createElement("p", null, "Manage your plans."),
          actions: createElement("div", null, "Actions"),
        },
        createElement("div", { "data-testid": "banner" }, "Banner"),
      ),
    );

    assert.match(html, /RoamKit/);
    assert.match(html, /My eSIMs/);
    assert.match(html, /Manage your plans/);
    assert.match(html, /Actions/);
    assert.match(html, /data-testid="banner"/);
  });

  it("empty slots still produce header chrome (spacing only)", () => {
    const html = renderToStaticMarkup(createElement(AppPageHeader, {}));
    assert.match(html, /data-testid="app-page-header"/);
    assert.match(html, /flex flex-col gap-3 mb-8/);
  });

  it("does not own AuthNav / account-cluster", () => {
    const html = renderToStaticMarkup(
      createElement(AppPageHeader, {
        title: createElement("h1", null, "Plans"),
      }),
    );
    assert.doesNotMatch(html, /account-cluster/);
    assert.doesNotMatch(html, /AuthNav/);
  });
});
