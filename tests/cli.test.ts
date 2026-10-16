import { expect, test } from "bun:test";
import { parseArgs } from "../src/cli.ts";

test("defaults to Bangla", () => {
  expect(parseArgs([])).toEqual({ ok: true, options: { lang: "bn", path: null } });
});

test("accepts --lang en and --lang=en", () => {
  expect(parseArgs(["--lang", "en"])).toEqual({ ok: true, options: { lang: "en", path: null } });
  expect(parseArgs(["--lang=en"])).toEqual({ ok: true, options: { lang: "en", path: null } });
});

test("rejects unknown or missing language", () => {
  const bad = parseArgs(["--lang", "fr"]);
  expect(bad.ok).toBe(false);
  if (!bad.ok) expect(bad.error).toContain("fr");
  expect(parseArgs(["--lang"]).ok).toBe(false);
});

test("takes one positional path, including after --", () => {
  expect(parseArgs(["notes.txt"])).toEqual({ ok: true, options: { lang: "bn", path: "notes.txt" } });
  expect(parseArgs(["--lang", "en", "my file.txt"])).toEqual({ ok: true, options: { lang: "en", path: "my file.txt" } });
  expect(parseArgs(["--", "--weird-name"])).toEqual({ ok: true, options: { lang: "bn", path: "--weird-name" } });
});

test("rejects unknown options and multiple paths with usage", () => {
  const unknown = parseArgs(["--frobnicate"]);
  expect(unknown.ok).toBe(false);
  if (!unknown.ok) expect(unknown.error).toContain("--frobnicate");

  const many = parseArgs(["--lang", "en", "a", "b"]);
  expect(many.ok).toBe(false);
  if (!many.ok) expect(many.error).toContain("Usage: filex");
});
