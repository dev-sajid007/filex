import { expect, test } from "bun:test";
import { createState, selectedText } from "../src/core/editor-buffer.ts";
import { applyEditorKey, pastedText, TAB_SIZE } from "../src/core/editor-input.ts";

const key = (name: string, sequence = "", mods: { ctrl?: boolean; meta?: boolean; shift?: boolean } = {}) => ({
  name,
  sequence,
  ctrl: mods.ctrl ?? false,
  meta: mods.meta ?? false,
  shift: mods.shift ?? false,
});

const linesAfter = (state: ReturnType<typeof createState>, k: ReturnType<typeof key>) =>
  applyEditorKey(state, k, 10)?.state.lines;

test("printable sequences are inserted, including Bangla and multi-character chunks", () => {
  const s = createState();
  expect(linesAfter(s, key("a", "a"))).toEqual(["a"]);
  expect(linesAfter(s, key("a", "A", { shift: true }))).toEqual(["A"]);
  expect(linesAfter(s, key("space", " "))).toEqual([" "]);
  expect(linesAfter(s, key("ক", "ক"))).toEqual(["ক"]);
  expect(linesAfter(s, key("", "কি"))).toEqual(["কি"]);
});

test("return, tab, backspace and delete edit the buffer", () => {
  const s = createState("ab");
  expect(linesAfter({ ...s, cursor: { line: 0, col: 1 } }, key("return", "\r"))).toEqual(["a", "b"]);
  expect(linesAfter(s, key("tab", "\t"))).toEqual([" ".repeat(TAB_SIZE) + "ab"]);
  expect(linesAfter({ ...s, cursor: { line: 0, col: 2 } }, key("backspace", "\x7f"))).toEqual(["a"]);
  expect(linesAfter(s, key("delete", "\x1b[3~"))).toEqual(["b"]);
});

test("edits report their kind for undo grouping", () => {
  const s = createState("ab");
  expect(applyEditorKey(s, key("x", "x"), 10)?.kind).toBe("insert");
  expect(applyEditorKey(s, key("delete", "\x1b[3~"), 10)?.kind).toBe("delete");
  expect(applyEditorKey(s, key("return", "\r"), 10)?.kind).toBe("other");
  expect(applyEditorKey(s, key("right"), 10)?.kind).toBe("move");
});

test("shift + navigation extends the selection", () => {
  let s = createState("hello");
  s = applyEditorKey(s, key("right", "", { shift: true }), 10)!.state;
  s = applyEditorKey(s, key("right", "", { shift: true }), 10)!.state;
  expect(selectedText(s)).toBe("he");
  s = applyEditorKey(s, key("end", "", { shift: true }), 10)!.state;
  expect(selectedText(s)).toBe("hello");
  s = applyEditorKey(s, key("left"), 10)!.state;
  expect(selectedText(s)).toBeNull();
  expect(s.cursor.col).toBe(0);
});

test("page keys move by the given page size", () => {
  const s = createState(Array.from({ length: 20 }, (_, i) => String(i)).join("\n"));
  expect(applyEditorKey(s, key("pagedown"), 7)?.state.cursor.line).toBe(7);
});

test("control sequences and Ctrl/Meta combos are not inserted", () => {
  const s = createState();
  expect(applyEditorKey(s, key("s", "\x13", { ctrl: true }), 10)).toBeNull();
  expect(applyEditorKey(s, key("x", "x", { meta: true }), 10)).toBeNull();
  expect(applyEditorKey(s, key("f1", "\x1bOP"), 10)).toBeNull();
  expect(applyEditorKey(s, key("escape", "\x1b"), 10)).toBeNull();
});

test("pastedText decodes UTF-8, normalizes newlines and strips control characters", () => {
  const bytes = new TextEncoder().encode("হ্যালো\r\nবিশ্ব\t!\x1b[31m\x07");
  expect(pastedText(bytes)).toBe(`হ্যালো\nবিশ্ব${" ".repeat(TAB_SIZE)}![31m`);
});
