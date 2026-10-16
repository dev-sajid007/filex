import { TextAttributes } from "@opentui/core";
import { type CommandId, shortcutLabels } from "../core/keymap.ts";
import { commandName, type Messages } from "../i18n/index.ts";
import { cellWidth } from "../utils/unicode.ts";

const COMMANDS: CommandId[] = [
  "save",
  "open",
  "find",
  "replace",
  "gotoLine",
  "undo",
  "redo",
  "selectAll",
  "copy",
  "cut",
  "paste",
  "quit",
  "help",
];

const NAVIGATION: [string, keyof Messages][] = [
  ["← → ↑ ↓", "help.move"],
  ["Home / End", "help.lineEdges"],
  ["PgUp / PgDn", "help.page"],
  ["Shift + ←→↑↓", "help.select"],
];

function pad(label: string, width: number): string {
  return label + " ".repeat(Math.max(1, width - cellWidth(label)));
}

/** Full-screen shortcut reference; any key closes it. */
export function HelpView({ messages }: { messages: Messages }) {
  const rows: [string, string][] = [
    ...COMMANDS.map((c): [string, string] => [shortcutLabels[c], commandName(messages, c)]),
    ...NAVIGATION.map(([keys, label]): [string, string] => [keys, messages[label]]),
  ];
  const keyWidth = Math.max(...rows.map(([keys]) => cellWidth(keys))) + 2;
  // Two columns so the list fits short terminals.
  const half = Math.ceil(rows.length / 2);
  const columns = [rows.slice(0, half), rows.slice(half)];

  return (
    <box flexDirection="column" flexGrow={1} border={["top", "bottom"]} paddingLeft={1} paddingRight={1}>
      <text attributes={TextAttributes.BOLD}>{messages["help.title"]}</text>
      <box flexDirection="row" gap={4} flexGrow={1} overflow="hidden">
        {columns.map((column, i) => (
          <box key={i} flexDirection="column">
            {column.map(([keys, label]) => (
              <text key={keys} wrapMode="none">
                <span attributes={TextAttributes.BOLD}>{pad(keys, keyWidth)}</span>
                {label}
              </text>
            ))}
          </box>
        ))}
      </box>
      <text attributes={TextAttributes.DIM}>{messages["help.close"]}</text>
    </box>
  );
}
