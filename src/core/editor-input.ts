import type { KeyEvent } from "@opentui/core";
import {
  backspace,
  deleteForward,
  type EditorState,
  insertText,
  moveEnd,
  moveHome,
  moveLeft,
  moveRight,
  moveVertical,
} from "./editor-buffer.ts";
import type { EditKind } from "./undo-manager.ts";

export const TAB_SIZE = 2;

type KeyInfo = Pick<KeyEvent, "name" | "sequence" | "ctrl" | "meta" | "shift">;

export interface EditorKeyResult {
  state: EditorState;
  kind: EditKind;
}

// Printable text only: no C0 controls, DEL or escape sequences.
const PRINTABLE = /^[^\u0000-\u001f\u007f]+$/u;

/** Applies an editing or navigation key. Returns null when the key is not an editor key. */
export function applyEditorKey(state: EditorState, key: KeyInfo, pageSize: number): EditorKeyResult | null {
  if (key.ctrl || key.meta) return null;
  const extend = key.shift;
  const move = (next: EditorState): EditorKeyResult => ({ state: next, kind: "move" });

  switch (key.name) {
    case "return":
    case "enter":
      return { state: insertText(state, "\n"), kind: "other" };
    case "tab":
      return { state: insertText(state, " ".repeat(TAB_SIZE)), kind: "other" };
    case "backspace":
      return { state: backspace(state), kind: "delete" };
    case "delete":
      return { state: deleteForward(state), kind: "delete" };
    case "left":
      return move(moveLeft(state, extend));
    case "right":
      return move(moveRight(state, extend));
    case "up":
      return move(moveVertical(state, -1, extend));
    case "down":
      return move(moveVertical(state, 1, extend));
    case "home":
      return move(moveHome(state, extend));
    case "end":
      return move(moveEnd(state, extend));
    case "pageup":
      return move(moveVertical(state, -pageSize, extend));
    case "pagedown":
      return move(moveVertical(state, pageSize, extend));
  }

  if (key.sequence && PRINTABLE.test(key.sequence)) return { state: insertText(state, key.sequence), kind: "insert" };
  return null;
}

const decoder = new TextDecoder();

/**
 * Converts pasted bytes to insertable text: drops control characters (which could carry
 * terminal escape sequences) and expands tabs until tab rendering exists.
 */
export function pastedText(bytes: Uint8Array): string {
  return decoder
    .decode(bytes)
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, " ".repeat(TAB_SIZE))
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/gu, "");
}
