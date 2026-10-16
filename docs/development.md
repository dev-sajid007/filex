# Development

## Prerequisites

- Bun `>=1.3.0` (development-এ ব্যবহৃত: 1.4.2)
- Git
- বাংলা font-সহ terminal emulator

## Setup

```bash
bun install
bun run start
```

Project তৈরি হয়েছিল OpenTUI-এর official template থেকে:
`bunx create-tui -t react`। (Spec-এ উল্লেখিত `bun create opentui` আর কাজ
করে না।)

## Scripts

| Command | কাজ |
| --- | --- |
| `bun run start` | একবার চালান |
| `bun run dev` | File বদলালে নিজে থেকে restart |
| `bun test` | সব test |
| `bun run typecheck` | `tsc --noEmit` |

Argument পাঠাতে: `bun run start --lang en`।

## Dependencies

সব dependency exact version-এ pin করা (`^`/`~` ছাড়া), কারণ OpenTUI-এর API
দ্রুত বদলায়। Upgrade করার সময় একসঙ্গে `@opentui/core` ও `@opentui/react`
বদলান, তারপর typecheck ও test চালান।

নতুন dependency যোগ করার আগে license, maintenance status, platform support
ও terminal compatibility যাচাই করুন।

## Testing

Test-গুলো `tests/`-এ, Bun-এর test runner দিয়ে চলে।

- **Pure logic** (keymap, CLI, i18n): সাধারণ unit test।
- **UI**: `@opentui/react/test-utils`-এর `testRender()` একটি virtual
  terminal-এ render করে। `captureCharFrame()` দিয়ে screen-এর text পাওয়া যায়
  এবং `mockInput` দিয়ে key পাঠানো যায়।

### পরিচিত বিষয়

- `bun test` React-এর "not wrapped in act(...)" warning দেখায়। এটি
  OpenTUI-এর `testRender()` থেকে আসে (একটি খালি `<text>` render করলেও আসে)
  এবং test-এর ফলাফলে প্রভাব ফেলে না।
- একক `Esc` key parser-এর escape timeout পার হওয়ার পর পৌঁছায়। তাই Esc-এর
  test-এ render pass গুনে নয়, বাস্তব সময় ধরে অপেক্ষা করতে হয় —
  `tests/app.test.tsx`-এর `waitForFrame()` দেখুন।
- `captureCharFrame()`-এ বাংলা কার ও যুক্তাক্ষরযুক্ত line-এর ডান border
  সরে গেছে মনে হতে পারে, কারণ text dump-এ combining mark আলাদা character
  হিসেবে আসে। বাস্তব alignment যাচাইয়ের জন্য প্রকৃত terminal-এ চালান।

## Manual terminal check

প্রতিটি UI পরিবর্তনের পর অন্তত একবার প্রকৃত terminal-এ দেখুন:

- বাংলা text ও border alignment
- ছোট window ও resize
- `Ctrl+Q`-এর পর terminal স্বাভাবিক অবস্থায় ফেরে কি না
- SSH session (সম্ভব হলে)

## Release

Publishing checklist ও versioning নীতি:
[filex-project-documentation.md](../filex-project-documentation.md) §17–18।
প্রকাশের আগে package name ঠিক করতে হবে — `filex` npm-এ নেওয়া।
