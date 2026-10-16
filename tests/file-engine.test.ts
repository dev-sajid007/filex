import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileError } from "../src/core/errors.ts";
import { createFileEngine, DEFAULT_META, type FileEngine, loadFile, MAX_FILE_SIZE } from "../src/core/file-engine.ts";

let dir: string;
let backupDir: string;
let engine: FileEngine;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(tmpdir(), "filex-test-"));
  backupDir = path.join(dir, ".backups");
  engine = createFileEngine({ backupDir, backupRetention: 2 });
});

afterEach(async () => {
  await fs.chmod(dir, 0o700).catch(() => {});
  await fs.rm(dir, { recursive: true, force: true });
});

const file = (name: string) => path.join(dir, name);

async function expectFileError(promise: Promise<unknown>, code: string) {
  const error = await promise.then(
    () => null,
    (e) => e,
  );
  expect(error).toBeInstanceOf(FileError);
  expect((error as FileError).code).toBe(code as FileError["code"]);
}

const isRoot = process.getuid?.() === 0;

describe("load", () => {
  test("reads UTF-8 Bangla text", async () => {
    await fs.writeFile(file("a.txt"), "হ্যালো বিশ্ব\n");
    const loaded = await loadFile(file("a.txt"));
    expect(loaded.text).toBe("হ্যালো বিশ্ব\n");
    expect(loaded.meta).toEqual({ eol: "\n", bom: false });
    expect(loaded.stamp).not.toBeNull();
    expect(loaded.readOnly).toBe(false);
  });

  test("strips and remembers a BOM", async () => {
    await fs.writeFile(file("bom.txt"), "﻿abc");
    const loaded = await loadFile(file("bom.txt"));
    expect(loaded.text).toBe("abc");
    expect(loaded.meta.bom).toBe(true);
  });

  test("detects CRLF line endings", async () => {
    await fs.writeFile(file("crlf.txt"), "a\r\nb\r\n");
    expect((await loadFile(file("crlf.txt"))).meta.eol).toBe("\r\n");
  });

  test("a missing file in an existing directory loads as new", async () => {
    const loaded = await loadFile(file("new.txt"));
    expect(loaded).toMatchObject({ text: "", stamp: null, path: file("new.txt") });
  });

  test("rejects a missing parent directory", async () => {
    await expectFileError(loadFile(file("nope/new.txt")), "PARENT_MISSING");
  });

  test("rejects directories", async () => {
    await expectFileError(loadFile(dir), "IS_DIRECTORY");
  });

  test("rejects binary files", async () => {
    await fs.writeFile(file("bin"), new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0, 1, 2]));
    await expectFileError(loadFile(file("bin")), "BINARY");
  });

  test("rejects invalid UTF-8", async () => {
    await fs.writeFile(file("latin1.txt"), new Uint8Array([0x63, 0x61, 0x66, 0xe9]));
    await expectFileError(loadFile(file("latin1.txt")), "INVALID_ENCODING");
  });

  test("rejects files over the size limit", async () => {
    const handle = await fs.open(file("big.txt"), "w");
    await handle.truncate(MAX_FILE_SIZE + 1);
    await handle.close();
    await expectFileError(loadFile(file("big.txt")), "TOO_LARGE");
  });

  test.skipIf(isRoot)("flags read-only files", async () => {
    await fs.writeFile(file("ro.txt"), "x");
    await fs.chmod(file("ro.txt"), 0o444);
    expect((await loadFile(file("ro.txt"))).readOnly).toBe(true);
  });

  test.skipIf(isRoot)("maps unreadable files to PERMISSION", async () => {
    await fs.writeFile(file("secret.txt"), "x");
    await fs.chmod(file("secret.txt"), 0o000);
    await expectFileError(loadFile(file("secret.txt")), "PERMISSION");
  });
});

