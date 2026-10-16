import { format } from "../i18n/index.ts";
import { type CommandContext, loadExisting, normalized, writeBack } from "./context.ts";
import { EXIT, type ExitCode } from "./exit-codes.ts";
import { appendLines } from "./lines.ts";

/** Adds `text` as new line(s) at the end, keeping the final-newline convention. */
export async function append(path: string, text: string, ctx: CommandContext): Promise<ExitCode> {
  const file = await loadExisting(path, ctx);
  if (typeof file === "number") return file;
  const failed = await writeBack(file, appendLines(normalized(file), text), ctx);
  if (failed !== null) return failed;
  ctx.stderr(format(ctx.messages.appended, { path }));
  return EXIT.OK;
}
