const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Splits text into user-perceived characters (Bangla conjuncts, vowel signs and emoji stay whole). */
export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

/** Terminal columns occupied by `text`. */
export function cellWidth(text: string): number {
  return Bun.stringWidth(text);
}

/** Offset of the grapheme boundary before `offset` (0 if already at the start). */
export function prevBoundary(text: string, offset: number): number {
  let prev = 0;
  for (const { index } of segmenter.segment(text)) {
    if (index >= offset) break;
    prev = index;
  }
  return prev;
}

/** Offset of the grapheme boundary after `offset` (text.length if already at the end). */
export function nextBoundary(text: string, offset: number): number {
  for (const { index, segment } of segmenter.segment(text)) {
    const end = index + segment.length;
    if (end > offset) return end;
  }
  return text.length;
}

/** Number of graphemes before `offset`. */
export function graphemeIndex(text: string, offset: number): number {
  return graphemes(text.slice(0, offset)).length;
}

/** Offset of the last grapheme boundary whose column is at or before cell `x`. */
export function offsetAtCell(text: string, x: number): number {
  let offset = 0;
  let cells = 0;
  for (const { segment } of segmenter.segment(text)) {
    const width = cellWidth(segment);
    if (cells + width > x) break;
    cells += width;
    offset += segment.length;
  }
  return offset;
}

/** Last grapheme boundary at or before `offset`. */
export function floorBoundary(text: string, offset: number): number {
  let floor = 0;
  for (const { index } of segmenter.segment(text)) {
    if (index > offset) break;
    floor = index;
  }
  return offset >= text.length ? text.length : floor;
}

/** First grapheme boundary at or after `offset`. */
export function ceilBoundary(text: string, offset: number): number {
  for (const { index } of segmenter.segment(text)) {
    if (index >= offset) return index;
  }
  return text.length;
}