describe("save", () => {
  test("creates a new file and leaves no temp files behind", async () => {
    const result = await engine.save(file("new.txt"), "নতুন\n", DEFAULT_META, { expected: null });
    expect(await fs.readFile(file("new.txt"), "utf8")).toBe("নতুন\n");
    expect(result.backup).toBeNull();
    expect((await fs.readdir(dir)).filter((n) => n.endsWith(".tmp"))).toEqual([]);
  });

  test("round-trips Bangla, CRLF and BOM", async () => {
    const original = "﻿ক্ষ\r\nকি\r\n";
    await fs.writeFile(file("rt.txt"), original);
    const loaded = await loadFile(file("rt.txt"));
    const normalized = loaded.text.replace(/\r\n/g, "\n");
    await engine.save(loaded.path, normalized, loaded.meta, { expected: loaded.stamp });
    expect(await fs.readFile(file("rt.txt"), "utf8")).toBe(original);
  });

  test("preserves the file mode", async () => {
    await fs.writeFile(file("script.sh"), "echo hi\n");
    await fs.chmod(file("script.sh"), 0o750);
    const loaded = await loadFile(file("script.sh"));
    await engine.save(loaded.path, "echo bye\n", loaded.meta, { expected: loaded.stamp });
    expect((await fs.stat(file("script.sh"))).mode & 0o777).toBe(0o750);
  });

  test("writes through a symlink without replacing it", async () => {
    await fs.writeFile(file("target.txt"), "old");
    await fs.symlink(file("target.txt"), file("link.txt"));
    const loaded = await loadFile(file("link.txt"));
    await engine.save(loaded.path, "new", loaded.meta, { expected: loaded.stamp });
    expect((await fs.lstat(file("link.txt"))).isSymbolicLink()).toBe(true);
    expect(await fs.readFile(file("target.txt"), "utf8")).toBe("new");
  });

  test("keeps hard links in sync by writing in place", async () => {
    await fs.writeFile(file("a.txt"), "old");
    await fs.link(file("a.txt"), file("b.txt"));
    const loaded = await loadFile(file("a.txt"));
    await engine.save(loaded.path, "new", loaded.meta, { expected: loaded.stamp });
    expect(await fs.readFile(file("b.txt"), "utf8")).toBe("new");
  });

  test("detects external modification, and force overrides it", async () => {
    await fs.writeFile(file("c.txt"), "v1");
    const loaded = await loadFile(file("c.txt"));
    await fs.writeFile(file("c.txt"), "changed elsewhere");

    await expectFileError(engine.save(loaded.path, "mine", loaded.meta, { expected: loaded.stamp }), "CONFLICT");
    expect(await fs.readFile(file("c.txt"), "utf8")).toBe("changed elsewhere");

    await engine.save(loaded.path, "mine", loaded.meta, { expected: loaded.stamp, force: true });
    expect(await fs.readFile(file("c.txt"), "utf8")).toBe("mine");
  });

  test("treats a file appearing at a new-file path as a conflict", async () => {
    await fs.writeFile(file("exists.txt"), "x");
    await expectFileError(engine.save(file("exists.txt"), "y", DEFAULT_META, { expected: null }), "CONFLICT");
  });

  test("successive saves use the returned stamp", async () => {
    const first = await engine.save(file("s.txt"), "1", DEFAULT_META, { expected: null });
    const second = await engine.save(file("s.txt"), "22", DEFAULT_META, { expected: first.stamp });
    await engine.save(file("s.txt"), "333", DEFAULT_META, { expected: second.stamp });
    expect(await fs.readFile(file("s.txt"), "utf8")).toBe("333");
  });

  test("refuses to overwrite a directory", async () => {
    await fs.mkdir(file("sub"));
    await expectFileError(engine.save(file("sub"), "x", DEFAULT_META, { expected: null, force: true }), "IS_DIRECTORY");
  });

  test("rejects a missing parent directory", async () => {
    await expectFileError(engine.save(file("no/such/x.txt"), "x", DEFAULT_META, { expected: null }), "PARENT_MISSING");
  });

  test.skipIf(isRoot)("permission failure leaves the original intact", async () => {
    await fs.writeFile(file("locked.txt"), "original");
    await fs.chmod(file("locked.txt"), 0o444);
    await fs.chmod(dir, 0o500);
    const loaded = await loadFile(file("locked.txt"));
    await expectFileError(engine.save(loaded.path, "new", loaded.meta, { expected: loaded.stamp }), "PERMISSION");
    await fs.chmod(dir, 0o700);
    expect(await fs.readFile(file("locked.txt"), "utf8")).toBe("original");
  });

  test.skipIf(isRoot)("writable file in a read-only directory is saved in place", async () => {
    await fs.writeFile(file("shared.conf"), "a=1");
    await fs.chmod(dir, 0o500);
    const loaded = await loadFile(file("shared.conf"));
    const noBackup = createFileEngine({ backupDir: null });
    await noBackup.save(loaded.path, "a=2", loaded.meta, { expected: loaded.stamp });
    await fs.chmod(dir, 0o700);
    expect(await fs.readFile(file("shared.conf"), "utf8")).toBe("a=2");
  });
});

describe("backup", () => {
  async function backups() {
    const subdirs = await fs.readdir(backupDir).catch(() => [] as string[]);
    const all: string[] = [];
    for (const sub of subdirs) {
      for (const name of await fs.readdir(path.join(backupDir, sub))) all.push(path.join(backupDir, sub, name));
    }
    return all;
  }

  test("backs up the original once per session with private permissions", async () => {
    await fs.writeFile(file("b.txt"), "original");
    const loaded = await loadFile(file("b.txt"));
    const first = await engine.save(loaded.path, "v2", loaded.meta, { expected: loaded.stamp });
    await engine.save(loaded.path, "v3", loaded.meta, { expected: first.stamp });

    const list = await backups();
    expect(list).toHaveLength(1);
    expect(await fs.readFile(list[0]!, "utf8")).toBe("original");
    expect((await fs.stat(list[0]!)).mode & 0o777).toBe(0o600);
    expect(first.backup).toEqual({ path: list[0]! });
  });

  test("keeps at most `backupRetention` backups per file", async () => {
    await fs.writeFile(file("r.txt"), "0");
    for (let i = 1; i <= 4; i++) {
      const sessionEngine = createFileEngine({ backupDir, backupRetention: 2 });
      const loaded = await loadFile(file("r.txt"));
      await sessionEngine.save(loaded.path, String(i), loaded.meta, { expected: loaded.stamp });
      await Bun.sleep(2); // distinct timestamps
    }
    const contents = await Promise.all((await backups()).map((p) => fs.readFile(p, "utf8")));
    expect(contents.sort()).toEqual(["2", "3"]);
  });

  test("a failed backup is reported but the save still happens", async () => {
    await fs.writeFile(backupDir, "not a directory");
    await fs.writeFile(file("f.txt"), "old");
    const loaded = await loadFile(file("f.txt"));
    const result = await engine.save(loaded.path, "new", loaded.meta, { expected: loaded.stamp });
    expect(result.backup && "error" in result.backup).toBe(true);
    expect(await fs.readFile(file("f.txt"), "utf8")).toBe("new");
  });

  test("disabled backups create nothing", async () => {
    const noBackup = createFileEngine({ backupDir: null });
    await fs.writeFile(file("n.txt"), "old");
    const loaded = await loadFile(file("n.txt"));
    const result = await noBackup.save(loaded.path, "new", loaded.meta, { expected: loaded.stamp });
    expect(result.backup).toBeNull();
    expect(await backups()).toEqual([]);
  });
});
