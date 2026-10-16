import { format } from "../i18n/index.ts";
import { type CommandContext, loadExisting, normalized, writeBack } from "./context.ts";
import { EXIT, type ExitCode } from "./exit-codes.ts";
import { insertLines, lineCount } from "./lines.ts";

/** Inserts `text` as new line(s) starting at 1-based `line`; `line` may be one past the end. */
export async function insert(path: string, line: number, text: string, ctx: CommandContext): Promise<ExitCode> {
  const m = ctx.messages;
  const file = await loadExisting(path, ctx);
  if (typeof file === "number") return file;

  const content = normalized(file);
  const max = lineCount(content) + 1;
  if (line > max) {
    ctx.stderr(format(m.lineRange, { max }));
    return EXIT.INVALID_ARGS;
  }
  const failed = await writeBack(file, insertLines(content, line, text), ctx);
  if (failed !== null) return failed;
  ctx.stderr(format(m.inserted, { line, path }));
  return EXIT.OK;
}
