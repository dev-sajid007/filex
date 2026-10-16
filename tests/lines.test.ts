import { expect, test } from "bun:test";
import { appendLines, insertLines, lineCount, replaceText } from "../src/commands/lines.ts";

test("lineCount ignores the trailing newline", () => {
  expect(lineCount("")).toBe(0);
  expect(lineCount("a")).toBe(1);
  expect(lineCount("a\n")).toBe(1);
  expect(lineCount("a\nb\n")).toBe(2);
  expect(lineCount("\n")).toBe(1);
});

test("append keeps the final-newline convention", () => {
  expect(appendLines("a\n", "b")).toBe("a\nb\n");
  expect(appendLines("a", "b")).toBe("a\nb");
  expect(appendLines("", "b")).toBe("b\n");
  expect(appendLines("a\n", "b\nc")).toBe("a\nb\nc\n");
});

test("insert places text at a 1-based line", () => {
  expect(insertLines("a\nb\n", 1, "X")).toBe("X\na\nb\n");
  expect(insertLines("a\nb\n", 2, "X")).toBe("a\nX\nb\n");
  expect(insertLines("a\nb\n", 3, "X")).toBe("a\nb\nX\n");
  expect(insertLines("a\nb", 3, "X")).toBe("a\nb\nX");
  expect(insertLines("", 1, "X")).toBe("X\n");
});

test("insert rejects out-of-range lines", () => {
  expect(() => insertLines("a\n", 3, "X")).toThrow(RangeError);
  expect(() => insertLines("a\n", 0, "X")).toThrow(RangeError);
});

test("replaceText counts matches and reports their lines", () => {
  expect(replaceText("foo\nbar foo foo\nbaz", "foo", "x")).toEqual({ text: "x\nbar x x\nbaz", count: 3, lines: [1, 2] });
  expect(replaceText("abc", "z", "y")).toEqual({ text: "abc", count: 0, lines: [] });
});

test("replaceText handles multi-line search text and Bangla", () => {
  expect(replaceText("a\nb\na\nb", "a\nb", "ক")).toEqual({ text: "ক\nক", count: 2, lines: [1, 3] });
  expect(replaceText("আমি করি", "করি", "লিখি").text).toBe("আমি লিখি");
});
