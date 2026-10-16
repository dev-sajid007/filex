# অবদান রাখা

FileX-এ অবদান রাখতে চাওয়ার জন্য ধন্যবাদ! সবার কাছে [Code of Conduct](CODE_OF_CONDUCT.md)
মেনে চলার অনুরোধ। বাংলা বা ইংরেজি — যেকোনো ভাষায় issue ও PR লিখতে পারেন।

## Setup

```bash
git clone https://github.com/dev-sajid007/filex.git
cd filex
bun install
bun run start        # editor চালান
bun link             # ঐচ্ছিক: `filex` command PATH-এ
```

বিস্তারিত: [docs/development.md](docs/development.md)।

## Workflow

1. বড় পরিবর্তনের আগে একটি issue খুলে আলোচনা করুন।
2. `main` থেকে নতুন branch তৈরি করুন।
3. পরিবর্তন করুন এবং test যোগ করুন।
4. PR খোলার আগে চালান:

   ```bash
   bun run typecheck
   bun test
   ```

5. UI পরিবর্তন হলে প্রকৃত terminal-এ চালিয়ে দেখুন, এবং PR-এ screenshot দিন।
6. PR খুললে CI নিজে থেকে একই check ও একটি install test চালায়; সবুজ হওয়া পর্যন্ত
   অপেক্ষা করুন।

## নিয়ম

- **UI text hardcode করবেন না।** নতুন বার্তা `src/i18n/bn.ts`-এ যোগ করুন,
  তারপর `src/i18n/en.ts`-এ — typecheck দুটো মেলাতে বাধ্য করে।
- **Width-এর জন্য `.length` ব্যবহার করবেন না।** Terminal column হিসাব করতে
  `Bun.stringWidth()`; cursor movement-এর জন্য grapheme cluster।
- **নতুন shortcut** `src/core/keymap.ts`-এ যোগ করুন, এবং
  [docs/keyboard-shortcuts.md](docs/keyboard-shortcuts.md) update করুন।
  বিভিন্ন terminal-এ key আসলে পৌঁছায় কি না যাচাই করুন।
- **File-এ লেখে এমন কোড** [docs/security.md](docs/security.md)-এর নীতি মেনে
  চলবে।
- Dependency যোগ করলে exact version pin করুন এবং PR-এ কারণ লিখুন।
- আশেপাশের কোডের style অনুসরণ করুন।

## Commit message

ছোট, বর্তমান কালে লেখা summary line, প্রয়োজনে নিচে বিস্তারিত:

```text
Add grapheme-aware cursor movement

Arrow keys now step over whole Bangla conjuncts instead of
splitting them into individual code points.
```

## Bug report

যা দেবেন:

- FileX version, OS, terminal emulator ও font
- পুনরায় ঘটানোর ধাপ
- প্রত্যাশিত ও প্রকৃত আচরণ
- বাংলা rendering-এর সমস্যা হলে screenshot

Security সমস্যা public issue-তে নয় — [SECURITY.md](SECURITY.md) অনুযায়ী ব্যক্তিগতভাবে
জানান।
