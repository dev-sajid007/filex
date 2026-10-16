import { expect, test } from "bun:test";
import { parseArgs } from "../src/cli.ts";

const noEnv = {};
const parse = (...argv: string[]) => parseArgs(argv, noEnv);
const command = (...argv: string[]) => {
  const result = parse(...argv);
  if (!result.ok) throw new Error(result.error);
  return result.options.command;
};
const error = (...argv: string[]) => {
  const result = parse(...argv);
  if (result.ok) throw new Error("expected failure");
  return result.error;
};

test("no arguments opens an untitled editor in Bangla", () => {
  expect(parse()).toEqual({ ok: true, options: { lang: "bn", command: { kind: "edit", path: null } } });
});

test("--lang, --lang= and FILEX_LANG, with --lang taking precedence", () => {
  const lang = (argv: string[], env = {}) => {
    const r = parseArgs(argv, env);
    return r.ok ? r.options.lang : null;
  };
  expect(lang(["--lang", "en"])).toBe("en");
  expect(lang(["--lang=en"])).toBe("en");
  expect(lang([], { FILEX_LANG: "en" })).toBe("en");
  expect(lang(["--lang", "bn"], { FILEX_LANG: "en" })).toBe("bn");
  expect(lang([], { FILEX_LANG: "xx" })).toBe("bn");
});

test("rejects unknown or missing language", () => {
  expect(error("--lang", "fr")).toContain("fr");
  expect(parse("--lang").ok).toBe(false);
});

test("a single path opens the editor, also via `edit` and after --", () => {
  expect(command("notes.txt")).toEqual({ kind: "edit", path: "notes.txt" });
  expect(command("--lang", "en", "my file.txt")).toEqual({ kind: "edit", path: "my file.txt" });
  expect(command("edit", "a.txt")).toEqual({ kind: "edit", path: "a.txt" });
  expect(command("--", "--weird-name")).toEqual({ kind: "edit", path: "--weird-name" });
  expect(command("--", "read")).toEqual({ kind: "edit", path: "read" });
});

test("--help and --version win over everything else", () => {
  expect(command("--help")).toEqual({ kind: "help" });
  expect(command("-h", "read")).toEqual({ kind: "help" });
  expect(command("read", "x", "--version")).toEqual({ kind: "version" });
  expect(command("-v")).toEqual({ kind: "version" });
});

test("subcommands parse their arguments", () => {
  expect(command("read", "a.txt")).toEqual({ kind: "read", path: "a.txt" });
  expect(command("create", "a.txt")).toEqual({ kind: "create", path: "a.txt", force: false });
  expect(command("create", "--force", "a.txt")).toEqual({ kind: "create", path: "a.txt", force: true });
  expect(command("append", "a.txt", "নতুন লাইন")).toEqual({ kind: "append", path: "a.txt", text: "নতুন লাইন" });
  expect(command("insert", "a.txt", "৩", "x")).toEqual({ kind: "insert", path: "a.txt", line: 3, text: "x" });
  expect(command("replace", "a.txt", "old", "")).toEqual({
    kind: "replace",
    path: "a.txt",
    search: "old",
    replacement: "",
    dryRun: false,
  });
  expect(command("replace", "--dry-run", "a.txt", "a", "b")).toMatchObject({ dryRun: true });
});

test("text arguments may start with a dash after --", () => {
  expect(command("append", "a.txt", "--", "-- comment")).toEqual({ kind: "append", path: "a.txt", text: "-- comment" });
});

test("argument count errors include usage", () => {
  expect(parseArgs(["--lang", "en", "read"], noEnv)).toMatchObject({ ok: false, error: expect.stringContaining("Missing arguments") });
  expect(parseArgs(["--lang", "en", "read", "a", "b"], noEnv)).toMatchObject({ error: expect.stringContaining("Too many") });
  expect(parseArgs(["--lang", "en", "a", "b"], noEnv)).toMatchObject({ error: expect.stringContaining("Usage: filex") });
});

test("rejects bad values and flags that do not belong to the command", () => {
  expect(error("insert", "a.txt", "0", "x")).toContain("0");
  expect(error("insert", "a.txt", "two", "x")).toContain("two");
  expect(parse("replace", "a.txt", "", "x").ok).toBe(false);
  expect(error("--frobnicate")).toContain("--frobnicate");
  expect(error("read", "--force", "a.txt")).toContain("--force");
  expect(error("--dry-run", "a.txt")).toContain("--dry-run");
});
