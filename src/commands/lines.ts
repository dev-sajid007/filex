/**
 * Line-level edits used by `append` and `insert`. They work on LF-normalized text and keep
 * the file's final-newline convention: a file that ended with a newline still does, one that
 * did not still does not. An empty file gains a final newline (it has no convention yet).
 */

interface LineView {
  lines: string[];
  finalNewline: boolean;
}

function toLines(text: string): LineView {
  if (text === "") return { lines: [], finalNewline: true };
  const finalNewline = text.endsWith("\n");
  const lines = (finalNewline ? text.slice(0, -1) : text).split("\n");
  return { lines, finalNewline };
}

function fromLines({ lines, finalNewline }: LineView): string {
  const body = lines.join("\n");
  return finalNewline && lines.length > 0 ? body + "\n" : body;
}

export function lineCount(text: string): number {
  return toLines(text).lines.length;
}

/** Inserts `newText` (which may span lines) so that it starts at 1-based `line`. */
export function insertLines(text: string, line: number, newText: string): string {
  const view = toLines(text);
  if (line < 1 || line > view.lines.length + 1) throw new RangeError(`line ${line} out of range`);
  const lines = [...view.lines];
  lines.splice(line - 1, 0, ...newText.split("\n"));
  return fromLines({ ...view, lines });
}

export function appendLines(text: string, newText: string): string {
  return insertLines(text, lineCount(text) + 1, newText);
}

/** Replaces every occurrence; `search` may span lines. */
export function replaceText(text: string, search: string, replacement: string): { text: string; count: number; lines: number[] } {
  const parts = text.split(search);
  const newlines = (s: string) => s.split("\n").length - 1;
  const searchNewlines = newlines(search);
  const lines: number[] = [];
  let lineNo = 1;
  for (let i = 0; i < parts.length - 1; i++) {
    lineNo += newlines(parts[i]!);
    if (lines.at(-1) !== lineNo) lines.push(lineNo);
    lineNo += searchNewlines;
  }
  return { text: parts.join(replacement), count: parts.length - 1, lines };
}
