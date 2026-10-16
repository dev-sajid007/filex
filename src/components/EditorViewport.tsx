import { TextAttributes } from "@opentui/core";
import type { Range } from "../core/editor-buffer.ts";
import type { Match } from "../core/search.ts";
import { layoutRow, type Mark, type Scroll } from "../core/viewport.ts";
import { Segments } from "./Segments.tsx";

interface EditorViewportProps {
  lines: readonly string[];
  cursorLine: number;
  cursorCol: number;
  selection: Range | null;
  /** Search matches to highlight (only those on visible rows are used). */
  matches: Match[];
  scroll: Scroll;
  rows: number;
  textCols: number;
  gutterWidth: number;
}

export function gutterWidthFor(lineCount: number): number {
  return Math.max(3, String(lineCount).length) + 1;
}

function marksFor(index: number, line: string, selection: Range | null, matches: Match[]): Mark[] {
  const marks: Mark[] = [];
  for (const m of matches) if (m.line === index) marks.push({ start: m.start, end: m.end, kind: "match" });
  if (selection && index >= selection.start.line && index <= selection.end.line) {
    const start = index === selection.start.line ? selection.start.col : 0;
    const end = index === selection.end.line ? selection.end.col : line.length;
    if (end > start) marks.push({ start, end, kind: "selection" });
  }
  return marks;
}

export function EditorViewport({
  lines,
  cursorLine,
  cursorCol,
  selection,
  matches,
  scroll,
  rows,
  textCols,
  gutterWidth,
}: EditorViewportProps) {
  const visible = Array.from({ length: rows }, (_, i) => scroll.top + i);
  const visibleMatches = matches.filter((m) => m.line >= scroll.top && m.line < scroll.top + rows);

  return (
    <box flexDirection="column" flexGrow={1} border={["top", "bottom"]}>
      {visible.map((index) => {
        const line = lines[index];
        if (line === undefined) return <text key={index}> </text>;

        const segments = layoutRow(
          line,
          scroll.left,
          textCols,
          index === cursorLine ? cursorCol : null,
          marksFor(index, line, selection, visibleMatches),
        );
        const number = String(index + 1).padStart(gutterWidth - 1);
        return (
          <text key={index} wrapMode="none">
            <span attributes={index === cursorLine ? TextAttributes.BOLD : TextAttributes.DIM}>{`${number} `}</span>
            <Segments segments={segments} />
          </text>
        );
      })}
    </box>
  );
}
