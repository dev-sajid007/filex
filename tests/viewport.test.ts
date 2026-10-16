import { expect, test } from "bun:test";
import { followCursor, layoutRow, type Segment } from "../src/core/viewport.ts";

test("followCursor leaves scroll alone while the cursor is visible", () => {
  expect(followCursor({ top: 0, left: 0 }, 3, 5, 1, 10, 20)).toEqual({ top: 0, left: 0 });
});

test("followCursor scrolls down/up by the minimum amount", () => {
  expect(followCursor({ top: 0, left: 0 }, 12, 0, 1, 10, 20).top).toBe(3);
  expect(followCursor({ top: 5, left: 0 }, 2, 0, 1, 10, 20).top).toBe(2);
});

test("followCursor scrolls horizontally, accounting for wide cursor cells", () => {
  expect(followCursor({ top: 0, left: 0 }, 0, 25, 1, 10, 20).left).toBe(6);
  expect(followCursor({ top: 0, left: 0 }, 0, 19, 2, 10, 20).left).toBe(1);
  expect(followCursor({ top: 0, left: 10 }, 0, 3, 1, 10, 20).left).toBe(3);
});

const text = (t: string): Segment => ({ text: t, kind: "text" });
const cursor = (t: string): Segment => ({ text: t, kind: "cursor" });
const plain = (segments: Segment[]) => segments.map((s) => s.text).join("");

test("layoutRow splits around the cursor", () => {
  expect(layoutRow("abc", 0, 10, 1)).toEqual([text("a"), cursor("b"), text("c")]);
  expect(layoutRow("abc", 0, 10, null)).toEqual([text("abc")]);
});

test("layoutRow shows a space cursor at end of line", () => {
  expect(layoutRow("ab", 0, 10, 2)).toEqual([text("ab"), cursor(" ")]);
});

test("layoutRow keeps Bangla graphemes whole under the cursor", () => {
  expect(layoutRow("কিক্ষ", 0, 10, 2)).toEqual([text("কি"), cursor("ক্ষ")]);
});

test("layoutRow clips to the cell window", () => {
  expect(plain(layoutRow("abcdefgh", 2, 3, null))).toBe("cde");
});

test("layoutRow pads wide characters cut by the window edge", () => {
  // "中" occupies cells 1-2; a window starting at cell 2 shows only its right half.
  expect(plain(layoutRow("a中b", 2, 2, null))).toBe(" b");
  expect(plain(layoutRow("a中b", 0, 2, null))).toBe("a ");
});

test("layoutRow marks selections and matches, selection winning on overlap", () => {
  expect(
    layoutRow("abcdef", 0, 10, null, [
      { start: 1, end: 3, kind: "match" },
      { start: 2, end: 5, kind: "selection" },
    ]),
  ).toEqual([text("a"), { text: "b", kind: "match" }, { text: "cde", kind: "selection" }, text("f")]);
});

test("layoutRow highlights a whole grapheme when a mark covers part of it", () => {
  // "কর" matches inside "করা": র + া is one grapheme, so "রা" is highlighted whole.
  expect(layoutRow("করা!", 0, 10, null, [{ start: 0, end: 2, kind: "match" }])).toEqual([
    { text: "করা", kind: "match" },
    text("!"),
  ]);
});
