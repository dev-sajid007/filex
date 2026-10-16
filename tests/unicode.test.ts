import { expect, test } from "bun:test";
import { cellWidth, graphemeIndex, graphemes, nextBoundary, offsetAtCell, prevBoundary } from "../src/utils/unicode.ts";

// ক্ষ = ক + ্ + ষ (one conjunct), কি = ক + ি (consonant + vowel sign)
const KSHA = "ক্ষ";
const KI = "কি";
const FAMILY = "👨‍👩‍👧"; // ZWJ sequence, 5 code points / 8 UTF-16 units

test("graphemes keeps conjuncts, vowel signs and ZWJ emoji whole", () => {
  expect(graphemes(`${KSHA}${KI}a`)).toEqual([KSHA, KI, "a"]);
  expect(graphemes(`x${FAMILY}y`)).toEqual(["x", FAMILY, "y"]);
  expect(graphemes("")).toEqual([]);
});

test("boundaries step over whole graphemes", () => {
  const text = `a${KSHA}b`;
  expect(nextBoundary(text, 0)).toBe(1);
  expect(nextBoundary(text, 1)).toBe(1 + KSHA.length);
  expect(prevBoundary(text, 1 + KSHA.length)).toBe(1);
  expect(prevBoundary(text, 0)).toBe(0);
  expect(nextBoundary(text, text.length)).toBe(text.length);
});

test("boundaries handle surrogate pairs", () => {
  const text = `${FAMILY}!`;
  expect(nextBoundary(text, 0)).toBe(FAMILY.length);
  expect(prevBoundary(text, FAMILY.length)).toBe(0);
});

test("cellWidth differs from string length for Bangla and wide characters", () => {
  expect(cellWidth("খুঁজুন")).toBe(3);
  expect("খুঁজুন".length).toBe(6);
  expect(cellWidth("中")).toBe(2);
  expect(cellWidth("abc")).toBe(3);
});

test("offsetAtCell never lands inside a grapheme", () => {
  const text = "a中b";
  expect(offsetAtCell(text, 0)).toBe(0);
  expect(offsetAtCell(text, 1)).toBe(1);
  expect(offsetAtCell(text, 2)).toBe(1); // inside the wide char -> before it
  expect(offsetAtCell(text, 3)).toBe(2);
  expect(offsetAtCell(text, 99)).toBe(text.length);
});

test("graphemeIndex counts visible characters", () => {
  expect(graphemeIndex(`${KSHA}${KI}`, KSHA.length)).toBe(1);
  expect(graphemeIndex(`${KSHA}${KI}`, KSHA.length + KI.length)).toBe(2);
});
