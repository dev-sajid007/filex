import { afterEach, expect, test } from "bun:test";
import { cleanupApp, renderApp, type Setup, waitForFrame, waitForText } from "./helpers.tsx";

afterEach(cleanupApp);

const ctrl = (s: Setup, k: string) => s.mockInput.pressKey(k, { ctrl: true });
const statusRow = (s: Setup) => s.captureCharFrame().split("\n").at(-3)!;

async function frameAfter(s: Setup) {
  await s.renderOnce();
  return s.captureCharFrame();
}

test("Ctrl+Z undoes a typing run, Ctrl+Y redoes it", async () => {
  const s = await renderApp({ initialText: "base" });
  s.mockInput.pressKey("END");
  await s.mockInput.typeText(" more");
  expect(await frameAfter(s)).toMatch(/1 base more/);

  ctrl(s, "z");
  let frame = await frameAfter(s);
  expect(frame).toMatch(/1 base\s/);
  expect(frame).not.toContain("Modified");

  ctrl(s, "y");
  frame = await frameAfter(s);
  expect(frame).toMatch(/1 base more/);
  expect(frame).toContain("Modified");
});

test("Shift+arrows select and typing replaces the selection", async () => {
  const s = await renderApp({ initialText: "hello world" });
  for (let i = 0; i < 5; i++) s.mockInput.pressArrow("right", { shift: true });
  await s.mockInput.typeText("bye");
  expect(await frameAfter(s)).toMatch(/1 bye world/);
});

test("Ctrl+A, Ctrl+C then Ctrl+V duplicates the buffer", async () => {
  const s = await renderApp({ initialText: "ab" });
  ctrl(s, "a");
  ctrl(s, "c");
  expect(await frameAfter(s)).toContain("Copied");
  s.mockInput.pressKey("END");
  ctrl(s, "v");
  expect(await frameAfter(s)).toMatch(/1 abab/);
});

test("Ctrl+X cuts the selection; one undo restores it", async () => {
  const s = await renderApp({ initialText: "keep cut" });
  s.mockInput.pressKey("END");
  for (let i = 0; i < 4; i++) s.mockInput.pressArrow("left", { shift: true });
  ctrl(s, "x");
  expect(await frameAfter(s)).toMatch(/1 keep\s+│/);
  ctrl(s, "z");
  expect(await frameAfter(s)).toMatch(/1 keep cut/);
});

test("copy with nothing selected says so", async () => {
  const s = await renderApp({ initialText: "x" });
  ctrl(s, "c");
  expect(await frameAfter(s)).toContain("Nothing selected");
});

test("Ctrl+F finds incrementally and steps through matches", async () => {
  const s = await renderApp({ initialText: "foo bar\nfoo\nbaz foo" });
  ctrl(s, "f");
  await s.mockInput.typeText("foo");
  expect(statusRow(await Promise.resolve(s).then(async (x) => (await x.renderOnce(), x)))).toContain("Find (1/3): foo");

  s.mockInput.pressEnter();
  expect(await frameAfter(s)).toContain("Find (2/3)");
  s.mockInput.pressArrow("down");
  expect(await frameAfter(s)).toContain("Find (3/3)");
  s.mockInput.pressEnter();
  expect(await frameAfter(s)).toContain("Find (1/3)");
  s.mockInput.pressArrow("up");
  expect(await frameAfter(s)).toContain("Find (3/3)");

  // Esc closes the prompt and leaves the match selected, so typing replaces it.
  s.mockInput.pressEscape();
  await waitForFrame(s, (f) => !f.includes("Find ("));
  await s.mockInput.typeText("qux");
  expect(await frameAfter(s)).toMatch(/3 baz qux/);
});

test("find reports no matches", async () => {
  const s = await renderApp({ initialText: "abc" });
  ctrl(s, "f");
  await s.mockInput.typeText("zzz");
  expect(await frameAfter(s)).toContain("No matches found");
});

