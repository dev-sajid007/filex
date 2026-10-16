import { FileError } from "../core/errors.ts";
import { errorMessage, format } from "../i18n/index.ts";
import { type CommandContext, writeBack } from "./context.ts";
import { EXIT, type ExitCode, loadExitCode } from "./exit-codes.ts";

/** Creates an empty file. An existing file is only overwritten with `force`. */
export async function create(path: string, force: boolean, ctx: CommandContext): Promise<ExitCode> {
  const m = ctx.messages;
  let file;
  try {
    // Validates the target: parent exists, not a directory, readable if present.
    file = await ctx.engine.load(path);
  } catch (error) {
    if (!(error instanceof FileError)) throw error;
    ctx.stderr(`${m.openFailed}: ${path}\n${errorMessage(m, error.code)}`);
    return loadExitCode(error.code);
  }

  if (file.stamp !== null && !force) {
    ctx.stderr(`${m.fileExists}: ${path}`);
    return EXIT.FILE;
  }
  const failed = await writeBack(file, "", ctx);
  if (failed !== null) return failed;
  ctx.stderr(format(m.created, { path }));
  return EXIT.OK;
}
