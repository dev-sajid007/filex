import { expect, test } from "bun:test";
import { bn } from "../src/i18n/bn.ts";
import { en } from "../src/i18n/en.ts";
import { DEFAULT_LOCALE, getMessages, isLocale } from "../src/i18n/index.ts";

test("default locale is Bangla", () => {
  expect(DEFAULT_LOCALE).toBe("bn");
  expect(getMessages()).toBe(bn);
});

test("every locale has the same keys with non-empty values", () => {
  const keys = Object.keys(bn).sort();
  expect(Object.keys(en).sort()).toEqual(keys);
  for (const dict of [bn, en]) {
    for (const value of Object.values(dict)) expect(value.trim()).not.toBe("");
  }
});

test("isLocale accepts only known locales", () => {
  expect(isLocale("bn")).toBe(true);
  expect(isLocale("en")).toBe(true);
  expect(isLocale("fr")).toBe(false);
});
