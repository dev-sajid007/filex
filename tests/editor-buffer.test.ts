import { describe, expect, test } from "bun:test";
import {
  backspace,
  createState,
  cursorX,
  deleteForward,
  type EditorState,
  getText,
  gotoLine,
  insertText,
  isDirty,
  markSaved,
  moveEnd,
  moveHome,
  moveLeft,
  moveRight,
  moveVertical,
  select,
  selectAll,
  selectedText,
  selectionRange,
} from "../src/core/editor-buffer.ts";

const at = (state: EditorState, line: number, col: number): EditorState => ({ ...state, cursor: { line, col } });
const apply = (state: EditorState, ...ops: ((s: EditorState) => EditorState)[]) => ops.reduce((s, op) => op(s), state);

describe("load", () => {
  test("empty buffer has one empty line", () => {
    const s = createState();
    expect(s.lines).toEqual([""]);
    expect(s.cursor).toEqual({ line: 0, col: 0 });
  });

  test("splits LF, CRLF and CR", () => {
    expect(createState("a\nb\r\nc\rd").lines).toEqual(["a", "b", "c", "d"]);
  });

  test("keeps a trailing newline as a final empty line", () => {
    expect(createState("a\n").lines).toEqual(["a", ""]);
    expect(getText(createState("a\n"))).toBe("a\n");
  });
});

describe("insert", () => {
  test("inserts at the cursor and advances it", () => {
    const s = insertText(at(createState("ac"), 0, 1), "b");
    expect(s.lines).toEqual(["abc"]);
    expect(s.cursor).toEqual({ line: 0, col: 2 });
  });

  test("newline splits the line", () => {
    const s = insertText(at(createState("abcd"), 0, 2), "\n");
    expect(s.lines).toEqual(["ab", "cd"]);
    expect(s.cursor).toEqual({ line: 1, col: 0 });
  });

  test("multi-line text lands the cursor after the inserted text", () => {
    const s = insertText(at(createState("[]"), 0, 1), "x\ny\nzz");
    expect(s.lines).toEqual(["[x", "y", "zz]"]);
    expect(s.cursor).toEqual({ line: 2, col: 2 });
  });

  test("typing a Bangla vowel sign joins the previous consonant", () => {
    const s = apply(createState(), (x) => insertText(x, "ক"), (x) => insertText(x, "ি"));
    expect(s.lines).toEqual(["কি"]);
    expect(s.cursor.col).toBe(2);
    expect(cursorX(s)).toBe(1);
  });
});

describe("delete", () => {
  test("backspace removes a whole conjunct", () => {
    const s = backspace(at(createState("aক্ষ"), 0, 4));
    expect(s.lines).toEqual(["a"]);
    expect(s.cursor.col).toBe(1);
  });

  test("backspace removes a whole emoji ZWJ sequence", () => {
    const family = "👨‍👩‍👧";
    const s = backspace(at(createState(`x${family}`), 0, 1 + family.length));
    expect(s.lines).toEqual(["x"]);
  });

  test("backspace at line start joins with the previous line", () => {
    const s = backspace(at(createState("ab\ncd"), 1, 0));
    expect(s.lines).toEqual(["abcd"]);
    expect(s.cursor).toEqual({ line: 0, col: 2 });
  });

  test("backspace at buffer start is a no-op", () => {
    const s = createState("ab");
    expect(backspace(s)).toBe(s);
  });

  test("delete removes the grapheme after the cursor", () => {
    const s = deleteForward(at(createState("কিa"), 0, 0));
    expect(s.lines).toEqual(["a"]);
    expect(s.cursor.col).toBe(0);
  });

  test("delete at line end joins with the next line", () => {
    const s = deleteForward(at(createState("ab\ncd"), 0, 2));
    expect(s.lines).toEqual(["abcd"]);
    expect(s.cursor).toEqual({ line: 0, col: 2 });
  });

  test("delete at buffer end is a no-op", () => {
    const s = at(createState("ab"), 0, 2);
    expect(deleteForward(s)).toBe(s);
  });
});

