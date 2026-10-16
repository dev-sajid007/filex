<div align="center">

# FileX

**A Bangla-first terminal text editor — safe, keyboard-driven, Unicode-correct.**

[বাংলায় পড়ুন](README.bn.md) · [Documentation](#documentation) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

[![CI](https://github.com/dev-sajid007/filex/actions/workflows/ci.yml/badge.svg)](https://github.com/dev-sajid007/filex/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/filex-editor?logo=npm)](https://www.npmjs.com/package/filex-editor)
![status](https://img.shields.io/badge/status-alpha-orange)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
![runtime](https://img.shields.io/badge/runtime-Bun%20%E2%89%A5%201.3-black?logo=bun)
![language](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![platform](https://img.shields.io/badge/platform-Linux-lightgrey?logo=linux&logoColor=white)

</div>

---

FileX is a small, keyboard-driven editor for the terminal with a Bangla interface by default
(English is one flag away). It is built for quick edits — config files over SSH, notes, scripts —
and treats two things as non-negotiable: **your file is never left half-written**, and
**Bangla text behaves correctly**: conjuncts like `ক্ষ`, vowel signs like `কি` and emoji are
always moved over, deleted and highlighted as whole characters.

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
> FileX is in early development (`0.x`): usable today, but expect rough edges and breaking
> changes before 1.0. See the [roadmap](#roadmap).

## Features

**Editing**
- Undo/redo with grouped typing, selection with Shift, copy / cut / paste
  (also to the system clipboard over OSC 52, including through SSH)
- Incremental search, step-through or replace-all, go to line (accepts `12` or `১২`)
- Line numbers, horizontal and vertical scrolling, bracketed paste, `F1` shortcut reference

**Bangla and Unicode**
- Grapheme-aware cursor and deletion — never splits a conjunct, vowel sign or ZWJ emoji
- Layout measured in terminal cells, not string length, so Bangla text aligns
- Bangla UI by default; `--lang en` or `FILEX_LANG=en` for English

**File safety**
- Atomic saves: write to a temp file, `fsync`, then rename over the original
- Preserves file mode, symlinks, hard links, `CRLF` line endings and UTF-8 BOM
- Detects changes made by other programs and asks before overwriting
- Private backup (`0600`) of the original before the first save of each session
- Asks before discarding unsaved changes; refuses binary, non-UTF-8 and oversized files

**Scriptable**
- `read`, `create`, `append`, `insert` and `replace` commands for shell scripts
- Content on stdout, messages on stderr, meaningful [exit codes](#exit-codes)

## Installation

**Requirements:** [Bun](https://bun.sh) 1.3.14 or newer, a UTF-8 terminal, and a font with
Bangla glyphs (for example Noto Sans Bengali). Developed and tested on Linux; macOS and Windows
are untested.

```bash
bun add -g filex-editor      # or: npm install -g filex-editor
filex --version
```

The package is published as `filex-editor`; the command it installs is `filex`. FileX runs on
Bun even when installed with npm, so Bun must be on your `PATH`.

<details>
<summary>Install from source</summary>

```bash
git clone https://github.com/dev-sajid007/filex.git
cd filex
bun install
bun link          # puts `filex` on your PATH (~/.bun/bin)
```

Or run it without installing: `bun run start [path]`.

</details>

## Usage

```bash
filex                 # untitled buffer — Ctrl+S asks where to save
filex notes.md        # open a file (created on first save if it does not exist)
filex --lang en a.ts  # English interface
filex --help          # all commands and options
```

### Keyboard shortcuts

| Key | Action | Key | Action |
| --- | --- | --- | --- |
| `Ctrl+S` | Save | `Ctrl+Z` | Undo |
| `Ctrl+O` | Open file | `Ctrl+Y` | Redo |
| `Ctrl+F` | Find (`Enter`/`↓` next, `↑` previous) | `Ctrl+A` | Select all |
| `Ctrl+R` | Replace (`y` / `n` / `a` all) | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | Copy / Cut / Paste |
| `Ctrl+G` | Go to line | `Shift` + arrows | Select |
| `F1` | Show all shortcuts | `Ctrl+Q` | Quit (asks if there are unsaved changes) |

`Ctrl+C` copies — it does not quit. Replace is `Ctrl+R` because most terminals send `Ctrl+H` as
Backspace. Full reference: [docs/keyboard-shortcuts.md](docs/keyboard-shortcuts.md).

### Command line

```bash
filex read config.json                       # print the file to stdout
filex create notes.md                        # create an empty file (fails if it exists)
filex append notes.md "নতুন লাইন"            # add a line at the end
filex insert notes.md 1 "# শিরোনাম"          # insert at a 1-based line number
filex replace app.conf 8080 9090 --dry-run   # preview, then run without --dry-run
```

Every command that writes uses the same atomic save and backup as the editor, and keeps the
file's line endings and final newline. Details: [docs/commands.md](docs/commands.md).

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | General error; `replace` found no matches |
| `2` | Invalid command or arguments |
| `3` | File or path error (missing, directory, binary, not UTF-8, too large, already exists) |
| `4` | Permission denied |
| `5` | Write failed (disk full, I/O error, file changed during save) |
| `6` | No terminal available for the editor |

## How it works

```text
argv ─► CLI (cli.ts) ─┬─► commands/ ───────────────┐
                      └─► TUI (app.tsx, OpenTUI) ──┤
                               │                   ▼
                          editor core ──────► file engine ──► filesystem
                    (buffer, undo, search)   (validation, atomic save, backup)
                               ▲
                     i18n (bn / en) — every user-facing string
```

The editor core is a set of pure functions over an immutable state, which keeps undo cheap and
makes it testable without a terminal. Architecture notes: [docs/architecture.md](docs/architecture.md).
File-safety guarantees and their limits: [docs/security.md](docs/security.md).

## Documentation

| Document | Contents |
| --- | --- |
| [docs/commands.md](docs/commands.md) | CLI commands, options, behaviour and exit codes |
| [docs/keyboard-shortcuts.md](docs/keyboard-shortcuts.md) | Every shortcut, prompts, search rules, terminal quirks |
| [docs/architecture.md](docs/architecture.md) | Layers, state model, Unicode handling, save flow |
| [docs/security.md](docs/security.md) | Save procedure, backups, permissions, platform notes |
| [docs/development.md](docs/development.md) | Local setup, scripts, testing |
| [filex-project-documentation.md](filex-project-documentation.md) | Full project specification |

The detailed documents are written in Bangla.

## Roadmap

| Milestone | Scope | Status |
| --- | --- | --- |
| M0 | Foundation | ✅ |
| M1 | TUI shell | ✅ |
| M2 | Basic editing | ✅ |
| M3 | File operations and safe save | ✅ |
| M4 | Search/replace, undo/redo, selection | ✅ |
| M5 | Command-line interface | ✅ |
| M6 | Unicode and quality hardening | Next |
| M7 | Release (CI, npm) | ✅ |

## Known limitations

- Terminals and fonts differ in how wide they draw some Bangla conjuncts; alignment depends on
  your terminal.
- Tab characters are not rendered yet — pasted tabs become spaces.
- Files with mixed line endings are saved with a single style.
- `filex diff` and a configuration file are not implemented yet; backups cannot be disabled.
- `Ctrl+V` pastes FileX's own clipboard; use your terminal's paste (usually `Ctrl+Shift+V`) for
  text copied elsewhere.

## Contributing

Bug reports, Bangla rendering reports from different terminals, and pull requests are welcome.
Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
Report security issues privately as described in [SECURITY.md](SECURITY.md).

```bash
bun install
bun run typecheck
bun test
```

## License

[MIT](LICENSE) © dev-sajid007

## Acknowledgements

Built with [Bun](https://bun.sh), [OpenTUI](https://github.com/anomalyco/opentui) and
[React](https://react.dev).
