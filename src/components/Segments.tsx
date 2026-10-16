import { TextAttributes } from "@opentui/core";
import type { Segment } from "../core/viewport.ts";

const MATCH_BG = "#5f5f00";
const SELECTION_BG = "#3a3a8a";

/** Renders layoutRow output; must be placed inside a <text>. */
export function Segments({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((segment, i) => {
        switch (segment.kind) {
          case "cursor":
            return (
              <span key={i} attributes={TextAttributes.INVERSE}>
                {segment.text}
              </span>
            );
          case "selection":
            return (
              <span key={i} bg={SELECTION_BG}>
                {segment.text}
              </span>
            );
          case "match":
            return (
              <span key={i} bg={MATCH_BG}>
                {segment.text}
              </span>
            );
          default:
            return segment.text;
        }
      })}
    </>
  );
}
