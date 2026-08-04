"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ApiError, patchMyEsim } from "@/lib/api";

const NOTE_MAX = 255;
const SAVED_BANNER_MS = 2000;

type EsimNoteFormProps = {
  esimId: number | string;
  savedNote: string;
  onSaved: (note: string) => void;
};

export function EsimNoteForm({
  esimId,
  savedNote,
  onSaved,
}: EsimNoteFormProps) {
  const fieldId = useId();
  const [draft, setDraft] = useState(savedNote);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(savedNote);
  }, [savedNote]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const strippedDraft = draft.trim();
  const strippedSaved = savedNote.trim();
  const dirty = strippedDraft !== strippedSaved;
  const canSave = dirty && !isSaving;

  async function handleSave() {
    if (!canSave) {
      return;
    }

    const previous = savedNote;
    const draftBeforeSave = draft;
    const next = strippedDraft;
    const scrollY =
      typeof window !== "undefined" ? window.scrollY : null;

    setError(null);
    setIsSaving(true);
    // Optimistic: treat draft as saved so Save disables immediately.
    onSaved(next);
    setDraft(next);

    try {
      const updated = await patchMyEsim(esimId, { note: next });
      onSaved(updated.note ?? next);
      setDraft(updated.note ?? next);
      setShowSaved(true);
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      savedTimerRef.current = setTimeout(() => {
        setShowSaved(false);
        savedTimerRef.current = null;
      }, SAVED_BANNER_MS);
    } catch (err) {
      onSaved(previous);
      setDraft(draftBeforeSave);
      setError(
        err instanceof ApiError
          ? "Unable to save note right now."
          : "Something went wrong while saving the note.",
      );
    } finally {
      setIsSaving(false);
      if (scrollY != null && typeof window !== "undefined") {
        window.scrollTo({ top: scrollY });
      }
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
      <p className="mt-1 text-sm text-slate-600">
        Optional personal note for this eSIM. Only you can see it.
      </p>

      {showSaved ? (
        <p
          className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900"
          role="status"
          data-testid="esim-note-saved"
        >
          Note saved
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-amber-800" role="alert">
          {error}
        </p>
      ) : null}

      <label className="mt-4 block" htmlFor={fieldId}>
        <span className="text-sm font-medium text-slate-700">
          Note <span className="font-normal text-slate-500">(optional)</span>
        </span>
        <textarea
          id={fieldId}
          rows={3}
          maxLength={NOTE_MAX}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          disabled={isSaving}
          className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-60"
          placeholder="e.g. Japan trip, work phone…"
          data-testid="esim-note-input"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tabular-nums text-slate-500">
          {draft.length}/{NOTE_MAX}
        </p>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!canSave}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="esim-note-save"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}
