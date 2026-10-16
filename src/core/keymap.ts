import type { KeyEvent } from "@opentui/core";

export type CommandId =
  | "save"
  | "open"
  | "find"
  | "replace"
  | "undo"
  | "redo"
  | "selectAll"
  | "gotoLine"
  | "copy"
  | "cut"
  | "paste"
  | "help"
  | "quit"
  | "cancel";

type KeyInfo = Pick<KeyEvent, "name" | "ctrl" | "shift" | "meta">;

interface Binding {
  name: string;
  ctrl?: boolean;
  shift?: boolean;
  command: CommandId;
}

// Ctrl+H is sent as Backspace (0x08) by most terminals, so Replace uses Ctrl+R.
// Ctrl+Shift+Z only arrives distinctly with the kitty keyboard protocol; Ctrl+Y is the portable redo.
const bindings: Binding[] = [
  { name: "s", ctrl: true, command: "save" },
  { name: "o", ctrl: true, command: "open" },
  { name: "f", ctrl: true, command: "find" },
  { name: "r", ctrl: true, command: "replace" },
  { name: "z", ctrl: true, shift: true, command: "redo" },
  { name: "z", ctrl: true, command: "undo" },
  { name: "y", ctrl: true, command: "redo" },
  { name: "a", ctrl: true, command: "selectAll" },
  { name: "g", ctrl: true, command: "gotoLine" },
  { name: "c", ctrl: true, command: "copy" },
  { name: "x", ctrl: true, command: "cut" },
  { name: "v", ctrl: true, command: "paste" },
  { name: "f1", command: "help" },
  { name: "q", ctrl: true, command: "quit" },
  { name: "escape", command: "cancel" },
];

export function resolveCommand(key: KeyInfo): CommandId | null {
  if (key.meta) return null;
  const name = key.name.toLowerCase();
  const match = bindings.find(
    (b) => b.name === name && !!b.ctrl === key.ctrl && (b.shift === undefined || b.shift === key.shift),
  );
  return match?.command ?? null;
}

export const shortcutLabels: Record<CommandId, string> = {
  save: "Ctrl+S",
  open: "Ctrl+O",
  find: "Ctrl+F",
  replace: "Ctrl+R",
  undo: "Ctrl+Z",
  redo: "Ctrl+Y",
  selectAll: "Ctrl+A",
  gotoLine: "Ctrl+G",
  copy: "Ctrl+C",
  cut: "Ctrl+X",
  paste: "Ctrl+V",
  help: "F1",
  quit: "Ctrl+Q",
  cancel: "Esc",
};
