import { expect, test } from "bun:test";
import { getText } from "../src/core/editor-buffer.ts";
import { handlePromptKey, inputPrompt, parseLineNumber, type Prompt, pasteIntoPrompt } from "../src/core/prompt.ts";

const key = (name: string, sequence = name, mods: { ctrl?: boolean } = {}) => ({
  name,
  sequence,
  ctrl: mods.ctrl ?? false,
  meta: false,
  shift: false,
});

function typeInto(prompt: Prompt, text: string): Prompt {
  for (const ch of text) {
    const action = handlePromptKey(prompt, key(ch));
    if (action?.type !== "update") throw new Error(`unexpected ${action?.type}`);
    prompt = action.prompt;
  }
  return prompt;
}

test("input prompt edits a single line and submits its value", () => {
  const prompt = typeInto(inputPrompt("open"), "src/a.ts");
  expect(handlePromptKey(prompt, key("return", "\r"))).toEqual({ type: "submit", value: "src/a.ts" });
});

test("pre-filled text is selected so typing replaces it", () => {
  const prompt = typeInto(inputPrompt("find", "old"), "new");
  expect(prompt.kind === "input" && getText(prompt.field)).toBe("new");
});

test("input prompt ignores multi-line keys and Esc cancels", () => {
  const prompt = inputPrompt("saveAs");
  expect(handlePromptKey(prompt, key("tab", "\t"))).toBeNull();
  expect(handlePromptKey(prompt, key("up", "\x1b[A"))).toBeNull();
  expect(handlePromptKey(prompt, key("escape", "\x1b"))).toEqual({ type: "cancel" });
});

test("find prompt steps through matches with Enter/Down and Up", () => {
  const prompt = inputPrompt("find", "x");
  expect(handlePromptKey(prompt, key("return", "\r"))).toEqual({ type: "next" });
  expect(handlePromptKey(prompt, key("down"))).toEqual({ type: "next" });
  expect(handlePromptKey(prompt, key("up"))).toEqual({ type: "prev" });
});

test("paste into a prompt drops newlines", () => {
  const prompt = pasteIntoPrompt(inputPrompt("open"), "a\nb.txt");
  expect(prompt.kind === "input" && getText(prompt.field)).toBe("ab.txt");
});

test("confirm prompt answers y/n and ignores other keys", () => {
  const prompt: Prompt = { kind: "confirm", purpose: "unsaved", then: "quit" };
  expect(handlePromptKey(prompt, key("y"))).toEqual({ type: "yes" });
  expect(handlePromptKey(prompt, key("n"))).toEqual({ type: "no" });
  expect(handlePromptKey(prompt, key("a"))).toBeNull();
  expect(handlePromptKey(prompt, key("x"))).toBeNull();
  expect(handlePromptKey(prompt, key("y", "\x19", { ctrl: true }))).toBeNull();
});

test("replace confirm also accepts a for all", () => {
  const prompt: Prompt = { kind: "confirm", purpose: "replace", query: "a", replacement: "b", replaced: 0 };
  expect(handlePromptKey(prompt, key("a"))).toEqual({ type: "all" });
});

test("parseLineNumber accepts ASCII and Bangla digits", () => {
  expect(parseLineNumber("12")).toBe(12);
  expect(parseLineNumber(" ১২ ")).toBe(12);
  expect(parseLineNumber("১0৫")).toBe(105);
  expect(parseLineNumber("0")).toBeNull();
  expect(parseLineNumber("-3")).toBeNull();
  expect(parseLineNumber("12a")).toBeNull();
  expect(parseLineNumber("")).toBeNull();
});
