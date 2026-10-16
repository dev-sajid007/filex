import { TextAttributes } from "@opentui/core";
import { type CommandId, shortcutLabels } from "../core/keymap.ts";
import { commandName, type Messages } from "../i18n/index.ts";

const hintCommands: CommandId[] = ["save", "open", "find", "quit", "help"];
const HINT_SEPARATOR = "  ";
const GAP = 2;

export interface StatusMessage {
  text: string;
  kind: "info" | "error";
}

interface StatusBarProps {
  messages: Messages;
  /** Columns available inside the status bar's padding. */
  width: number;
  line: number;
  column: number;
  status: StatusMessage | null;
}

/** Keeps as many whole hints as fit in `maxWidth` terminal columns. */
export function fitHints(hints: string[], maxWidth: number): string {
  let result = "";
  for (const hint of hints) {
    const next = result ? result + HINT_SEPARATOR + hint : hint;
    if (Bun.stringWidth(next) > maxWidth) break;
    result = next;
  }
  return result;
}

export function StatusBar({ messages, width, line, column, status }: StatusBarProps) {
  const position = `${messages.line} ${line}, ${messages.column} ${column}`;
  const available = width - Bun.stringWidth(position) - GAP;
  const hints = fitHints(
    hintCommands.map((c) => `${shortcutLabels[c]} ${commandName(messages, c)}`),
    available,
  );

  return (
    <box flexDirection="row" gap={GAP} paddingLeft={1} paddingRight={1} height={1} flexShrink={0}>
      <box flexGrow={1} flexShrink={1} overflow="hidden">
        {status ? (
          <text wrapMode="none" fg={status.kind === "error" ? "#ff5f5f" : "#5fafff"}>
            {status.text}
          </text>
        ) : (
          <text wrapMode="none" attributes={TextAttributes.DIM}>
            {hints}
          </text>
        )}
      </box>
      <text flexShrink={0}>{position}</text>
    </box>
  );
}
