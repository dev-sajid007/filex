import { DEFAULT_LOCALE, getMessages, isLocale, LOCALES, type Locale } from "./i18n/index.ts";

export interface CliOptions {
  lang: Locale;
  path: string | null;
}

export type ParseResult = { ok: true; options: CliOptions } | { ok: false; error: string };

export function parseArgs(argv: string[]): ParseResult {
  let lang: Locale = DEFAULT_LOCALE;
  const paths: string[] = [];
  let optionsEnded = false;

  const failure = (detail: string): ParseResult => ({ ok: false, error: `${detail}\n${getMessages(lang).usage}` });

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;

    if (optionsEnded || !arg.startsWith("-") || arg === "-") {
      paths.push(arg);
      continue;
    }
    if (arg === "--") {
      optionsEnded = true;
      continue;
    }
    if (arg === "--lang" || arg.startsWith("--lang=")) {
      const value = arg === "--lang" ? argv[++i] : arg.slice("--lang=".length);
      if (!value || !isLocale(value)) {
        const m = getMessages(lang);
        return { ok: false, error: `${m.invalidLang}: ${value ?? ""}\n${m.supportedLangs}: ${LOCALES.join(", ")}` };
      }
      lang = value;
      continue;
    }
    return failure(`${getMessages(lang).unknownOption}: ${arg}`);
  }

  if (paths.length > 1) return failure(getMessages(lang).tooManyPaths);
  return { ok: true, options: { lang, path: paths[0] ?? null } };
}
