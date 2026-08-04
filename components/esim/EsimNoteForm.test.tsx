import "./jsdomSetup";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createElement, useState, type ReactElement } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";

import { setTokens } from "@/lib/api";

import { EsimNoteForm } from "./EsimNoteForm";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  setTokens("test-access", "test-refresh");
});

function NoteHarness({
  esimId = 1,
  initialNote = "original",
}: {
  esimId?: number | string;
  initialNote?: string;
}): ReactElement {
  const [savedNote, setSavedNote] = useState(initialNote);
  return createElement(EsimNoteForm, {
    esimId,
    savedNote,
    onSaved: (_id, note) => setSavedNote(note),
  });
}

describe("EsimNoteForm", () => {
  it("keeps draft edits and re-enables Save when patch fails after optimistic update", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ detail: "boom" }), {
        status: 500,
        statusText: "Server Error",
        headers: { "Content-Type": "application/json" },
      });

    const { container } = render(createElement(NoteHarness));
    const view = within(container);
    const input = view.getByTestId("esim-note-input") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "trip notes" } });
    const save = view.getByTestId("esim-note-save") as HTMLButtonElement;
    assert.equal(input.value, "trip notes");
    assert.equal(save.disabled, false);

    fireEvent.click(save);

    await waitFor(() => {
      assert.match(view.getByRole("alert").textContent ?? "", /Unable to save/);
    });

    assert.equal(
      (view.getByTestId("esim-note-input") as HTMLTextAreaElement).value,
      "trip notes",
    );
    assert.equal(
      (view.getByTestId("esim-note-save") as HTMLButtonElement).disabled,
      false,
    );
    assert.equal(
      (view.getByTestId("esim-note-save") as HTMLButtonElement).textContent,
      "Save",
    );
  });

  it("does not apply a completed save to a different eSIM after navigation", async () => {
    let resolvePatch: ((value: Response) => void) | null = null;
    const patchStarted = new Promise<void>((resolveStarted) => {
      globalThis.fetch = async () => {
        resolveStarted();
        return new Promise<Response>((resolve) => {
          resolvePatch = resolve;
        });
      };
    });

    type ParentState = { id: number; note: string };
    let latest: ParentState = { id: 1, note: "note-a" };
    let setParent: (next: ParentState) => void = () => undefined;

    function Parent(): ReactElement {
      const [esim, setEsim] = useState<ParentState>({ id: 1, note: "note-a" });
      latest = esim;
      setParent = setEsim;
      return createElement(EsimNoteForm, {
        key: esim.id,
        esimId: esim.id,
        savedNote: esim.note,
        onSaved: (id, note) =>
          setEsim((current) =>
            String(current.id) === String(id) ? { ...current, note } : current,
          ),
      });
    }

    const { container } = render(createElement(Parent));
    const view = within(container);
    const input = view.getByTestId("esim-note-input") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "saved-for-a" } });
    fireEvent.click(view.getByTestId("esim-note-save"));

    await patchStarted;
    assert.ok(resolvePatch);

    await act(async () => {
      setParent({ id: 2, note: "note-b" });
    });

    const viewB = within(container);
    assert.equal(
      (viewB.getByTestId("esim-note-input") as HTMLTextAreaElement).value,
      "note-b",
    );
    assert.equal(latest.note, "note-b");

    await act(async () => {
      resolvePatch!(
        new Response(JSON.stringify({ id: 1, note: "saved-for-a" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      await Promise.resolve();
    });

    assert.equal(latest.id, 2);
    assert.equal(latest.note, "note-b");
    assert.equal(
      (viewB.getByTestId("esim-note-input") as HTMLTextAreaElement).value,
      "note-b",
    );
  });
});
