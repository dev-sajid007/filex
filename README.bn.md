<div align="center">

# FileX

**বাংলা-প্রথম terminal text editor — নিরাপদ, keyboard-নির্ভর, Unicode-সঠিক।**

[Read in English](README.md) · [Documentation](#documentation) · [অবদান](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

</div>

---

FileX হলো terminal-এর জন্য একটি ছোট, keyboard-নির্ভর editor, যার UI default-এ বাংলা
(ইংরেজি এক flag দূরে)। দ্রুত সম্পাদনার জন্য তৈরি — SSH-এ config file, নোট, script। দুটি
বিষয়ে কোনো আপস নেই: **ফাইল কখনও অর্ধেক লেখা অবস্থায় থাকবে না**, এবং **বাংলা লেখা সঠিকভাবে
আচরণ করবে** — `ক্ষ`-এর মতো যুক্তাক্ষর, `কি`-এর মতো কার এবং emoji সবসময় একটি পূর্ণ অক্ষর
হিসেবে পার হয়, মোছে ও highlight হয়।

```text
┌─ ফাইলএক্স ─────────────────────────────────────────────┐
│ ফাইল: src/index.ts                      পরিবর্তিত [*] │
│────────────────────────────────────────────────────────│
│  1 const message = "হ্যালো বিশ্ব";                       │
│  2 console.log(message); // নতুন                       │
│  3                                                     │
│  4 // যুক্তাক্ষর: ক্ষ ত্র জ্ঞ                                │
│────────────────────────────────────────────────────────│
│ Ctrl+S সংরক্ষণ  Ctrl+O ফাইল খুলুন  Ctrl+F খুঁজুন  লাইন 2, কলাম 29 │
└────────────────────────────────────────────────────────┘
```

> [!NOTE]
> FileX প্রাথমিক development পর্যায়ে (`0.x`): এখনই ব্যবহারযোগ্য, তবে 1.0-এর আগে কিছু
> অসম্পূর্ণতা ও breaking change থাকতে পারে। দেখুন [roadmap](#roadmap)।

## বৈশিষ্ট্য

**সম্পাদনা**
- Undo/redo (টানা typing এক ধাপে), Shift দিয়ে নির্বাচন, copy / cut / paste
  (OSC 52 দিয়ে system clipboard-এও, SSH-এর মধ্য দিয়েও)
- টাইপের সঙ্গে সঙ্গে খোঁজা, এক এক করে বা সব একসঙ্গে প্রতিস্থাপন, লাইনে যাওয়া (`12` বা `১২`)
- Line number, আড়াআড়ি ও লম্বালম্বি scroll, bracketed paste, `F1`-এ shortcut তালিকা

**বাংলা ও Unicode**
- Grapheme-সচেতন cursor ও মোছা — যুক্তাক্ষর, কার বা ZWJ emoji কখনও ভাঙে না
- Layout হিসাব হয় terminal cell দিয়ে, string length দিয়ে নয় — তাই বাংলা লেখা সারিবদ্ধ থাকে
- Default বাংলা UI; ইংরেজির জন্য `--lang en` বা `FILEX_LANG=en`

**ফাইলের নিরাপত্তা**
- Atomic save: temp file-এ লেখা, `fsync`, তারপর মূল ফাইলের উপর rename
- File mode, symlink, hard link, `CRLF` line ending ও UTF-8 BOM অক্ষত থাকে
- অন্য program ফাইল বদলালে ধরে ফেলে এবং overwrite-এর আগে জিজ্ঞাসা করে
- প্রতি session-এ প্রথম save-এর আগে মূল ফাইলের ব্যক্তিগত backup (`0600`)
- অসংরক্ষিত পরিবর্তন ফেলে দেওয়ার আগে জিজ্ঞাসা; binary, non-UTF-8 ও খুব বড় ফাইল প্রত্যাখ্যান

**Script-এ ব্যবহারযোগ্য**
- Shell script-এর জন্য `read`, `create`, `append`, `insert` ও `replace` command
- Content stdout-এ, বার্তা stderr-এ, অর্থবহ [exit code](#exit-code)

## Installation

**প্রয়োজন:** [Bun](https://bun.sh) 1.3.14 বা নতুন, UTF-8 terminal, এবং বাংলা glyph-সহ font
(যেমন Noto Sans Bengali)। Linux-এ তৈরি ও পরীক্ষিত; macOS ও Windows পরীক্ষা করা হয়নি।

```bash
bun add -g filex-editor      # অথবা: npm install -g filex-editor
filex --version
```

npm package-এর নাম `filex-editor`; এটি `filex` command install করে। npm দিয়ে install করলেও
FileX Bun-এ চলে, তাই `PATH`-এ Bun থাকতে হবে।

<details>
<summary>Source থেকে install</summary>

```bash
git clone https://github.com/dev-sajid007/filex.git
cd filex
bun install
bun link          # `filex` command PATH-এ যোগ করে (~/.bun/bin)
```

অথবা install না করে চালান: `bun run start [path]`।

</details>

## ব্যবহার

```bash
filex                 # নামহীন buffer — Ctrl+S চাপলে path জিজ্ঞাসা করে
filex notes.md        # ফাইল খুলুন (না থাকলে প্রথম save-এ তৈরি হয়)
filex --lang en a.ts  # ইংরেজি UI
filex --help          # সব command ও option
```

### Keyboard shortcut

| Key | কাজ | Key | কাজ |
| --- | --- | --- | --- |
| `Ctrl+S` | সংরক্ষণ | `Ctrl+Z` | পূর্বাবস্থা (undo) |
| `Ctrl+O` | ফাইল খুলুন | `Ctrl+Y` | পুনরায় করুন (redo) |
| `Ctrl+F` | খুঁজুন (`Enter`/`↓` পরের, `↑` আগের) | `Ctrl+A` | সব নির্বাচন |
| `Ctrl+R` | প্রতিস্থাপন (`y` / `n` / `a` সব) | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | কপি / কাট / পেস্ট |
| `Ctrl+G` | লাইনে যান | `Shift` + arrow | নির্বাচন |
| `F1` | সব shortcut | `Ctrl+Q` | বন্ধ (অসংরক্ষিত পরিবর্তন থাকলে জিজ্ঞাসা) |

`Ctrl+C` কপি করে — বন্ধ করে না। প্রতিস্থাপন `Ctrl+R`, কারণ বেশিরভাগ terminal `Ctrl+H`-কে
Backspace হিসেবে পাঠায়। পূর্ণ তালিকা: [docs/keyboard-shortcuts.md](docs/keyboard-shortcuts.md)।

### Command line

```bash
filex read config.json                       # ফাইল stdout-এ দেখান
filex create notes.md                        # খালি ফাইল তৈরি (থাকলে error)
filex append notes.md "নতুন লাইন"            # শেষে একটি লাইন যোগ
filex insert notes.md ১ "# শিরোনাম"          # লাইন নম্বরে বসান (১ থেকে শুরু)
filex replace app.conf 8080 9090 --dry-run   # আগে দেখে নিন, তারপর --dry-run ছাড়া চালান
```

লেখার প্রতিটি command editor-এর মতো একই atomic save ও backup ব্যবহার করে, এবং ফাইলের line
ending ও শেষের newline অক্ষত রাখে। বিস্তারিত: [docs/commands.md](docs/commands.md)।

### Exit code

| Code | অর্থ |
| --- | --- |
| `0` | সফল |
| `1` | সাধারণ error; `replace`-এ কোনো মিল নেই |
| `2` | ভুল command বা argument |
| `3` | ফাইল বা path error (নেই, directory, binary, UTF-8 নয়, খুব বড়, আগে থেকেই আছে) |
| `4` | অনুমতি নেই |
| `5` | লেখা ব্যর্থ (disk full, I/O error, save-এর সময় ফাইল বদলে গেছে) |
| `6` | Editor-এর জন্য terminal নেই |

## Documentation

| Document | বিষয় |
| --- | --- |
| [docs/commands.md](docs/commands.md) | CLI command, option, আচরণ ও exit code |
| [docs/keyboard-shortcuts.md](docs/keyboard-shortcuts.md) | সব shortcut, prompt, search-এর নিয়ম, terminal-এর সীমাবদ্ধতা |
| [docs/architecture.md](docs/architecture.md) | Layer, state model, Unicode handling, save flow |
| [docs/security.md](docs/security.md) | Save পদ্ধতি, backup, permission, platform নোট |
| [docs/development.md](docs/development.md) | Local setup, script, testing |
| [filex-project-documentation.md](filex-project-documentation.md) | পূর্ণ specification |

## Roadmap

| Milestone | বিষয় | অবস্থা |
| --- | --- | --- |
| M0 | Foundation | ✅ |
| M1 | TUI shell | ✅ |
| M2 | Basic editing | ✅ |
| M3 | File operations ও safe save | ✅ |
| M4 | Search/replace, undo/redo, selection | ✅ |
| M5 | Command-line interface | ✅ |
| M6 | Unicode ও quality | পরিকল্পিত |
| M7 | Release (CI, npm) | চলছে — package প্রস্তুত, CI বাকি |

## পরিচিত সীমাবদ্ধতা

- কিছু বাংলা যুক্তাক্ষর কতটা চওড়া আঁকা হবে তা terminal ও font ভেদে আলাদা; alignment আপনার
  terminal-এর উপর নির্ভর করে।
- Tab character এখনও দেখানো হয় না — paste করা tab space-এ রূপান্তরিত হয়।
- Mixed line ending-এর ফাইল এক ধরনের line ending-এ save হয়।
- `filex diff` ও configuration file এখনও নেই; backup বন্ধ করা যায় না।
- `Ctrl+V` FileX-এর নিজস্ব clipboard থেকে পেস্ট করে; অন্য জায়গা থেকে কপি করা লেখার জন্য
  terminal-এর paste (সাধারণত `Ctrl+Shift+V`) ব্যবহার করুন।

## অবদান

Bug report, বিভিন্ন terminal-এ বাংলা rendering-এর রিপোর্ট এবং pull request স্বাগত।
[CONTRIBUTING.md](CONTRIBUTING.md) ও [Code of Conduct](CODE_OF_CONDUCT.md) পড়ুন।
Security সমস্যা [SECURITY.md](SECURITY.md) অনুযায়ী ব্যক্তিগতভাবে জানান।

## License

[MIT](LICENSE) © dev-sajid007
