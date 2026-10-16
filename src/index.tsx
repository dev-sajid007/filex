#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app.tsx";
import { parseArgs } from "./cli.ts";
import { FileError } from "./core/errors.ts";
import { createFileEngine, type LoadedFile } from "./core/file-engine.ts";
import { errorMessage, getMessages } from "./i18n/index.ts";
import { defaultBackupDir, resolveUserPath } from "./utils/paths.ts";

const EXIT_INVALID_ARGS = 2;
const EXIT_FILE_ERROR = 3;
const EXIT_PERMISSION = 4;

const parsed = parseArgs(process.argv.slice(2));
if (!parsed.ok) {
  console.error(parsed.error);
  process.exit(EXIT_INVALID_ARGS);
}

const { lang, path } = parsed.options;
const messages = getMessages(lang);
const engine = createFileEngine({ backupDir: defaultBackupDir() });

let initialFile: LoadedFile | undefined;
if (path !== null) {
  try {
    initialFile = await engine.load(resolveUserPath(path));
  } catch (error) {
    if (!(error instanceof FileError)) throw error;
    console.error(`${messages.openFailed}: ${path}\n${errorMessage(messages, error.code)}`);
    process.exit(error.code === "PERMISSION" ? EXIT_PERMISSION : EXIT_FILE_ERROR);
  }
}

const renderer = await createCliRenderer({ exitOnCtrlC: false });

async function quit() {
  renderer.destroy();
  await renderer.closed;
  process.exit(0);
}

createRoot(renderer).render(<App messages={messages} engine={engine} onQuit={quit} initialFile={initialFile} />);
