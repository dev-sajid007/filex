import { createHash, randomBytes } from "node:crypto";
import { constants, type Stats } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { errnoOf, FileError, toFileError } from "./errors.ts";

export const MAX_FILE_SIZE = 16 * 1024 * 1024;
const BINARY_SNIFF_BYTES = 8192;
const BOM = "﻿";

export interface FileMeta {
  eol: "\n" | "\r\n";
  bom: boolean;
}

/** What the file looked like on disk when we last read or wrote it. */
export interface FileStamp {
  mtimeMs: number;
  size: number;
}

export interface LoadedFile {
  path: string;
  text: string;
  meta: FileMeta;
  /** null when the file does not exist yet. */
  stamp: FileStamp | null;
  readOnly: boolean;
}

export interface SaveOptions {
  /** Stamp from the last load/save; null means we expect no file to exist. */
  expected: FileStamp | null;
  /** Overwrite even if the file changed on disk. */
  force?: boolean;
}

export type BackupResult = { path: string } | { error: FileError } | null;

export interface SaveResult {
  path: string;
  stamp: FileStamp;
  backup: BackupResult;
}

export interface FileEngine {
  load(target: string): Promise<LoadedFile>;
  save(target: string, text: string, meta: FileMeta, options: SaveOptions): Promise<SaveResult>;
}

export interface FileEngineOptions {
  /** Directory for backups, or null to disable them. */
  backupDir: string | null;
  /** Backups kept per file. */
  backupRetention?: number;
}

export const DEFAULT_META: FileMeta = { eol: "\n", bom: false };

const stampOf = (stats: Stats): FileStamp => ({ mtimeMs: stats.mtimeMs, size: stats.size });

async function statOrNull(target: string): Promise<Stats | null> {
  try {
    return await fs.stat(target);
  } catch (error) {
    if (errnoOf(error) === "ENOENT") return null;
    throw toFileError(error, target);
  }
}

function detectEol(text: string): FileMeta["eol"] {
  const crlf = text.match(/\r\n/g)?.length ?? 0;
  const lf = (text.match(/\n/g)?.length ?? 0) - crlf;
  return crlf > lf ? "\r\n" : "\n";
}

export function encodeText(text: string, meta: FileMeta): Uint8Array {
  const body = meta.eol === "\n" ? text : text.replace(/\n/g, meta.eol);
  return new TextEncoder().encode(meta.bom ? BOM + body : body);
}

export async function loadFile(target: string): Promise<LoadedFile> {
  const absolute = path.resolve(target);
  const stats = await statOrNull(absolute);

  if (!stats) {
    const parent = await statOrNull(path.dirname(absolute));
    if (!parent?.isDirectory()) throw new FileError("PARENT_MISSING", absolute);
    return { path: absolute, text: "", meta: DEFAULT_META, stamp: null, readOnly: false };
  }
  if (stats.isDirectory()) throw new FileError("IS_DIRECTORY", absolute);
  if (!stats.isFile()) throw new FileError("NOT_A_FILE", absolute);
  if (stats.size > MAX_FILE_SIZE) throw new FileError("TOO_LARGE", absolute);

  let bytes: Uint8Array;
  try {
    bytes = await fs.readFile(absolute);
  } catch (error) {
    throw toFileError(error, absolute);
  }
  if (bytes.subarray(0, BINARY_SNIFF_BYTES).includes(0)) throw new FileError("BINARY", absolute);

  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch (error) {
    throw new FileError("INVALID_ENCODING", absolute, { cause: error });
  }

  const bom = decoded.startsWith(BOM);
  const text = bom ? decoded.slice(1) : decoded;
  const readOnly = await fs.access(absolute, constants.W_OK).then(
    () => false,
    () => true,
  );
  return { path: absolute, text, meta: { eol: detectEol(text), bom }, stamp: stampOf(stats), readOnly };
}

/** Follows symlinks so saving rewrites the link's target instead of replacing the link. */
async function resolveSaveTarget(absolute: string): Promise<string> {
  try {
    return await fs.realpath(absolute);
  } catch (error) {
    if (errnoOf(error) !== "ENOENT") throw toFileError(error, absolute);
  }
  const parent = await statOrNull(path.dirname(absolute));
  if (!parent?.isDirectory()) throw new FileError("PARENT_MISSING", absolute);
  return absolute;
}

