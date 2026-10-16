import { testRender } from "@opentui/react/test-utils";
import { App } from "../src/app.tsx";
import { createFileEngine, type FileEngine, type LoadedFile } from "../src/core/file-engine.ts";
import { getMessages, type Locale } from "../src/i18n/index.ts";

export type Setup = Awaited<ReturnType<typeof testRender>>;

let current: Setup | undefined;

export interface RenderOptions {
  lang?: Locale;
  onQuit?: () => void;
  size?: { width: number; height: number };
  initialText?: string;
  initialFile?: LoadedFile;
  engine?: FileEngine;
}

export async function renderApp({
  lang = "en",
  onQuit = () => {},
  size = { width: 70, height: 12 },
  initialText = "",
  initialFile,
  engine = createFileEngine({ backupDir: null }),
}: RenderOptions = {}): Promise<Setup> {
  current = await testRender(
    <App
      messages={getMessages(lang)}
      engine={engine}
      onQuit={onQuit}
      initialText={initialText}
      initialFile={initialFile}
    />,
    // Same as src/index.tsx: Ctrl+C is the copy shortcut, not quit.
    { ...size, exitOnCtrlC: false },
  );
  await current.renderOnce();
  return current;
}

export function cleanupApp() {
  current?.renderer.destroy();
  current = undefined;
}

/**
 * Polls in real time until the frame matches. Needed for file I/O and for a lone ESC,
 * which the input parser only emits after its escape timeout.
 */
export async function waitForFrame(s: Setup, predicate: (frame: string) => boolean, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await s.renderOnce();
    if (predicate(s.captureCharFrame())) return;
    await Bun.sleep(10);
  }
  throw new Error(`Frame never matched:\n${s.captureCharFrame()}`);
}

export const waitForText = (s: Setup, text: string, timeoutMs?: number) =>
  waitForFrame(s, (f) => f.includes(text), timeoutMs);
