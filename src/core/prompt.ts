import type { KeyEvent } from "@opentui/core";
import { createState, type EditorState, getText, insertText, moveEnd, type Position } from "./editor-buffer.ts";
import { applyEditorKey } from "./editor-input.ts";

/** What to do after a prompt flow (e.g. save) completes successfully. */
export type Continuation = "quit" | "open" | null;

export type InputPurpose = "open" | "saveAs" | "find" | "replaceFind" | "replaceWith" | "gotoLine";

export type Prompt =
  | {
      kind: "input";
      purpose: InputPurpose;
      field: EditorState;
      then: Continuation;
      /** find: cursor when the search started, restored when nothing matches. */
      origin?: Position;
      /** replaceWith: the text being replaced. */
      query?: string;
    }
  | { kind: "confirm"; purpose: "unsaved"; then: "quit" | "open" }
  | { kind: "confirm"; purpose: "conflict" | "exists"; path: string; then: Continuation }
  | { kind: "confirm"; purpose: "replace"; query: string; replacement: string; replaced: number };

export type PromptAction =
  | { type: "update"; prompt: Prompt }
  | { type: "submit"; value: string }
  | { type: "next" }
  | { type: "prev" }
  | { type: "yes" }
  | { type: "no" }
  | { type: "all" }
  | { type: "cancel" };

type KeyInfo = Pick<KeyEvent, "name" | "sequence" | "ctrl" | "meta" | "shift">;

// Keys that make no sense in a single-line field.
const IGNORED_IN_FIELD = new Set(["tab", "up", "down", "pageup", "pagedown"]);

export function inputPrompt(
  purpose: InputPurpose,
  initial = "",
  extra: { then?: Continuation; origin?: Position; query?: string } = {},
): Prompt {
  // Pre-filled text starts selected so typing replaces it.
  const field = moveEnd(createState(initial));
  return {
    kind: "input",
    purpose,
    field: initial ? { ...field, anchor: { line: 0, col: 0 } } : field,
    then: extra.then ?? null,
    origin: extra.origin,
    query: extra.query,
  };
}

/** Interprets a key while a prompt is open. Returns null for keys the prompt ignores. */
export function handlePromptKey(prompt: Prompt, key: KeyInfo): PromptAction | null {
  if (key.name === "escape") return { type: "cancel" };

  if (prompt.kind === "confirm") {
    if (key.ctrl || key.meta) return null;
    if (key.name === "y") return { type: "yes" };
    if (key.name === "n") return { type: "no" };
    if (key.name === "a" && prompt.purpose === "replace") return { type: "all" };
    return null;
  }

  if (prompt.purpose === "find") {
    // Enter/Down step forward and Up steps back; the prompt stays open until Esc.
    if (key.name === "return" || key.name === "enter" || key.name === "down") return { type: "next" };
    if (key.name === "up") return { type: "prev" };
  }

  if (key.name === "return" || key.name === "enter") return { type: "submit", value: getText(prompt.field) };
  if (IGNORED_IN_FIELD.has(key.name)) return null;
  const result = applyEditorKey(prompt.field, key, 1);
  return result ? { type: "update", prompt: { ...prompt, field: result.state } } : null;
}

export function pasteIntoPrompt(prompt: Prompt, text: string): Prompt {
  if (prompt.kind !== "input") return prompt;
  return { ...prompt, field: insertText(prompt.field, text.replace(/\n/g, "")) };
}

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Parses a 1-based line number written with ASCII or Bangla digits. */
export function parseLineNumber(input: string): number | null {
  const ascii = input.trim().replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));
  if (!/^\d+$/.test(ascii)) return null;
  const n = Number.parseInt(ascii, 10);
  return n >= 1 ? n : null;
}
