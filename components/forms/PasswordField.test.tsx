import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createElement } from "react";
import { JSDOM } from "jsdom";
import { cleanup, fireEvent, render, within } from "@testing-library/react";

import { PasswordField } from "./PasswordField";

function setGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const { window } = dom;

  setGlobal("window", window);
  setGlobal("document", window.document);
  setGlobal("HTMLElement", window.HTMLElement);
  setGlobal("Node", window.Node);
  setGlobal("navigator", window.navigator);
  setGlobal("DocumentFragment", window.DocumentFragment);
  setGlobal("MutationObserver", window.MutationObserver);
  setGlobal("getComputedStyle", window.getComputedStyle.bind(window));
  setGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0),
  );
  setGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
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
