import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Command } from "../src/cli.ts";
import { type CommandContext, EXIT, runCommand } from "../src/commands/index.ts";
import { createFileEngine } from "../src/core/file-engine.ts";
import { getMessages } from "../src/i18n/index.ts";

let dir: string;
let out: string[];
let err: string[];
let ctx: CommandContext;

const file = (name: string) => path.join(dir, name);
const read = (name: string) => fs.readFile(file(name), "utf8");
const run = (command: Exclude<Command, { kind: "edit" }>) => runCommand(command, ctx, "1.2.3");

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(tmpdir(), "filex-cmd-"));
  out = [];
  err = [];
  ctx = {
    engine: createFileEngine({ backupDir: path.join(dir, ".backups") }),
    messages: getMessages("en"),
    stdout: (t) => out.push(t),
    stderr: (t) => err.push(t),
  };
});

afterEach(async () => {
  await fs.chmod(dir, 0o700).catch(() => {});
  await fs.rm(dir, { recursive: true, force: true });
});

test("help and version print to stdout", async () => {
  expect(await run({ kind: "help" })).toBe(EXIT.OK);
  expect(out.join("")).toContain("filex read <path>");
  out = [];
  expect(await run({ kind: "version" })).toBe(EXIT.OK);
  expect(out.join("")).toBe("filex 1.2.3\n");
});

describe("read", () => {
  test("prints content unchanged, CRLF included", async () => {
    await fs.writeFile(file("a.txt"), "হ্যালো\r\nবিশ্ব");
    expect(await run({ kind: "read", path: file("a.txt") })).toBe(EXIT.OK);
    expect(out.join("")).toBe("হ্যালো\r\nবিশ্ব");
    expect(err).toEqual([]);
  });

  test("missing file exits 3 with the create hint", async () => {
    expect(await run({ kind: "read", path: file("nope.txt") })).toBe(EXIT.FILE);
    expect(err.join("\n")).toContain("File not found");
    expect(err.join("\n")).toContain("filex create");
  });

  test("directory and binary files exit 3", async () => {
    expect(await run({ kind: "read", path: dir })).toBe(EXIT.FILE);
    await fs.writeFile(file("bin"), new Uint8Array([0, 1, 2]));
    expect(await run({ kind: "read", path: file("bin") })).toBe(EXIT.FILE);
  });

  test.skipIf(process.getuid?.() === 0)("unreadable file exits 4", async () => {
    await fs.writeFile(file("secret"), "x");
    await fs.chmod(file("secret"), 0o000);
    expect(await run({ kind: "read", path: file("secret") })).toBe(EXIT.PERMISSION);
  });
});

describe("create", () => {
  test("creates an empty file", async () => {
    expect(await run({ kind: "create", path: file("new.txt"), force: false })).toBe(EXIT.OK);
    expect(await read("new.txt")).toBe("");
  });

  test("refuses to overwrite without --force", async () => {
    await fs.writeFile(file("keep.txt"), "important");
    expect(await run({ kind: "create", path: file("keep.txt"), force: false })).toBe(EXIT.FILE);
    expect(await read("keep.txt")).toBe("important");
    expect(err.join("\n")).toContain("--force");
  });

  test("--force empties an existing file", async () => {
    await fs.writeFile(file("old.txt"), "old");
    expect(await run({ kind: "create", path: file("old.txt"), force: true })).toBe(EXIT.OK);
    expect(await read("old.txt")).toBe("");
  });

  test("missing parent directory exits 3", async () => {
    expect(await run({ kind: "create", path: file("no/such/x.txt"), force: false })).toBe(EXIT.FILE);
  });
});

