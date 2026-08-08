import { JSDOM } from "jsdom";

function setGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
const { window } = dom;

setGlobal("window", window);
setGlobal("self", window);
setGlobal("document", window.document);
setGlobal("HTMLElement", window.HTMLElement);
setGlobal("HTMLTextAreaElement", window.HTMLTextAreaElement);
setGlobal("HTMLInputElement", window.HTMLInputElement);
setGlobal("HTMLButtonElement", window.HTMLButtonElement);
setGlobal("Node", window.Node);
setGlobal("navigator", window.navigator);
setGlobal("DocumentFragment", window.DocumentFragment);
setGlobal("MutationObserver", window.MutationObserver);
setGlobal("Event", window.Event);
setGlobal("InputEvent", window.InputEvent);
setGlobal("KeyboardEvent", window.KeyboardEvent);
setGlobal("getComputedStyle", window.getComputedStyle.bind(window));
setGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
  setTimeout(() => cb(Date.now()), 0),
);
setGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
setGlobal("scrollTo", () => undefined);
window.scrollTo = () => undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
