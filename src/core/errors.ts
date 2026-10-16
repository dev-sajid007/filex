export type FileErrorCode =
  | "IS_DIRECTORY"
  | "NOT_A_FILE"
  | "PERMISSION"
  | "BINARY"
  | "INVALID_ENCODING"
  | "TOO_LARGE"
  | "CONFLICT"
  | "PARENT_MISSING"
  | "NO_SPACE"
  | "READ_ONLY_FS"
  | "IO";

export class FileError extends Error {
  constructor(
    readonly code: FileErrorCode,
    readonly path: string,
    options?: { cause?: unknown },
  ) {
    super(`${code}: ${path}`, options);
    this.name = "FileError";
  }
}

const errnoCodes: Record<string, FileErrorCode> = {
  EACCES: "PERMISSION",
  EPERM: "PERMISSION",
  EISDIR: "IS_DIRECTORY",
  ENOTDIR: "PARENT_MISSING",
  ENOENT: "PARENT_MISSING",
  ENOSPC: "NO_SPACE",
  EDQUOT: "NO_SPACE",
  EROFS: "READ_ONLY_FS",
};

/** Wraps a Node filesystem error (or passes a FileError through). */
export function toFileError(error: unknown, path: string): FileError {
  if (error instanceof FileError) return error;
  const errno = (error as NodeJS.ErrnoException | undefined)?.code;
  return new FileError((errno && errnoCodes[errno]) || "IO", path, { cause: error });
}

export function errnoOf(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException | undefined)?.code;
}
