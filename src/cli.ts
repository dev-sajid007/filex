import { DEFAULT_LOCALE, getMessages, isLocale, LOCALES, type Locale } from "./i18n/index.ts";
import { parseLineNumber } from "./core/prompt.ts";

export type Command =
  | { kind: "edit"; path: string | null }
  | { kind: "help" }
  | { kind: "version" }
  | { kind: "read"; path: string }
  | { kind: "create"; path: string; force: boolean }
  | { kind: "append"; path: string; text: string }
  | { kind: "insert"; path: string; line: number; text: string }
  | { kind: "replace"; path: string; search: string; replacement: string; dryRun: boolean };

export interface CliOptions {
  lang: Locale;
  command: Command;
}

export type ParseResult = { ok: true; options: CliOptions } | { ok: false; error: string; lang: Locale };

const SUBCOMMANDS = ["edit", "read", "create", "append", "insert", "replace"] as const;
type Subcommand = (typeof SUBCOMMANDS)[number];

/** Positional arguments each subcommand takes. */
const ARITY: Record<Subcommand, number> = { edit: 1, read: 1, create: 1, append: 2, insert: 3, replace: 3 };

/** Flags each subcommand accepts, besides the global ones. */
const FLAGS: Partial<Record<Subcommand, string[]>> = { create: ["--force"], replace: ["--dry-run"] };

/**
 * Parses argv. Language precedence: `--lang` > `FILEX_LANG` > Bangla.
 * The first positional selects a subcommand; otherwise it is the path to edit.
 * Use `--` (or `./read`) to edit a file whose name is a subcommand.
 */
export function parseArgs(argv: string[], env: Record<string, string | undefined> = process.env): ParseResult {
  const envLang = env.FILEX_LANG;
  let lang: Locale = envLang && isLocale(envLang) ? envLang : DEFAULT_LOCALE;

  const positionals: string[] = [];
  const flags = new Set<string>();
  let help = false;
  let version = false;
  let optionsEnded = false;
  let subcommandAllowed = true;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (optionsEnded || !arg.startsWith("-") || arg === "-") {
      positionals.push(arg);
      continue;
    }
    if (arg === "--") {
      optionsEnded = true;
      // `filex -- read` edits a file called "read".
      if (positionals.length === 0) subcommandAllowed = false;
      continue;
    }
    if (arg === "--lang" || arg.startsWith("--lang=")) {
      const value = arg === "--lang" ? argv[++i] : arg.slice("--lang=".length);
      if (!value || !isLocale(value)) {
        const m = getMessages(lang);
        return { ok: false, lang, error: `${m.invalidLang}: ${value ?? ""}\n${m.supportedLangs}: ${LOCALES.join(", ")}` };
      }
      lang = value;
    } else if (arg === "-h" || arg === "--help") help = true;
    else if (arg === "-v" || arg === "--version") version = true;
    else flags.add(arg);
  }

  const m = getMessages(lang);
  const failure = (detail: string): ParseResult => ({ ok: false, lang, error: `${detail}\n${m.usage}` });
  const ok = (command: Command): ParseResult => ({ ok: true, options: { lang, command } });

  if (help) return ok({ kind: "help" });
  if (version) return ok({ kind: "version" });

  const first = positionals[0];
  const sub = subcommandAllowed && SUBCOMMANDS.includes(first as Subcommand) ? (first as Subcommand) : null;

  for (const flag of flags) {
    if (!sub || !FLAGS[sub]?.includes(flag)) return failure(`${m.unknownOption}: ${flag}`);
  }

  if (!sub) {
    if (positionals.length > 1) return failure(m.tooManyPaths);
    return ok({ kind: "edit", path: positionals[0] ?? null });
  }

  const args = positionals.slice(1);
  if (args.length < ARITY[sub]) return failure(`${m.missingArgs}: filex ${sub}`);
  if (args.length > ARITY[sub]) return failure(`${m.tooManyArgs}: filex ${sub}`);
  const [path, a, b] = args as [string, string, string];

  switch (sub) {
    case "edit":
      return ok({ kind: "edit", path });
    case "read":
      return ok({ kind: "read", path });
    case "create":
      return ok({ kind: "create", path, force: flags.has("--force") });
    case "append":
      return ok({ kind: "append", path, text: a });
    case "insert": {
      const line = parseLineNumber(a);
      if (line === null) return failure(`${m.invalidLine}: ${a}`);
      return ok({ kind: "insert", path, line, text: b });
    }
    case "replace":
      if (!a) return failure(m.emptySearch);
      return ok({ kind: "replace", path, search: a, replacement: b, dryRun: flags.has("--dry-run") });
  }
}