describe("movement", () => {
  test("left/right step over graphemes and wrap across lines", () => {
    const s = createState("ক্ষa\nb");
    const right1 = moveRight(s);
    expect(right1.cursor).toEqual({ line: 0, col: 3 });
    const wrapped = moveRight(moveRight(right1));
    expect(wrapped.cursor).toEqual({ line: 1, col: 0 });
    expect(moveLeft(wrapped).cursor).toEqual({ line: 0, col: 4 });
  });

  test("left at start and right at end stay put", () => {
    expect(moveLeft(createState("a")).cursor).toEqual({ line: 0, col: 0 });
    expect(moveRight(at(createState("a"), 0, 1)).cursor).toEqual({ line: 0, col: 1 });
  });

  test("home/end", () => {
    const s = at(createState("hello"), 0, 2);
    expect(moveHome(s).cursor.col).toBe(0);
    expect(moveEnd(s).cursor.col).toBe(5);
  });

  test("up/down keep the visual column across short lines", () => {
    const s = at(createState("abcdef\nab\nabcdef"), 0, 5);
    const down1 = moveVertical(s, 1);
    expect(down1.cursor).toEqual({ line: 1, col: 2 });
    const down2 = moveVertical(down1, 1);
    expect(down2.cursor).toEqual({ line: 2, col: 5 });
  });

  test("up/down use cell columns, not string offsets", () => {
    // "খুঁজুন" is 6 UTF-16 units but 3 cells; cursor at its end is cell 3.
    const s = at(createState("খুঁজুন\nabcdef"), 0, 6);
    expect(moveVertical(s, 1).cursor).toEqual({ line: 1, col: 3 });
  });

  test("editing resets the goal column", () => {
    const s = moveVertical(at(createState("abcdef\nab\nabcdef"), 0, 5), 1);
    expect(s.goalX).toBe(5);
    expect(insertText(s, "x").goalX).toBeNull();
  });

  test("up on the first line goes to line start, down on the last goes to line end", () => {
    const s = at(createState("abc\ndef"), 0, 2);
    expect(moveVertical(s, -1).cursor).toEqual({ line: 0, col: 0 });
    expect(moveVertical(at(s, 1, 1), 1).cursor).toEqual({ line: 1, col: 3 });
  });

  test("page moves clamp to the buffer", () => {
    const s = createState("1\n2\n3\n4\n5");
    expect(moveVertical(s, 10).cursor.line).toBe(4);
    expect(moveVertical(at(s, 4, 0), -3).cursor.line).toBe(1);
  });
});

describe("dirty state", () => {
  test("clean on load, dirty after edit, clean again when the text matches", () => {
    const s = createState("ab");
    expect(isDirty(s)).toBe(false);
    const edited = insertText(at(s, 0, 2), "c");
    expect(isDirty(edited)).toBe(true);
    expect(isDirty(backspace(edited))).toBe(false);
  });

  test("CRLF text is clean on load", () => {
    expect(isDirty(createState("a\r\nb\r\n"))).toBe(false);
  });

  test("markSaved makes the current text the clean baseline", () => {
    const edited = insertText(createState("a"), "b");
    expect(isDirty(markSaved(edited, getText(edited)))).toBe(false);
  });

  test("movement alone does not dirty the buffer", () => {
    expect(isDirty(moveRight(createState("ab")))).toBe(false);
  });
});

describe("selection", () => {
  test("selectionRange orders anchor and cursor", () => {
    const s = { ...createState("hello"), anchor: { line: 0, col: 4 }, cursor: { line: 0, col: 1 } };
    expect(selectionRange(s)).toEqual({ start: { line: 0, col: 1 }, end: { line: 0, col: 4 } });
    expect(selectedText(s)).toBe("ell");
  });

  test("an empty selection is no selection", () => {
    const s = { ...createState("hi"), anchor: { line: 0, col: 1 }, cursor: { line: 0, col: 1 } };
    expect(selectionRange(s)).toBeNull();
  });

  test("multi-line selected text", () => {
    const s = select(createState("ab\ncd\nef"), { start: { line: 0, col: 1 }, end: { line: 2, col: 1 } });
    expect(selectedText(s)).toBe("b\ncd\ne");
  });

  test("typing replaces the selection", () => {
    const s = select(createState("hello world"), { start: { line: 0, col: 0 }, end: { line: 0, col: 5 } });
    const next = insertText(s, "bye");
    expect(next.lines).toEqual(["bye world"]);
    expect(next.anchor).toBeNull();
  });

  test("backspace and delete remove a multi-line selection", () => {
    const s = select(createState("ab\ncd"), { start: { line: 0, col: 1 }, end: { line: 1, col: 1 } });
    expect(backspace(s).lines).toEqual(["ad"]);
    expect(deleteForward(s).lines).toEqual(["ad"]);
  });

  test("left/right without shift collapse to the selection edge", () => {
    const s = select(createState("hello"), { start: { line: 0, col: 1 }, end: { line: 0, col: 4 } });
    expect(moveLeft(s).cursor.col).toBe(1);
    expect(moveRight(s).cursor.col).toBe(4);
    expect(moveLeft(s).anchor).toBeNull();
  });

  test("shift-moves keep the original anchor", () => {
    let s = at(createState("abc\ndef"), 0, 1);
    s = moveRight(s, true);
    s = moveVertical(s, 1, true);
    expect(s.anchor).toEqual({ line: 0, col: 1 });
    expect(selectedText(s)).toBe("bc\nde");
  });

  test("selectAll covers the whole buffer", () => {
    expect(selectedText(selectAll(createState("a\nb\nc")))).toBe("a\nb\nc");
  });
});

describe("gotoLine", () => {
  test("moves to the start of the line, clamped, and clears selection", () => {
    const s = selectAll(createState("a\nb\nc"));
    expect(gotoLine(s, 1).cursor).toEqual({ line: 1, col: 0 });
    expect(gotoLine(s, 99).cursor.line).toBe(2);
    expect(gotoLine(s, -5).cursor.line).toBe(0);
    expect(gotoLine(s, 1).anchor).toBeNull();
  });
});
