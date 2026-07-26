import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createElement } from "react";
import { JSDOM } from "jsdom";
import { cleanup, fireEvent, render, within } from "@testing-library/react";

import { PasswordField } from "./PasswordField";

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const { window } = dom;

  // Assign onto global for Testing Library + React DOM.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  g.window = window;
  g.document = window.document;
  g.HTMLElement = window.HTMLElement;
  g.Node = window.Node;
  g.navigator = window.navigator;
  g.DocumentFragment = window.DocumentFragment;
  g.MutationObserver = window.MutationObserver;
  g.getComputedStyle = window.getComputedStyle.bind(window);
  g.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0);
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  g.IS_REACT_ACT_ENVIRONMENT = true;
}

installDom();

afterEach(() => {
  cleanup();
});

describe("PasswordField", () => {
  it("starts as password and toggles visibility + aria-pressed", () => {
    const { container } = render(
      createElement(PasswordField, {
        label: "Password",
        name: "password",
        autoComplete: "current-password",
      }),
    );

    const view = within(container);
    const input = view.getByLabelText("Password") as HTMLInputElement;
    const toggle = view.getByRole("button", { name: "Show password" });

    assert.equal(input.type, "password");
    assert.equal(toggle.getAttribute("aria-pressed"), "false");

    fireEvent.click(toggle);
    assert.equal(input.type, "text");
    assert.equal(toggle.getAttribute("aria-pressed"), "true");
    assert.equal(toggle.getAttribute("aria-label"), "Hide password");

    fireEvent.click(toggle);
    assert.equal(input.type, "password");
    assert.equal(toggle.getAttribute("aria-pressed"), "false");
    assert.equal(toggle.getAttribute("aria-label"), "Show password");
  });
});