test("find works on Bangla text", async () => {
  const s = await renderApp({ initialText: "আমি করা কাজ করি" });
  ctrl(s, "f");
  await s.mockInput.typeText("কর");
  expect(await frameAfter(s)).toContain("(1/2)");
});

test("Ctrl+F reopens with the last query", async () => {
  const s = await renderApp({ initialText: "one two one" });
  ctrl(s, "f");
  await s.mockInput.typeText("one");
  s.mockInput.pressEscape();
  await waitForFrame(s, (f) => !f.includes("Find ("));
  s.mockInput.pressArrow("left");
  ctrl(s, "f");
  expect(await frameAfter(s)).toContain("Find (1/2): one");
});

test("Ctrl+R replaces matches one by one: y replaces, n skips", async () => {
  const s = await renderApp({ initialText: "cat cat cat" });
  ctrl(s, "r");
  await s.mockInput.typeText("cat");
  s.mockInput.pressEnter();
  await waitForText(s, "Replace with:");
  await s.mockInput.typeText("dog");
  s.mockInput.pressEnter();
  expect(await frameAfter(s)).toContain("Replace this match? (1/3)");

  await s.mockInput.typeText("y");
  expect(await frameAfter(s)).toMatch(/1 dog cat cat/);
  await s.mockInput.typeText("n");
  await s.mockInput.typeText("y");
  const frame = await frameAfter(s);
  expect(frame).toMatch(/1 dog cat dog/);
  expect(frame).toContain("Replaced 2");
});

test("Ctrl+R then a replaces all and a single undo reverts it", async () => {
  const s = await renderApp({ initialText: "a-b-c-d" });
  ctrl(s, "r");
  await s.mockInput.typeText("-");
  s.mockInput.pressEnter();
  await waitForText(s, "Replace with:");
  await s.mockInput.typeText("+");
  s.mockInput.pressEnter();
  await waitForText(s, "(1/3)");
  await s.mockInput.typeText("a");
  let frame = await frameAfter(s);
  expect(frame).toMatch(/1 a\+b\+c\+d/);
  expect(frame).toContain("Replaced 3");

  ctrl(s, "z");
  frame = await frameAfter(s);
  expect(frame).toMatch(/1 a-b-c-d/);
});

test("replace with no matches stops early", async () => {
  const s = await renderApp({ initialText: "abc" });
  ctrl(s, "r");
  await s.mockInput.typeText("zzz");
  s.mockInput.pressEnter();
  expect(await frameAfter(s)).toContain("No matches found");
});

test("Ctrl+G goes to a line, accepting Bangla digits", async () => {
  const initialText = Array.from({ length: 20 }, (_, i) => `row ${i + 1}`).join("\n");
  const s = await renderApp({ initialText });
  ctrl(s, "g");
  await s.mockInput.typeText("১৫");
  s.mockInput.pressEnter();
  const frame = await frameAfter(s);
  expect(frame).toContain("Ln 15, Col 1");
  expect(frame).toContain("row 15");
});

test("Ctrl+G rejects invalid input", async () => {
  const s = await renderApp({ initialText: "x" });
  ctrl(s, "g");
  await s.mockInput.typeText("abc");
  s.mockInput.pressEnter();
  expect(await frameAfter(s)).toContain("Invalid line number");
});

test("F1 shows the shortcut list; any key closes it without editing", async () => {
  const s = await renderApp({ initialText: "text", size: { width: 70, height: 16 } });
  s.mockInput.pressKey("F1");
  let frame = await frameAfter(s);
  expect(frame).toContain("Keyboard shortcuts");
  expect(frame).toContain("Ctrl+R");
  expect(frame).toContain("Replace");

  await s.mockInput.typeText("x");
  frame = await frameAfter(s);
  expect(frame).not.toContain("Keyboard shortcuts");
  expect(frame).toMatch(/1 text/);
});
