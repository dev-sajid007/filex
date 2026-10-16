import { TextAttributes } from "@opentui/core";
import { cursorX, selectionRange } from "../core/editor-buffer.ts";
import type { Prompt } from "../core/prompt.ts";
import { layoutRow } from "../core/viewport.ts";
import type { Messages } from "../i18n/index.ts";
import { cellWidth } from "../utils/unicode.ts";
import { Segments } from "./Segments.tsx";

interface PromptBarProps {
  messages: Messages;
  prompt: Prompt;
  /** Columns available inside the bar's padding. */
  width: number;
  /** Extra context after the label, e.g. "2/5". */
  detail?: string;
}

const CHOICES: Record<string, keyof Messages> = {
  unsaved: "prompt.yesNoCancel",
  conflict: "prompt.yesNo",
  exists: "prompt.yesNo",
  replace: "prompt.replaceChoices",
};

export function PromptBar({ messages, prompt, width, detail }: PromptBarProps) {
  if (prompt.kind === "confirm") {
    const label = messages[`prompt.${prompt.purpose}`] + (detail ? ` (${detail})` : "");
    return (
      <box flexDirection="row" gap={2} paddingLeft={1} paddingRight={1} height={1} flexShrink={0}>
        <text wrapMode="none" attributes={TextAttributes.BOLD}>
          {label}
        </text>
        <text wrapMode="none" attributes={TextAttributes.DIM}>
          {messages[CHOICES[prompt.purpose]!]}
        </text>
      </box>
    );
  }

  const label = `${messages[`prompt.${prompt.purpose}`]}${detail ? ` (${detail})` : ""}: `;
  const cols = Math.max(1, width - cellWidth(label));
  const { field } = prompt;
  // Keep the cursor (plus its end-of-line cell) in view by scrolling the field.
  const left = Math.max(0, cursorX(field) + 1 - cols);
  const selection = selectionRange(field);
  const marks = selection ? [{ start: selection.start.col, end: selection.end.col, kind: "selection" as const }] : [];

  return (
    <box flexDirection="row" paddingLeft={1} paddingRight={1} height={1} flexShrink={0}>
      <text wrapMode="none">
        <span attributes={TextAttributes.BOLD}>{label}</span>
        <Segments segments={layoutRow(field.lines[0]!, left, cols, field.cursor.col, marks)} />
      </text>
    </box>
  );
}
