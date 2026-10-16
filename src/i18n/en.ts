import type { Messages } from "./index.ts";

export const en: Messages = {
  appName: "FileX",
  fileLabel: "File",
  noFile: "Untitled",
  modified: "Modified",
  newFile: "New file",
  readOnly: "Read-only",
  line: "Ln",
  column: "Col",
  notImplemented: "not available yet",
  terminalTooSmall: "Terminal too small",
  minimumSize: "Minimum",
  invalidLang: "Unknown language",
  supportedLangs: "Supported languages",
  unknownOption: "Unknown option",
  tooManyPaths: "More than one path given",
  usage: "Usage: filex [--lang bn|en] [path]",
  missingArgs: "Missing arguments",
  tooManyArgs: "Too many arguments",
  emptySearch: "Search text cannot be empty",
  lineRange: "Line number must be between 1 and {max}",
  fileExists: "File already exists (use --force to overwrite)",
  fileNotFound: "File not found",
  createHint: "Hint: check the path or use `filex create {path}`.",
  created: "Created: {path}",
  appended: "Appended: {path}",
  inserted: "Inserted at line {line}: {path}",
  replacedIn: "Replaced {n}: {path}",
  dryRun: "{n} matches; nothing written (--dry-run)",
  matchLines: "Lines: {lines}",
  noTty: "The interactive editor needs a terminal.",
  noTtyHint: "To print a file: filex read <path> · Help: filex --help",
  cliHelp: `FileX — a Bangla-first terminal file editor

Usage:
  filex [options] [path]             Open the editor (new file if path is missing)
  filex edit <path>                  Same as above
  filex read <path>                  Print the file to stdout
  filex create <path> [--force]      Create an empty file
  filex append <path> <text>         Add a line at the end
  filex insert <path> <line> <text>  Insert a line at a 1-based line number
  filex replace <path> <old> <new> [--dry-run]
                                     Replace every occurrence

Options:
  --lang bn|en     UI language (or the FILEX_LANG environment variable)
  -h, --help       Show this help
  -v, --version    Show the version
  --               Treat everything after as paths/text

Press F1 inside the editor for all keyboard shortcuts.

Exit codes: 0 ok · 1 no matches · 2 bad arguments · 3 file/path error
            4 permission denied · 5 write failed · 6 no terminal`,

  saving: "Saving…",
  saved: "Saved",
  backupFailed: "backup could not be created",
  saveFailed: "Could not save file",
  changesKept: "Your changes are still in the editor.",
  openFailed: "Could not open file",
  opened: "Opened",
  emptyPath: "No path given",
  saveElsewhere: "Save to a different path",
  noMatches: "No matches found",
  replacedCount: "Replaced {n}",
  matchCount: "{n} matches",
  invalidLine: "Invalid line number",
  nothingSelected: "Nothing selected",
  copied: "Copied",
  clipboardEmpty: "Clipboard is empty",
  nothingToUndo: "Nothing to undo",
  nothingToRedo: "Nothing to redo",

  "prompt.open": "Open file",
  "prompt.saveAs": "Save as",
  "prompt.unsaved": "You have unsaved changes. Save them?",
  "prompt.conflict": "The file changed on disk. Overwrite anyway?",
  "prompt.exists": "The file already exists. Overwrite?",
  "prompt.yesNoCancel": "y yes · n no · Esc cancel",
  "prompt.yesNo": "y yes · n no",
  "prompt.find": "Find",
  "prompt.replaceFind": "Replace",
  "prompt.replaceWith": "Replace with",
  "prompt.gotoLine": "Go to line",
  "prompt.replace": "Replace this match?",
  "prompt.replaceChoices": "y yes · n skip · a all · Esc stop",

  "help.title": "Keyboard shortcuts",
  "help.close": "Press any key to close",
  "help.move": "Move cursor",
  "help.lineEdges": "Line start / end",
  "help.page": "Page up / down",
  "help.select": "Select",

  "error.IS_DIRECTORY": "Is a directory",
  "error.NOT_A_FILE": "Not a regular file",
  "error.PERMISSION": "Permission denied",
  "error.BINARY": "Binary files cannot be edited",
  "error.INVALID_ENCODING": "Not valid UTF-8",
  "error.TOO_LARGE": "File too large (max 16 MB)",
  "error.CONFLICT": "File changed on disk",
  "error.PARENT_MISSING": "Directory not found",
  "error.NO_SPACE": "No space left on disk",
  "error.READ_ONLY_FS": "Read-only filesystem",
  "error.IO": "Input/output error",

  "command.save": "Save",
  "command.open": "Open",
  "command.find": "Find",
  "command.replace": "Replace",
  "command.undo": "Undo",
  "command.redo": "Redo",
  "command.selectAll": "Select all",
  "command.gotoLine": "Go to line",
  "command.copy": "Copy",
  "command.cut": "Cut",
  "command.paste": "Paste",
  "command.help": "Help",
  "command.quit": "Quit",
  "command.cancel": "Cancel",
};
