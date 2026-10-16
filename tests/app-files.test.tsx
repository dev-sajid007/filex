import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadFile } from "../src/core/file-engine.ts";
import { cleanupApp, renderApp, waitForFrame, waitForText } from "./helpers.tsx";

let dir: string;
const file = (name: string) => path.join(dir, name);
const read = (name: string) => fs.readFile(file(name), "utf8");

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(tmpdir(), "filex-app-"));
});

afterEach(async () => {
  cleanupApp();
  await fs.chmod(dir, 0o700).catch(() => {});
  await fs.rm(dir, { recursive: true, force: true });
});

async function openApp(name: string, contents: string, onQuit = () => {}) {
  await fs.writeFile(file(name), contents);
  return renderApp({ initialFile: await loadFile(file(name)), onQuit });
}

test("shows the opened file and its contents", async () => {
  const s = await openApp("hello.txt", "হ্যালো\nবিশ্ব\n");
  const frame = s.captureCharFrame();
  expect(frame).toContain("hello.txt");
  expect(frame).toMatch(/1 হ্যালো/);
  expect(frame).toMatch(/2 বিশ্ব/);
  expect(frame).not.toContain("Modified");
});

test("Ctrl+S saves to disk and clears the modified marker", async () => {
  const s = await openApp("a.txt", "one\r\n");
  await s.mockInput.typeText("zero ");
  await s.renderOnce();
  expect(s.captureCharFrame()).toContain("Modified");

  s.mockInput.pressKey("s", { ctrl: true });
  await waitForText(s, "Saved:");
  expect(s.captureCharFrame()).not.toContain("Modified");
  expect(await read("a.txt")).toBe("zero one\r\n");
});

test("Ctrl+S on an untitled buffer asks for a path and creates the file", async () => {
  const s = await renderApp();
  await s.mockInput.typeText("নতুন লেখা");
  s.mockInput.pressKey("s", { ctrl: true });
  await waitForText(s, "Save as:");

  await s.mockInput.typeText(file("created.txt"));
  s.mockInput.pressEnter();
  await waitForText(s, "Saved:");
  expect(await read("created.txt")).toBe("নতুন লেখা");
  expect(s.captureCharFrame()).toContain("created.txt");
});

test("a path that does not exist yet opens as a new file", async () => {
  const s = await renderApp({ initialFile: await loadFile(file("fresh.md")) });
  expect(s.captureCharFrame()).toContain("(New file)");
  await s.mockInput.typeText("# hi");
  s.mockInput.pressKey("s", { ctrl: true });
  await waitForText(s, "Saved:");
  expect(await read("fresh.md")).toBe("# hi");
  expect(s.captureCharFrame()).not.toContain("(New file)");
});

test("Ctrl+Q with unsaved changes asks first; n quits without saving", async () => {
  const onQuit = mock(() => {});
  const s = await openApp("q.txt", "keep", onQuit);
  await s.mockInput.typeText("x");
  s.mockInput.pressKey("q", { ctrl: true });
  await waitForText(s, "You have unsaved changes");
  expect(onQuit).not.toHaveBeenCalled();

  await s.mockInput.typeText("n");
  await s.renderOnce();
  expect(onQuit).toHaveBeenCalledTimes(1);
  expect(await read("q.txt")).toBe("keep");
});

test("Ctrl+Q then y saves and quits", async () => {
  const onQuit = mock(() => {});
  const s = await openApp("q.txt", "a", onQuit);
  await s.mockInput.typeText("b");
  s.mockInput.pressKey("q", { ctrl: true });
  await waitForText(s, "You have unsaved changes");
  await s.mockInput.typeText("y");
  await waitForFrame(s, () => onQuit.mock.calls.length > 0);
  expect(await read("q.txt")).toBe("ba");
});

test("Esc on the unsaved-changes prompt keeps editing", async () => {
  const onQuit = mock(() => {});
  const s = await openApp("q.txt", "a", onQuit);
  await s.mockInput.typeText("b");
  s.mockInput.pressKey("q", { ctrl: true });
  await waitForText(s, "You have unsaved changes");
  s.mockInput.pressEscape();
  await waitForFrame(s, (f) => !f.includes("unsaved changes"));
  expect(onQuit).not.toHaveBeenCalled();
  expect(s.captureCharFrame()).toContain("Modified");
});

test("saving over an externally changed file asks before overwriting", async () => {
  const s = await openApp("c.txt", "v1");
  await s.mockInput.typeText("mine ");
  await fs.writeFile(file("c.txt"), "changed elsewhere");

  s.mockInput.pressKey("s", { ctrl: true });
  await waitForText(s, "The file changed on disk");
  expect(await read("c.txt")).toBe("changed elsewhere");

  await s.mockInput.typeText("y");
  await waitForText(s, "Saved:");
  expect(await read("c.txt")).toBe("mine v1");
});

test("Ctrl+O opens another file", async () => {
  await fs.writeFile(file("other.txt"), "second file");
  const s = await openApp("first.txt", "first");
  s.mockInput.pressKey("o", { ctrl: true });
  await waitForText(s, "Open file:");
  await s.mockInput.typeText(file("other.txt"));
  s.mockInput.pressEnter();
  await waitForText(s, "second file");
  expect(s.captureCharFrame()).toContain("Opened:");
});

test("Ctrl+O with unsaved changes asks to save first", async () => {
  const s = await openApp("first.txt", "first");
  await s.mockInput.typeText("x");
  s.mockInput.pressKey("o", { ctrl: true });
  await waitForText(s, "You have unsaved changes");
  await s.mockInput.typeText("n");
  await waitForText(s, "Open file:");
});

test("opening a directory shows a localized error", async () => {
  const s = await renderApp({ lang: "bn" });
  s.mockInput.pressKey("o", { ctrl: true });
  await waitForText(s, "ফাইল খুলুন:");
  await s.mockInput.typeText(dir);
  s.mockInput.pressEnter();
  await waitForText(s, "এটি একটি directory");
});

test.skipIf(process.getuid?.() === 0)("a failed save keeps the text and offers another path", async () => {
  const s = await openApp("locked.txt", "original");
  await fs.chmod(file("locked.txt"), 0o444);
  await fs.chmod(dir, 0o500);

  await s.mockInput.typeText("edit ");
  s.mockInput.pressKey("s", { ctrl: true });
  await waitForText(s, "Save as:");
  expect(s.captureCharFrame()).toMatch(/1 edit original/);
  expect(s.captureCharFrame()).toContain("Modified");
  await fs.chmod(dir, 0o700);
  expect(await read("locked.txt")).toBe("original");
});
