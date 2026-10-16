import { ceilBoundary, cellWidth, nextBoundary, offsetAtCell, prevBoundary } from "../utils/unicode.ts";

/** `col` is a UTF-16 offset into the line that always sits on a grapheme boundary. */
export interface Position {
  line: number;
  col: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface EditorState {
  readonly lines: readonly string[];
  readonly cursor: Position;
  /** Other end of the selection; null when nothing is selected. */
  readonly anchor: Position | null;
  /** Cell column that vertical movement tries to return to; null until the first up/down move. */
  readonly goalX: number | null;
  readonly savedText: string;
}

export function createState(text = ""): EditorState {
  const lines = splitLines(text);
  // Compare against the normalized text so CRLF files are not dirty on load.
  return { lines, cursor: { line: 0, col: 0 }, anchor: null, goalX: null, savedText: lines.join("\n") };
}

/** Records `text` (from getText at save time) as the on-disk version. */
export function markSaved(state: EditorState, text: string): EditorState {
  return { ...state, savedText: text };
}

function splitLines(text: string): string[] {
  return text.replace(/\r\n?/g, "\n").split("\n");
}

export function getText(state: EditorState): string {
  return state.lines.join("\n");
}

export function isDirty(state: EditorState): boolean {
  return getText(state) !== state.savedText;
}

function currentLine(state: EditorState): string {
  return state.lines[state.cursor.line]!;
}

/** Cell column of the cursor within its line. */
export function cursorX(state: EditorState): number {
  return cellWidth(currentLine(state).slice(0, state.cursor.col));
}

export function comparePositions(a: Position, b: Position): number {
  return a.line - b.line || a.col - b.col;
}

/** The selection in document order, or null when empty. */
export function selectionRange(state: EditorState): Range | null {
  const { anchor, cursor } = state;
  if (!anchor || comparePositions(anchor, cursor) === 0) return null;
  return comparePositions(anchor, cursor) < 0 ? { start: anchor, end: cursor } : { start: cursor, end: anchor };
}

export function rangeText(state: EditorState, { start, end }: Range): string {
  if (start.line === end.line) return state.lines[start.line]!.slice(start.col, end.col);
  const middle = state.lines.slice(start.line + 1, end.line);
  return [state.lines[start.line]!.slice(start.col), ...middle, state.lines[end.line]!.slice(0, end.col)].join("\n");
}

export function selectedText(state: EditorState): string | null {
  const range = selectionRange(state);
  return range ? rangeText(state, range) : null;
}

/** Replaces `range` with `text`, leaving the cursor after the inserted text and no selection. */
export function replaceRange(state: EditorState, { start, end }: Range, text: string): EditorState {
  const before = state.lines[start.line]!.slice(0, start.col);
  const after = state.lines[end.line]!.slice(end.col);
  const inserted = splitLines(text);

  const newLines = [...inserted];
  newLines[0] = before + newLines[0];
  const lastIndex = newLines.length - 1;
  const cursorCol = newLines[lastIndex]!.length;
  newLines[lastIndex] += after;

  const lines = [...state.lines.slice(0, start.line), ...newLines, ...state.lines.slice(end.line + 1)];
  // Inserted text can merge with what follows (e.g. a consonant before a vowel sign); keep the cursor on a boundary.
  const line = start.line + lastIndex;
  const cursor = { line, col: ceilBoundary(lines[line]!, cursorCol) };
  return { ...state, lines, cursor, anchor: null, goalX: null };
}

export function insertText(state: EditorState, text: string): EditorState {
  const range = selectionRange(state) ?? { start: state.cursor, end: state.cursor };
  if (!text && range.start === range.end) return state;
  return replaceRange(state, range, text);
}

export function backspace(state: EditorState): EditorState {
  const selection = selectionRange(state);
  if (selection) return replaceRange(state, selection, "");

  const { line, col } = state.cursor;
  if (col > 0) return replaceRange(state, { start: { line, col: prevBoundary(currentLine(state), col) }, end: state.cursor }, "");
  if (line === 0) return state;
  return replaceRange(state, { start: { line: line - 1, col: state.lines[line - 1]!.length }, end: state.cursor }, "");
}

export function deleteForward(state: EditorState): EditorState {
  const selection = selectionRange(state);
  if (selection) return replaceRange(state, selection, "");

  const { line, col } = state.cursor;
  const current = currentLine(state);
  if (col < current.length) return replaceRange(state, { start: state.cursor, end: { line, col: nextBoundary(current, col) } }, "");
  if (line === state.lines.length - 1) return state;
  return replaceRange(state, { start: state.cursor, end: { line: line + 1, col: 0 } }, "");
}

/** Moves the cursor; with `extend` the selection grows from its anchor, otherwise it is cleared. */
export function moveTo(state: EditorState, cursor: Position, extend = false, goalX: number | null = null): EditorState {
  const anchor = extend ? (state.anchor ?? state.cursor) : null;
  return { ...state, cursor, anchor, goalX };
}

/** Selects `range`, with the cursor at its end. */
export function select(state: EditorState, { start, end }: Range): EditorState {
  return { ...state, anchor: start, cursor: end, goalX: null };
}

export function selectAll(state: EditorState): EditorState {
  const last = state.lines.length - 1;
  return select(state, { start: { line: 0, col: 0 }, end: { line: last, col: state.lines[last]!.length } });
}

export function moveLeft(state: EditorState, extend = false): EditorState {
  const selection = selectionRange(state);
  if (selection && !extend) return moveTo(state, selection.start);
  const { line, col } = state.cursor;
  if (col > 0) return moveTo(state, { line, col: prevBoundary(currentLine(state), col) }, extend);
  if (line > 0) return moveTo(state, { line: line - 1, col: state.lines[line - 1]!.length }, extend);
  return moveTo(state, state.cursor, extend);
}

export function moveRight(state: EditorState, extend = false): EditorState {
  const selection = selectionRange(state);
  if (selection && !extend) return moveTo(state, selection.end);
  const { line, col } = state.cursor;
  const current = currentLine(state);
  if (col < current.length) return moveTo(state, { line, col: nextBoundary(current, col) }, extend);
  if (line < state.lines.length - 1) return moveTo(state, { line: line + 1, col: 0 }, extend);
  return moveTo(state, state.cursor, extend);
}

/** Moves the cursor `delta` lines, keeping its visual column where possible. */
export function moveVertical(state: EditorState, delta: number, extend = false): EditorState {
  const goalX = state.goalX ?? cursorX(state);
  const target = Math.max(0, Math.min(state.lines.length - 1, state.cursor.line + delta));

  if (target === state.cursor.line) {
    // Already at the first/last line: jump to its start/end, like most editors.
    const col = delta < 0 ? 0 : currentLine(state).length;
    return moveTo(state, { line: target, col }, extend);
  }
  return moveTo(state, { line: target, col: offsetAtCell(state.lines[target]!, goalX) }, extend, goalX);
}

export function moveHome(state: EditorState, extend = false): EditorState {
  return moveTo(state, { line: state.cursor.line, col: 0 }, extend);
}

export function moveEnd(state: EditorState, extend = false): EditorState {
  return moveTo(state, { line: state.cursor.line, col: currentLine(state).length }, extend);
}

/** Moves to the start of a 0-based line, clamped to the buffer. */
export function gotoLine(state: EditorState, line: number): EditorState {
  return moveTo(state, { line: Math.max(0, Math.min(state.lines.length - 1, line)), col: 0 });
}
