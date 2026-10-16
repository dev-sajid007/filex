import type { EditorState, Position } from "./editor-buffer.ts";

/** "move" never enters history; "insert"/"delete" runs are grouped; "other" always stands alone. */
export type EditKind = "insert" | "delete" | "other" | "move";

interface Snapshot {
  lines: readonly string[];
  cursor: Position;
  anchor: Position | null;
}

export interface History {
  readonly undo: readonly Snapshot[];
  readonly redo: readonly Snapshot[];
  readonly lastKind: EditKind | null;
  readonly lastTime: number;
  /** Cursor after the last recorded edit; typing continues a group only from here. */
  readonly lastCursor: Position | null;
}

export const HISTORY_LIMIT = 1000;
export const GROUP_TIMEOUT_MS = 1000;

export function emptyHistory(): History {
  return { undo: [], redo: [], lastKind: null, lastTime: 0, lastCursor: null };
}

const snapshot = ({ lines, cursor, anchor }: EditorState): Snapshot => ({ lines, cursor, anchor });
const samePosition = (a: Position | null, b: Position) => a !== null && a.line === b.line && a.col === b.col;

/** Records the transition `before` → `after`. Text-preserving transitions are ignored. */
export function record(history: History, before: EditorState, after: EditorState, kind: EditKind, now: number): History {
  if (before.lines === after.lines) return history;

  const continuesGroup =
    (kind === "insert" || kind === "delete") &&
    kind === history.lastKind &&
    now - history.lastTime < GROUP_TIMEOUT_MS &&
    before.anchor === null &&
    samePosition(history.lastCursor, before.cursor);

  const undo = continuesGroup ? history.undo : [...history.undo, snapshot(before)].slice(-HISTORY_LIMIT);
  return { undo, redo: [], lastKind: kind, lastTime: now, lastCursor: after.cursor };
}

function restore(current: EditorState, snap: Snapshot): EditorState {
  // savedText is untouched, so undoing back to the saved text makes the buffer clean again.
  return { ...current, lines: snap.lines, cursor: snap.cursor, anchor: snap.anchor, goalX: null };
}

export function undo(history: History, current: EditorState): { history: History; state: EditorState } | null {
  const snap = history.undo.at(-1);
  if (!snap) return null;
  return {
    history: { undo: history.undo.slice(0, -1), redo: [...history.redo, snapshot(current)], lastKind: null, lastTime: 0, lastCursor: null },
    state: restore(current, snap),
  };
}

export function redo(history: History, current: EditorState): { history: History; state: EditorState } | null {
  const snap = history.redo.at(-1);
  if (!snap) return null;
  return {
    history: { undo: [...history.undo, snapshot(current)], redo: history.redo.slice(0, -1), lastKind: null, lastTime: 0, lastCursor: null },
    state: restore(current, snap),
  };
}
