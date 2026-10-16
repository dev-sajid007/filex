import { type CommandContext, loadExisting } from "./context.ts";
import { EXIT, type ExitCode } from "./exit-codes.ts";

/** Prints the file exactly as stored (line endings kept; a BOM is not printed). */
export async function read(path: string, ctx: CommandContext): Promise<ExitCode> {
  const file = await loadExisting(path, ctx);
  if (typeof file === "number") return file;
  ctx.stdout(file.text);
  return EXIT.OK;
}