function changedOnDisk(existing: Stats | null, expected: FileStamp | null): boolean {
  if (!existing || !expected) return existing !== null || expected !== null;
  return existing.mtimeMs !== expected.mtimeMs || existing.size !== expected.size;
}

/**
 * A rename would break other hard links or hand ownership of someone else's file to us,
 * so those files are rewritten in place instead.
 */
function mustWriteInPlace(existing: Stats): boolean {
  const uid = process.getuid?.();
  return existing.nlink > 1 || (uid !== undefined && existing.uid !== uid);
}

async function writeAtomic(target: string, data: Uint8Array, existing: Stats | null): Promise<void> {
  const dir = path.dirname(target);
  const temp = path.join(dir, `.${path.basename(target)}.filex-${randomBytes(6).toString("hex")}.tmp`);
  let handle: fs.FileHandle | undefined;
  try {
    handle = await fs.open(temp, "wx", 0o600);
    await handle.writeFile(data);
    await handle.sync();
    await handle.close();
    handle = undefined;
    // The temp file was created 0600; give it the original's mode (or the umask default for new files).
    const mode = existing ? existing.mode & 0o7777 : 0o666 & ~process.umask();
    await fs.chmod(temp, mode);
    await fs.rename(temp, target);
  } catch (error) {
    await handle?.close().catch(() => {});
    await fs.unlink(temp).catch(() => {});
    throw error;
  }
  // Persist the rename itself; not supported on every platform, so best effort.
  await fs
    .open(dir, "r")
    .then(async (d) => {
      await d.sync().catch(() => {});
      await d.close();
    })
    .catch(() => {});
}

async function writeInPlace(target: string, data: Uint8Array): Promise<void> {
  const handle = await fs.open(target, "r+");
  try {
    await handle.truncate(0);
    await handle.write(data, 0, data.length, 0);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function timestamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(".", "-").replace("Z", "");
}

export function createFileEngine({ backupDir, backupRetention = 5 }: FileEngineOptions): FileEngine {
  /** Files already backed up this session; only the version from before our first save is kept. */
  const backedUp = new Set<string>();

  async function backup(target: string): Promise<BackupResult> {
    if (!backupDir || backedUp.has(target)) return null;
    const dir = path.join(backupDir, createHash("sha256").update(target).digest("hex").slice(0, 16));
    const dest = path.join(dir, `${timestamp()}-${path.basename(target)}`);
    try {
      await fs.mkdir(dir, { recursive: true, mode: 0o700 });
      await fs.copyFile(target, dest, constants.COPYFILE_EXCL);
      // Backups may hold secrets; never leave them more readable than the owner.
      await fs.chmod(dest, 0o600);
      const entries = (await fs.readdir(dir)).sort();
      for (const old of entries.slice(0, Math.max(0, entries.length - backupRetention))) {
        await fs.unlink(path.join(dir, old)).catch(() => {});
      }
      backedUp.add(target);
      return { path: dest };
    } catch (error) {
      return { error: toFileError(error, dest) };
    }
  }

  async function save(target: string, text: string, meta: FileMeta, options: SaveOptions): Promise<SaveResult> {
    const absolute = path.resolve(target);
    const real = await resolveSaveTarget(absolute);
    const existing = await statOrNull(real);

    if (existing?.isDirectory()) throw new FileError("IS_DIRECTORY", absolute);
    if (existing && !existing.isFile()) throw new FileError("NOT_A_FILE", absolute);
    if (!options.force && changedOnDisk(existing, options.expected)) throw new FileError("CONFLICT", absolute);

    const data = encodeText(text, meta);
    const backupResult = existing ? await backup(real) : null;

    try {
      if (existing && mustWriteInPlace(existing)) {
        await writeInPlace(real, data);
      } else {
        try {
          await writeAtomic(real, data, existing);
        } catch (error) {
          // A writable file in a directory we cannot create files in (e.g. a shared config dir).
          if (!existing || errnoOf(error) !== "EACCES") throw error;
          await writeInPlace(real, data);
        }
      }
    } catch (error) {
      throw toFileError(error, absolute);
    }

    const stats = await fs.stat(real);
    return { path: absolute, stamp: stampOf(stats), backup: backupResult };
  }

  return { load: loadFile, save };
}
