import { expect, test } from "bun:test";
import { resolveCommand } from "../src/core/keymap.ts";

const key = (name: string, mods: { ctrl?: boolean; shift?: boolean; meta?: boolean } = {}) => ({
  name,
  ctrl: mods.ctrl ?? false,
  shift: mods.shift ?? false,
  meta: mods.meta ?? false,
});

test("maps default shortcuts", () => {
  expect(resolveCommand(key("s", { ctrl: true }))).toBe("save");
  expect(resolveCommand(key("o", { ctrl: true }))).toBe("open");
  expect(resolveCommand(key("f", { ctrl: true }))).toBe("find");
  expect(resolveCommand(key("r", { ctrl: true }))).toBe("replace");
  expect(resolveCommand(key("a", { ctrl: true }))).toBe("selectAll");
  expect(resolveCommand(key("g", { ctrl: true }))).toBe("gotoLine");
  expect(resolveCommand(key("q", { ctrl: true }))).toBe("quit");
  expect(resolveCommand(key("escape"))).toBe("cancel");
});

test("distinguishes undo from redo", () => {
  expect(resolveCommand(key("z", { ctrl: true }))).toBe("undo");
  expect(resolveCommand(key("z", { ctrl: true, shift: true }))).toBe("redo");
  expect(resolveCommand(key("y", { ctrl: true }))).toBe("redo");
});

test("plain keys and Meta combos are not commands", () => {
  expect(resolveCommand(key("s"))).toBeNull();
  expect(resolveCommand(key("q"))).toBeNull();
  expect(resolveCommand(key("s", { ctrl: true, meta: true }))).toBeNull();
  expect(resolveCommand(key("backspace"))).toBeNull();
});
