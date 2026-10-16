import { FileError } from "../core/errors.ts";
import type { FileEngine, LoadedFile } from "../core/file-engine.ts";
import { errorMessage, format, type Messages } from "../i18n/index.ts";
import { EXIT, type ExitCode, loadExitCode, saveExitCode } from "./exit-codes.ts";

export interface CommandContext {
  engine: FileEngine;
  messages: Messages;
  /** File contents for `read`. */
  stdout: (text: string) => void;
  /** Status and error messages, so stdout stays clean for pipes. */
  stderr: (text: string) => void;
}

/** LF-normalized text, matching what the editor buffer works with. */
export function normalized(file: LoadedFile): string {
  return file.text.replace(/\r\n?/g, "\n");
}

/** Loads an existing file, reporting errors. Returns an exit code on failure. */
export async function loadExisting(path: string, ctx: CommandContext): Promise<LoadedFile | ExitCode> {
  const m = ctx.messages;
  try {
    const file = await ctx.engine.load(path);
    if (file.stamp === null) {
      ctx.stderr(`${m.fileNotFound}: ${path}\n${format(m.createHint, { path })}`);
      return EXIT.FILE;
    }
    return file;
  } catch (error) {
    if (!(error instanceof FileError)) throw error;
    ctx.stderr(`${m.openFailed}: ${path}\n${errorMessage(m, error.code)}`);
    return loadExitCode(error.code);
  }
}

/** Saves `text` over `file` with the safe-save engine. Returns null on success. */
export async function writeBack(file: LoadedFile, text: string, ctx: CommandContext): Promise<ExitCode | null> {
  const m = ctx.messages;
  try {
    const result = await ctx.engine.save(file.path, text, file.meta, { expected: file.stamp });
    if (result.backup && "error" in result.backup) ctx.stderr(m.backupFailed);
    return null;
  } catch (error) {
    if (!(error instanceof FileError)) throw error;
    ctx.stderr(`${m.saveFailed}: ${file.path}\n${errorMessage(m, error.code)}`);
    return saveExitCode(error.code);
  }
}