describe("append and insert", () => {
  test("append adds a line and keeps CRLF", async () => {
    await fs.writeFile(file("a.txt"), "one\r\ntwo\r\n");
    expect(await run({ kind: "append", path: file("a.txt"), text: "তিন" })).toBe(EXIT.OK);
    expect(await read("a.txt")).toBe("one\r\ntwo\r\nতিন\r\n");
  });

  test("append to a missing file exits 3 and creates nothing", async () => {
    expect(await run({ kind: "append", path: file("missing.txt"), text: "x" })).toBe(EXIT.FILE);
    expect(await fs.exists(file("missing.txt"))).toBe(false);
  });

  test("insert at a line, and one past the end", async () => {
    await fs.writeFile(file("i.txt"), "a\nc\n");
    expect(await run({ kind: "insert", path: file("i.txt"), line: 2, text: "b" })).toBe(EXIT.OK);
    expect(await run({ kind: "insert", path: file("i.txt"), line: 4, text: "d" })).toBe(EXIT.OK);
    expect(await read("i.txt")).toBe("a\nb\nc\nd\n");
  });

  test("insert beyond the end exits 2 without writing", async () => {
    await fs.writeFile(file("i.txt"), "a\n");
    expect(await run({ kind: "insert", path: file("i.txt"), line: 5, text: "x" })).toBe(EXIT.INVALID_ARGS);
    expect(err.join("\n")).toContain("between 1 and 2");
    expect(await read("i.txt")).toBe("a\n");
  });

  test("writes are backed up and keep the file mode", async () => {
    await fs.writeFile(file("m.sh"), "echo 1\n");
    await fs.chmod(file("m.sh"), 0o750);
    await run({ kind: "append", path: file("m.sh"), text: "echo 2" });
    expect((await fs.stat(file("m.sh"))).mode & 0o777).toBe(0o750);
    expect(await fs.readdir(path.join(dir, ".backups"))).toHaveLength(1);
  });

  test.skipIf(process.getuid?.() === 0)("permission failure exits 4 and keeps the original", async () => {
    await fs.writeFile(file("ro.txt"), "original");
    await fs.chmod(file("ro.txt"), 0o444);
    await fs.chmod(dir, 0o500);
    ctx.engine = createFileEngine({ backupDir: null });
    expect(await run({ kind: "append", path: file("ro.txt"), text: "x" })).toBe(EXIT.PERMISSION);
    await fs.chmod(dir, 0o700);
    expect(await read("ro.txt")).toBe("original");
  });
});

describe("replace", () => {
  test("replaces every match and reports count and lines", async () => {
    await fs.writeFile(file("r.txt"), "foo\nbar foo\n");
    expect(await run({ kind: "replace", path: file("r.txt"), search: "foo", replacement: "baz", dryRun: false })).toBe(
      EXIT.OK,
    );
    expect(await read("r.txt")).toBe("baz\nbar baz\n");
    expect(err.join("\n")).toContain("Replaced 2");
    expect(err.join("\n")).toContain("Lines: 1, 2");
  });

  test("--dry-run reports without writing", async () => {
    await fs.writeFile(file("r.txt"), "foo foo");
    expect(await run({ kind: "replace", path: file("r.txt"), search: "foo", replacement: "x", dryRun: true })).toBe(EXIT.OK);
    expect(await read("r.txt")).toBe("foo foo");
    expect(err.join("\n")).toContain("2 matches; nothing written");
  });

  test("no matches exits 1 without writing", async () => {
    await fs.writeFile(file("r.txt"), "abc");
    const before = (await fs.stat(file("r.txt"))).mtimeMs;
    expect(await run({ kind: "replace", path: file("r.txt"), search: "zzz", replacement: "x", dryRun: false })).toBe(
      EXIT.GENERAL,
    );
    expect((await fs.stat(file("r.txt"))).mtimeMs).toBe(before);
  });

  test("a newline in the search text matches CRLF line breaks", async () => {
    await fs.writeFile(file("crlf.txt"), "a\r\nb\r\n");
    await run({ kind: "replace", path: file("crlf.txt"), search: "a\nb", replacement: "ab", dryRun: false });
    expect(await read("crlf.txt")).toBe("ab\r\n");
  });
});
