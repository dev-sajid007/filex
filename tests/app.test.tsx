import { afterEach, expect, mock, test } from "bun:test";
import { testRender } from "@opentui/react/test-utils";
import { App } from "../src/app.tsx";
import { createFileEngine } from "../src/core/file-engine.ts";
import { getMessages } from "../src/i18n/index.ts";

let setup: Awaited<ReturnType<typeof testRender>> | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

async function render(
  lang: "bn" | "en" = "en",
  onQuit = () => {},
  size = { width: 70, height: 12 },
  initialText = "",
) {
  setup = await testRender(
    <App
      messages={getMessages(lang)}
      engine={createFileEngine({ backupDir: null })}
      onQuit={onQuit}
      initialText={initialText}
    />,
    size,
  );
  await setup.renderOnce();
  return setup;
}

// Poll in real time: a lone ESC is only emitted after the input parser's escape timeout.
async function waitForFrame(s: NonNullable<typeof setup>, predicate: (frame: string) => boolean, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await s.renderOnce();
    if (predicate(s.captureCharFrame())) return;
    await Bun.sleep(10);
  }
  throw new Error(`Frame never matched:\n${s.captureCharFrame()}`);
}

test("renders the Bangla shell by default", async () => {
  const s = await render("bn");
  const frame = s.captureCharFrame();
  expect(frame).toContain("Ctrl+S");
  expect(frame).toContain("Ctrl+Q");
});

test("renders the English shell", async () => {
  const frame = (await render("en")).captureCharFrame();
  expect(frame).toContain("FileX");
  expect(frame).toContain("File: Untitled");
  expect(frame).toContain("Ln 1, Col 1");
});

test("Ctrl+Q calls onQuit", async () => {
  const onQuit = mock(() => {});
  const s = await render("en", onQuit);
  s.mockInput.pressKey("q", { ctrl: true });
  await s.renderOnce();
  expect(onQuit).toHaveBeenCalledTimes(1);
});

test("status messages show in the bar and Esc clears them", async () => {
  const s = await render("en");
  s.mockInput.pressKey("z", { ctrl: true });
  await s.renderOnce();
  expect(s.captureCharFrame()).toContain("Nothing to undo");

  s.mockInput.pressEscape();
  await waitForFrame(s, (f) => !f.includes("Nothing to undo"));
  expect(s.captureCharFrame()).toContain("Ctrl+S Save");
});

test("shows a warning when the terminal is too small, recovers on resize", async () => {
  const s = await render("en", () => {}, { width: 30, height: 6 });
  expect(s.captureCharFrame()).toContain("Terminal too small");

  s.resize(70, 12);
  await waitForFrame(s, (f) => f.includes("FileX"));
  expect(s.captureCharFrame()).not.toContain("Terminal too small");
});

test("status bar drops hints that do not fit instead of wrapping", async () => {
  const s = await render("en", () => {}, { width: 44, height: 10 });
  const rows = s.captureCharFrame().split("\n");
  const statusRow = rows.find((r) => r.includes("Ln 1, Col 1"))!;
  expect(statusRow).toContain("Ctrl+S Save");
  expect(statusRow).not.toContain("Ctrl+Q");
  expect(statusRow).not.toContain("...");
});

test("typing edits the buffer and marks it modified", async () => {
  const s = await render("en");
  expect(s.captureCharFrame()).not.toContain("Modified");

  await s.mockInput.typeText("hi");
  s.mockInput.pressEnter();
  await s.mockInput.typeText("yo");
  await s.renderOnce();

  const frame = s.captureCharFrame();
  expect(frame).toMatch(/1 hi/);
  expect(frame).toMatch(/2 yo/);
  expect(frame).toContain("Modified [*]");
  expect(frame).toContain("Ln 2, Col 3");
});

test("deleting back to the original text clears the modified marker", async () => {
  const s = await render("en");
  await s.mockInput.typeText("x");
  await s.renderOnce();
  expect(s.captureCharFrame()).toContain("Modified");

  s.mockInput.pressBackspace();
  await s.renderOnce();
  expect(s.captureCharFrame()).not.toContain("Modified");
});

test("Bangla input counts columns by visible character", async () => {
  const s = await render("en");
  await s.mockInput.typeText("ক্ষকি");
  await s.renderOnce();
  expect(s.captureCharFrame()).toContain("Ln 1, Col 3");

  s.mockInput.pressBackspace();
  await s.renderOnce();
  expect(s.captureCharFrame()).toContain("Ln 1, Col 2");
});

test("viewport scrolls to follow the cursor", async () => {
  const text = Array.from({ length: 30 }, (_, i) => `line-${i + 1}`).join("\n");
  // height 12 leaves 6 text rows
  const s = await render("en", () => {}, { width: 70, height: 12 }, text);
  expect(s.captureCharFrame()).toContain("line-1");
  expect(s.captureCharFrame()).not.toContain("line-7");

  for (let i = 0; i < 9; i++) s.mockInput.pressArrow("down");
  await s.renderOnce();
  const frame = s.captureCharFrame();
  expect(frame).toContain("line-10");
  expect(frame).not.toContain("line-4 ");
  expect(frame).toContain("Ln 10, Col 1");
});

test("long lines scroll horizontally", async () => {
  const s = await render("en", () => {}, { width: 40, height: 10 }, "a".repeat(60) + "END");
  expect(s.captureCharFrame()).not.toContain("END");
  s.mockInput.pressKey("END");
  await s.renderOnce();
  expect(s.captureCharFrame()).toContain("END");
});

test("bracketed paste inserts multi-line text at the cursor", async () => {
  const s = await render("en");
  await s.mockInput.typeText("বাংলা");
  await s.mockInput.pasteBracketedText("pasted\r\nline");
  await s.renderOnce();
  const frame = s.captureCharFrame();
  expect(frame).toMatch(/1 বাংলাpasted/);
  expect(frame).toMatch(/2 line/);
  expect(frame).toContain("Ln 2, Col 5");
});
