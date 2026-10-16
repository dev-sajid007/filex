import { ceilBoundary, floorBoundary } from "../utils/unicode.ts";
import { comparePositions, type EditorState, type Position, type Range, replaceRange } from "./editor-buffer.ts";

/** A match within one line, as raw UTF-16 offsets. */
export interface Match {
  line: number;
  start: number;
  end: number;
}

/** Case-sensitive, non-overlapping matches. An empty query matches nothing. */
export function findMatches(lines: readonly string[], query: string): Match[] {
  if (!query) return [];
  const matches: Match[] = [];
  lines.forEach((text, line) => {
    for (let at = text.indexOf(query); at !== -1; at = text.indexOf(query, at + query.length)) {
      matches.push({ line, start: at, end: at + query.length });
    }
  });
  return matches;
}

/**
 * The match as a selectable range, widened to grapheme boundaries. Searching "কর" in "করা"
 * matches part of the grapheme "রা"; the selection covers the whole grapheme so the cursor
 * never sits inside one.
 */
export function matchRange(lines: readonly string[], { line, start, end }: Match): Range {
  const text = lines[line]!;
  return { start: { line, col: floorBoundary(text, start) }, end: { line, col: ceilBoundary(text, end) } };
}

const startOf = (m: Match): Position => ({ line: m.line, col: m.start });

/** Index of the first match starting at/after `from` (or strictly after, if not inclusive), wrapping around. */
export function nextMatchIndex(matches: Match[], from: Position, inclusive: boolean): number {
  if (matches.length === 0) return -1;
  const index = matches.findIndex((m) => {
    const cmp = comparePositions(startOf(m), from);
    return inclusive ? cmp >= 0 : cmp > 0;
  });
  return index === -1 ? 0 : index;
}

/** Index of the last match starting before `from`, wrapping around. */
export function prevMatchIndex(matches: Match[], from: Position): number {
  if (matches.length === 0) return -1;
  for (let i = matches.length - 1; i >= 0; i--) {
    if (comparePositions(startOf(matches[i]!), from) < 0) return i;
  }
  return matches.length - 1;
}

/** Replaces one match. The cursor ends after the replacement. */
export function replaceMatch(state: EditorState, match: Match, replacement: string): EditorState {
  return replaceRange(
    state,
    { start: { line: match.line, col: match.start }, end: { line: match.line, col: match.end } },
    replacement,
  );
}

/** Replaces every match, last first so earlier offsets stay valid. */
export function replaceAll(state: EditorState, query: string, replacement: string): { state: EditorState; count: number } {
  const matches = findMatches(state.lines, query);
  const cursor = state.cursor;
  let next = state;
  for (const match of matches.toReversed()) next = replaceMatch(next, match, replacement);
  if (matches.length === 0) return { state, count: 0 };
  // Keep the cursor roughly where it was, on a grapheme boundary.
  const line = Math.min(cursor.line, next.lines.length - 1);
  const text = next.lines[line]!;
  return { state: { ...next, cursor: { line, col: floorBoundary(text, Math.min(cursor.col, text.length)) } }, count: matches.length };
}
