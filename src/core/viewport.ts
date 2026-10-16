import { cellWidth, graphemes } from "../utils/unicode.ts";

export interface Scroll {
  /** First visible line. */
  top: number;
  /** First visible cell column. */
  left: number;
}

/** Shifts `scroll` the minimum amount needed to keep the cursor cell (of width `cursorWidth`) on screen. */
export function followCursor(
  scroll: Scroll,
  cursorLine: number,
  cursorX: number,
  cursorWidth: number,
  rows: number,
  cols: number,
): Scroll {
  let { top, left } = scroll;
  if (cursorLine < top) top = cursorLine;
  else if (cursorLine >= top + rows) top = cursorLine - rows + 1;

  if (cursorX < left) left = cursorX;
  else if (cursorX + cursorWidth > left + cols) left = cursorX + cursorWidth - cols;

  return { top: Math.max(0, top), left: Math.max(0, left) };
}

export type SegmentKind = "text" | "cursor" | "selection" | "match";

export interface Segment {
  text: string;
  kind: SegmentKind;
}

/** A highlighted span of one line, as UTF-16 offsets. */
export interface Mark {
  start: number;
  end: number;
  kind: "selection" | "match";
}

// Later entries win when marks overlap.
const PRIORITY: Record<SegmentKind, number> = { text: 0, match: 1, selection: 2, cursor: 3 };

/**
 * Cuts the cell window [left, left + cols) out of `line` and splits it into styled segments.
 * Graphemes that straddle an edge are replaced with spaces so the row never overflows its width.
 * A cursor at the end of the line is drawn as a trailing space.
 */
export function layoutRow(line: string, left: number, cols: number, cursorCol: number | null, marks: Mark[] = []): Segment[] {
  const right = left + cols;
  const segments: Segment[] = [];
  let x = 0;
  let offset = 0;

  const kindAt = (start: number, end: number, isCursor: boolean): SegmentKind => {
    if (isCursor) return "cursor";
    let kind: SegmentKind = "text";
    for (const mark of marks) {
      // A grapheme is highlighted if any part of it falls inside the mark.
      if (mark.start < end && mark.end > start && PRIORITY[mark.kind] > PRIORITY[kind]) kind = mark.kind;
    }
    return kind;
  };

  const emit = (text: string, kind: SegmentKind) => {
    const last = segments.at(-1);
    if (last && last.kind === kind && kind !== "cursor") last.text += text;
    else segments.push({ text, kind });
  };

  const place = (g: string, kind: SegmentKind) => {
    const width = cellWidth(g);
    const end = x + width;
    if (end > left && x < right) {
      emit(x >= left && end <= right ? g : " ".repeat(Math.min(end, right) - Math.max(x, left)), kind);
    }
    x = end;
  };

  for (const g of graphemes(line)) {
    place(g, kindAt(offset, offset + g.length, offset === cursorCol));
    offset += g.length;
  }
  if (cursorCol === line.length) place(" ", "cursor");
  return segments;
}
