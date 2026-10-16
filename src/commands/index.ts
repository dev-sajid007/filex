import type { Command } from "../cli.ts";
import { resolveUserPath } from "../utils/paths.ts";
import { append } from "./append.ts";
import type { CommandContext } from "./context.ts";
import { create } from "./create.ts";
import { EXIT, type ExitCode } from "./exit-codes.ts";
import { insert } from "./insert.ts";
import { read } from "./read.ts";
import { replace } from "./replace.ts";

export type { CommandContext } from "./context.ts";
export { EXIT, type ExitCode } from "./exit-codes.ts";

/** Runs a non-interactive command. `edit` is handled by the TUI entry point. */
export async function runCommand(
  command: Exclude<Command, { kind: "edit" }>,
  ctx: CommandContext,
  version: string,
): Promise<ExitCode> {
  switch (command.kind) {
    case "help":
      ctx.stdout(ctx.messages.cliHelp + "\n");
      return EXIT.OK;
    case "version":
      ctx.stdout(`filex ${version}\n`);
      return EXIT.OK;
    case "read":
      return read(resolveUserPath(command.path), ctx);
    case "create":
      return create(resolveUserPath(command.path), command.force, ctx);
    case "append":
      return append(resolveUserPath(command.path), command.text, ctx);
    case "insert":
      return insert(resolveUserPath(command.path), command.line, command.text, ctx);
    case "replace":
      return replace(resolveUserPath(command.path), command.search, command.replacement, command.dryRun, ctx);
  }
}
