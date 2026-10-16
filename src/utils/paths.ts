import { homedir } from "node:os";
import path from "node:path";

/** Resolves user input to an absolute path, expanding a leading `~`. */
export function resolveUserPath(input: string, cwd = process.cwd()): string {
  const trimmed = input.trim();
  if (trimmed === "~") return homedir();
  if (trimmed.startsWith("~/")) return path.join(homedir(), trimmed.slice(2));
  return path.resolve(cwd, trimmed);
}

/** Short form for display: relative to `cwd` when inside it, else `~`-abbreviated. */
export function displayPath(absolute: string, cwd = process.cwd()): string {
  const relative = path.relative(cwd, absolute);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) return relative;
  const home = homedir();
  if (absolute === home) return "~";
  if (absolute.startsWith(home + path.sep)) return "~" + absolute.slice(home.length);
  return absolute;
}

/** Default backup location, following the XDG Base Directory convention. */
export function defaultBackupDir(): string {
  const stateHome = process.env.XDG_STATE_HOME || path.join(homedir(), ".local", "state");
  return path.join(stateHome, "filex", "backups");
}
