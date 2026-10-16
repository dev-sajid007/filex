import type { FileErrorCode } from "../core/errors.ts";
import type { CommandId } from "../core/keymap.ts";
import { bn } from "./bn.ts";
import { en } from "./en.ts";

export type Messages = { readonly [K in keyof typeof bn]: string };
export type Locale = "bn" | "en";

const dictionaries: Record<Locale, Messages> = { bn, en };

export const DEFAULT_LOCALE: Locale = "bn";
export const LOCALES = Object.keys(dictionaries) as Locale[];

export function isLocale(value: string): value is Locale {
  return value in dictionaries;
}

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return dictionaries[locale];
}

export function commandName(messages: Messages, command: CommandId): string {
  return messages[`command.${command}`];
}

export function errorMessage(messages: Messages, code: FileErrorCode): string {
  return messages[`error.${code}`];
}

/** Fills `{name}` placeholders. */
export function format(message: string, values: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}
