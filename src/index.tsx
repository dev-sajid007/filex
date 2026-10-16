#!/usr/bin/env bun
import { type CliRenderer, createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import pkg from "../package.json";
import { App } from "./app.tsx";
import { parseArgs } from "./cli.ts";
import { loadExitCode } from "./commands/exit-codes.ts";
import { type CommandContext, EXIT, runCommand } from "./commands/index.ts";
import { FileError } from "./core/errors.ts";
import { createFileEngine, type LoadedFile } from "./core/file-engine.ts";
import { errorMessage, getMessages } from "./i18n/index.ts";
import { defaultBackupDir, resolveUserPath } from "./utils/paths.ts";

const parsed = parseArgs(process.argv.slice(2));
if (!parsed.ok) {
  console.error(parsed.error);
  process.exit(EXIT.INVALID_ARGS);
}

const { lang, command } = parsed.options;
const messages = getMessages(lang);
const engine = createFileEngine({ backupDir: defaultBackupDir() });

if (command.kind !== "edit") {
  const ctx: CommandContext = {
    engine,
    messages,
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => console.error(text),
  };
  process.exit(await runCommand(command, ctx, pkg.version));
}

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error(`${messages.noTty}\n${messages.noTtyHint}`);
  process.exit(EXIT.NO_TTY);
}

let initialFile: LoadedFile | undefined;
if (command.path !== null) {
  try {
    initialFile = await engine.load(resolveUserPath(command.path));
  } catch (error) {
    if (!(error instanceof FileError)) throw error;
    console.error(`${messages.openFailed}: ${command.path}\n${errorMessage(messages, error.code)}`);
    process.exit(loadExitCode(error.code));
  }
}

let renderer: CliRenderer;
try {
  renderer = await createCliRenderer({ exitOnCtrlC: false });
} catch (error) {
  console.error(`${messages.noTty}\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(EXIT.NO_TTY);
}

async function quit() {
  renderer.destroy();
  await renderer.closed;
  process.exit(EXIT.OK);
}

createRoot(renderer).render(<App messages={messages} engine={engine} onQuit={quit} initialFile={initialFile} />);
