import { expect, test } from "bun:test";
import {
  backspace,
  createState,
  type EditorState,
  getText,
  insertText,
  isDirty,
  markSaved,
  moveLeft,
} from "../src/core/editor-buffer.ts";
import {
  type EditKind,
  emptyHistory,
  GROUP_TIMEOUT_MS,
  HISTORY_LIMIT,
  type History,
  record,
  redo,
  undo,
} from "../src/core/undo-manager.ts";

/** Applies edits through the history, like App does. */
class Session {
  history: History = emptyHistory();
  now = 0;
  constructor(public state: EditorState) {}
  apply(change: (s: EditorState) => EditorState, kind: EditKind, advanceMs = 10) {
    this.now += advanceMs;
    const next = change(this.state);
    this.history = record(this.history, this.state, next, kind, this.now);
    this.state = next;
  }
  type(text: string, advanceMs = 10) {
    for (const ch of text) this.apply((s) => insertText(s, ch), "insert", advanceMs);
  }
  undo() {
    const r = undo(this.history, this.state);
    if (r) ({ history: this.history, state: this.state } = r);
    return r !== null;
  }
  redo() {
    const r = redo(this.history, this.state);
    if (r) ({ history: this.history, state: this.state } = r);
    return r !== null;
  }
}

test("continuous typing undoes as one step", () => {
  const s = new Session(createState());
  s.type("hello");
  s.undo();
  expect(getText(s.state)).toBe("");
});

test("a pause starts a new undo group", () => {
  const s = new Session(createState());
  s.type("ab");
  s.type("cd", GROUP_TIMEOUT_MS + 1);
  s.undo();
  expect(getText(s.state)).toBe("abc");
});

test("moving the cursor starts a new group", () => {
  const s = new Session(createState());
  s.type("ab");
  s.apply(moveLeft, "move");
  s.type("X");
  s.undo();
  expect(getText(s.state)).toBe("ab");
  s.undo();
  expect(getText(s.state)).toBe("");
});

test("typing and deleting are separate groups; 'other' edits stand alone", () => {
  const s = new Session(createState());
  s.type("abc");
  s.apply(backspace, "delete");
  s.apply(backspace, "delete");
  s.apply((x) => insertText(x, "\n"), "other");
  s.undo();
  expect(getText(s.state)).toBe("a");
  s.undo();
  expect(getText(s.state)).toBe("abc");
  s.undo();
  expect(getText(s.state)).toBe("");
});

test("undo restores the cursor and redo reapplies", () => {
  const s = new Session(createState("xy"));
  s.apply((x) => ({ ...x, cursor: { line: 0, col: 1 } }), "move");
  s.apply((x) => insertText(x, "\n"), "other");
  s.undo();
  expect(s.state.cursor).toEqual({ line: 0, col: 1 });
  s.redo();
  expect(s.state.lines).toEqual(["x", "y"]);
  expect(s.state.cursor).toEqual({ line: 1, col: 0 });
});

test("a new edit clears the redo stack", () => {
  const s = new Session(createState());
  s.type("a");
  s.undo();
  s.type("b");
  expect(s.redo()).toBe(false);
});

test("undo/redo with empty history is a no-op", () => {
  const s = new Session(createState("x"));
  expect(s.undo()).toBe(false);
  expect(s.redo()).toBe(false);
});

test("undoing back to the saved text makes the buffer clean", () => {
  const s = new Session(createState("saved"));
  s.type("!");
  expect(isDirty(s.state)).toBe(true);
  s.undo();
  expect(isDirty(s.state)).toBe(false);
});

test("undo does not roll back the saved baseline", () => {
  const s = new Session(createState(""));
  s.type("a");
  s.state = markSaved(s.state, getText(s.state));
  s.undo();
  // Text is back to "" but disk has "a", so this is a real unsaved change.
  expect(isDirty(s.state)).toBe(true);
});

test("history is capped", () => {
  const s = new Session(createState());
  for (let i = 0; i < HISTORY_LIMIT + 50; i++) s.apply((x) => insertText(x, "\n"), "other");
  let steps = 0;
  while (s.undo()) steps++;
  expect(steps).toBe(HISTORY_LIMIT);
});
