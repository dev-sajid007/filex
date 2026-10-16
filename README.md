# FileX — বাংলা-প্রথম Terminal File Editor

FileX হলো টার্মিনালের ভেতরে ফাইল খোলা, সম্পাদনা ও সংরক্ষণের জন্য একটি
বাংলা-প্রথম editor। এটি [Bun](https://bun.sh), TypeScript এবং
[OpenTUI](https://github.com/anomalyco/opentui) + React দিয়ে তৈরি।

> **অবস্থা:** প্রাথমিক development (`0.0.1`)। ফাইল খোলা, সম্পাদনা ও নিরাপদ
> save চলে; search/replace ও undo/redo এখনও বাকি। বিস্তারিত: [Roadmap](#roadmap)।

## বর্তমানে যা কাজ করে

- `filex <path>` দিয়ে ফাইল খোলা; path না থাকলে নতুন ফাইল
- `Ctrl+S` save, নামহীন buffer-এ path জিজ্ঞাসা; `Ctrl+O` অন্য ফাইল খোলা
- নিরাপদ save: temp file + atomic rename, permission ও `CRLF`/BOM অক্ষত,
  বাইরে থেকে ফাইল বদলালে overwrite-এর আগে সতর্কতা
- প্রথম save-এর আগে মূল ফাইলের backup (`~/.local/state/filex/backups/`)
- অসংরক্ষিত পরিবর্তন থাকলে `Ctrl+Q`/`Ctrl+O`-এর আগে জিজ্ঞাসা
- বাংলা (default) ও ইংরেজি UI — `--lang bn` / `--lang en`
- Header, line number-সহ editor viewport ও status bar
- লেখা, Enter, Tab, Backspace/Delete এবং bracketed paste
- Arrow, Home/End, PageUp/PageDown দিয়ে cursor movement; লম্বা line ও বড়
  text-এ viewport নিজে থেকে scroll করে
- বাংলা যুক্তাক্ষর, কার ও emoji একটি অক্ষর হিসেবে গণ্য (cursor ও delete)
- অসংরক্ষিত পরিবর্তনের চিহ্ন `পরিবর্তিত [*]`
- Keyboard shortcut routing (`Ctrl+Q` দিয়ে বন্ধ, `Esc` দিয়ে বার্তা মুছুন)
- Terminal resize; ৪০×৮-এর চেয়ে ছোট হলে সতর্কতা

## চালানো

npm-এ এখনও প্রকাশিত হয়নি। Source থেকে চালান:

```bash
git clone <repository-url> filex
cd filex
bun install
bun run start                  # নামহীন buffer, বাংলা UI
bun run start notes.txt        # ফাইল খুলুন
bun run start --lang en a.ts   # English UI
```

Prerequisite: Bun `>=1.3.0`, এবং বাংলা font-সহ একটি terminal emulator।

## Keyboard shortcuts

| Shortcut | কাজ | অবস্থা |
| --- | --- | --- |
| `Ctrl+Q` | বন্ধ | ✅ |
| `Esc` | বাতিল / বার্তা মুছুন | ✅ |
| `Ctrl+S` | সংরক্ষণ | ✅ |
| `Ctrl+O` | ফাইল খুলুন | ✅ |
| `Ctrl+F` | খুঁজুন | পরিকল্পিত |
| `Ctrl+R` | প্রতিস্থাপন | পরিকল্পিত |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo | পরিকল্পিত |

পূর্ণ তালিকা ও terminal-সংক্রান্ত সীমাবদ্ধতা:
[docs/keyboard-shortcuts.md](docs/keyboard-shortcuts.md)।

## Documentation

- [docs/commands.md](docs/commands.md) — CLI command, option ও exit code
- [docs/keyboard-shortcuts.md](docs/keyboard-shortcuts.md) — shortcut reference
- [docs/architecture.md](docs/architecture.md) — layer, data flow, buffer design
- [docs/development.md](docs/development.md) — local setup, test, release
- [docs/security.md](docs/security.md) — filesystem safety, backup, permission
- [CONTRIBUTING.md](CONTRIBUTING.md) — অবদানের নিয়ম
- [CHANGELOG.md](CHANGELOG.md) — version history
- [filex-project-documentation.md](filex-project-documentation.md) — পূর্ণ specification

## Roadmap

| Milestone | বিষয় | অবস্থা |
| --- | --- | --- |
| M0 | Foundation | ✅ (package name বাকি) |
| M1 | TUI shell | ✅ |
| M2 | Basic editing | ✅ |
| M3 | File operations | ✅ |
| M4 | Search/replace, undo/redo | — |
| M5 | CLI commands | — |
| M6 | Unicode ও quality | — |
| M7 | Release | — |

## পরিচিত সীমাবদ্ধতা

- সব terminal ও font বাংলা যুক্তাক্ষর ও কার-এর width একইভাবে render করে না।
- `filex` নামটি npm-এ ইতিমধ্যে নেওয়া; প্রকাশের আগে package name ঠিক করতে হবে।

## License

এখনও নির্ধারিত হয়নি।
