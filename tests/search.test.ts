import { expect, test } from "bun:test";
import { createState, getText } from "../src/core/editor-buffer.ts";
import {
  findMatches,
  matchRange,
  nextMatchIndex,
  prevMatchIndex,
  replaceAll,
  replaceMatch,
} from "../src/core/search.ts";

test("findMatches is case-sensitive, non-overlapping and per line", () => {
  expect(findMatches(["aaa", "xAa"], "aa")).toEqual([{ line: 0, start: 0, end: 2 }]);
  expect(findMatches(["abab", "ab"], "ab")).toEqual([
    { line: 0, start: 0, end: 2 },
    { line: 0, start: 2, end: 4 },
    { line: 1, start: 0, end: 2 },
  ]);
});

test("an empty query matches nothing", () => {
  expect(findMatches(["abc"], "")).toEqual([]);
});

test("Bangla substrings match inside graphemes, and the selection widens to whole graphemes", () => {
  const lines = ["আমি করা কাজ"];
  const [match] = findMatches(lines, "কর");
  expect(match).toEqual({ line: 0, start: 4, end: 6 });
  // "রা" is one grapheme, so the selectable range ends after the vowel sign.
  expect(matchRange(lines, match!)).toEqual({ start: { line: 0, col: 4 }, end: { line: 0, col: 7 } });
});

test("next/prev wrap around the document", () => {
  const matches = findMatches(["a.a", "a"], "a");
  expect(nextMatchIndex(matches, { line: 0, col: 0 }, true)).toBe(0);
  expect(nextMatchIndex(matches, { line: 0, col: 0 }, false)).toBe(1);
  expect(nextMatchIndex(matches, { line: 1, col: 0 }, false)).toBe(0);
  expect(prevMatchIndex(matches, { line: 0, col: 0 })).toBe(2);
  expect(prevMatchIndex(matches, { line: 1, col: 0 })).toBe(1);
  expect(nextMatchIndex([], { line: 0, col: 0 }, true)).toBe(-1);
});

test("replaceMatch swaps one occurrence and keeps the cursor on a grapheme boundary", () => {
  const state = createState("আমি করা কাজ");
  const [match] = findMatches(state.lines, "কর");
  const next = replaceMatch(state, match!, "লিখ");
  expect(getText(next)).toBe("আমি লিখা কাজ");
  // "খা" is one grapheme, so the cursor lands after it rather than between খ and া.
  expect(next.cursor).toEqual({ line: 0, col: "আমি লিখা".length });
});

test("replaceAll replaces every match and reports the count", () => {
  const { state, count } = replaceAll(createState("foo bar foo\nfoo"), "foo", "x");
  expect(getText(state)).toBe("x bar x\nx");
  expect(count).toBe(3);
});

test("replaceAll with no matches changes nothing", () => {
  const original = createState("abc");
  const result = replaceAll(original, "zzz", "y");
  expect(result).toEqual({ state: original, count: 0 });
});

test("replacement may be empty (delete matches)", () => {
  expect(getText(replaceAll(createState("a-b-c"), "-", "").state)).toBe("abc");
});
