import { expect, test } from "bun:test";
import { fitHints } from "../src/components/StatusBar.tsx";

test("fitHints keeps whole hints within the column budget", () => {
  const hints = ["Ctrl+S সংরক্ষণ", "Ctrl+F খুঁজুন", "Ctrl+Q বন্ধ"];
  expect(fitHints(hints, 100)).toBe("Ctrl+S সংরক্ষণ  Ctrl+F খুঁজুন  Ctrl+Q বন্ধ");
  // "Ctrl+S সংরক্ষণ" is 12 terminal columns even though it has 14 code units.
  expect(fitHints(hints, 12)).toBe("Ctrl+S সংরক্ষণ");
  expect(fitHints(hints, 11)).toBe("");
});
