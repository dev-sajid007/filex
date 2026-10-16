import { format } from "../i18n/index.ts";
import { type CommandContext, loadExisting, normalized, writeBack } from "./context.ts";
import { EXIT, type ExitCode } from "./exit-codes.ts";
import { replaceText } from "./lines.ts";

const MAX_LISTED_LINES = 20;

/** Replaces every occurrence. Exits 1 when nothing matches, so scripts can tell. */
export async function replace(
  path: string,
  search: string,
  replacement: string,
  dryRun: boolean,
  ctx: CommandContext,
): Promise<ExitCode> {
  const m = ctx.messages;
  const file = await loadExisting(path, ctx);
  if (typeof file === "number") return file;

  // `\n` in arguments matches line breaks regardless of the file's CRLF/LF style.
  const result = replaceText(normalized(file), search.replace(/\r\n?/g, "\n"), replacement.replace(/\r\n?/g, "\n"));
  if (result.count === 0) {
    ctx.stderr(`${m.noMatches}: ${path}`);
    return EXIT.GENERAL;
  }

  const listed = result.lines.slice(0, MAX_LISTED_LINES).join(", ") + (result.lines.length > MAX_LISTED_LINES ? ", …" : "");
  if (dryRun) {
    ctx.stderr(`${format(m.dryRun, { n: result.count })}\n${format(m.matchLines, { lines: listed })}`);
    return EXIT.OK;
  }

  const failed = await writeBack(file, result.text, ctx);
  if (failed !== null) return failed;
  ctx.stderr(`${format(m.replacedIn, { n: result.count, path })}\n${format(m.matchLines, { lines: listed })}`);
  return EXIT.OK;
}
