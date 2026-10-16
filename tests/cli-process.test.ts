// Runs the real entry point as a subprocess: exit codes, stdout/stderr split, non-TTY behaviour.
import { afterAll, beforeAll, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import pkg from "../package.json";

const ENTRY = path.join(import.meta.dir, "..", "src", "index.tsx");
let dir: string;

beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(tmpdir(), "filex-proc-"));
});
afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

async function filex(...args: string[]) {
  const proc = Bun.spawn(["bun", ENTRY, ...args], {
    // No TTY: stdin is /dev/null and output is piped.
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, XDG_STATE_HOME: path.join(dir, "state"), FILEX_LANG: "" },
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, code };
}

test("--version prints the package version", async () => {
  const r = await filex("--version");
  expect(r).toMatchObject({ code: 0, stdout: `filex ${pkg.version}\n` });
});

test("--help works without a terminal, in both languages", async () => {
  const bn = await filex("--help");
  expect(bn.code).toBe(0);
  expect(bn.stdout).toContain("ব্যবহার:");
  const en = await filex("--lang", "en", "--help");
  expect(en.stdout).toContain("Usage:");
});

test("editor without a terminal exits 6 with a hint", async () => {
  const r = await filex("--lang", "en", path.join(dir, "x.txt"));
  expect(r.code).toBe(6);
  expect(r.stderr).toContain("needs a terminal");
  expect(r.stderr).toContain("filex read");
});

test("bad arguments exit 2", async () => {
  expect((await filex("--bogus")).code).toBe(2);
  expect((await filex("read")).code).toBe(2);
});

test("create → append → read round-trip, with content on stdout and messages on stderr", async () => {
  const target = path.join(dir, "notes.txt");
  expect((await filex("create", target)).code).toBe(0);
  expect((await filex("append", target, "প্রথম লাইন")).code).toBe(0);
  expect((await filex("insert", target, "১", "শিরোনাম")).code).toBe(0);
  const r = await filex("read", target);
  expect(r).toMatchObject({ code: 0, stdout: "শিরোনাম\nপ্রথম লাইন\n", stderr: "" });
});

test("file errors exit 3, no matches exits 1", async () => {
  expect((await filex("read", path.join(dir, "missing"))).code).toBe(3);
  const target = path.join(dir, "r.txt");
  await fs.writeFile(target, "abc");
  expect((await filex("replace", target, "zzz", "y")).code).toBe(1);
});
