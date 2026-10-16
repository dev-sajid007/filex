import type { FileErrorCode } from "../core/errors.ts";

export const EXIT = {
  OK: 0,
  /** General error; also "no matches" for `replace`. */
  GENERAL: 1,
  INVALID_ARGS: 2,
  FILE: 3,
  PERMISSION: 4,
  WRITE: 5,
  NO_TTY: 6,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

/** Exit code for a failure while reading/validating a file. */
export function loadExitCode(code: FileErrorCode): ExitCode {
  return code === "PERMISSION" ? EXIT.PERMISSION : EXIT.FILE;
}

/** Exit code for a failure while writing a file. */
export function saveExitCode(code: FileErrorCode): ExitCode {
  switch (code) {
    case "PERMISSION":
    case "READ_ONLY_FS":
      return EXIT.PERMISSION;
    case "PARENT_MISSING":
    case "IS_DIRECTORY":
    case "NOT_A_FILE":
      return EXIT.FILE;
    default:
      return EXIT.WRITE;
  }
}
