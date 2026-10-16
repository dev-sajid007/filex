# Architecture

## Layer

```text
 argv ──► CLI layer ──► TUI layer ──► Editor core ──► File engine ──► filesystem
          (cli.ts)      (app.tsx,     (core/)         (core/file-engine.ts)
                        components/)
                             ▲
                Localization (i18n/) — সব user-facing text
```

| Layer | দায়িত্ব | অবস্থা |
| --- | --- | --- |
| CLI | Argument parse, locale নির্বাচন, subcommand, exit code | ✅ |
| TUI | OpenTUI rendering, keyboard input, dialog ও status | Shell ✅ |
| Editor core | Buffer, cursor, selection, undo/redo, dirty state, search/replace | ✅ |
| File engine | Path validation, read/write, atomic save, backup | ✅ |
| Localization | বাংলা/ইংরেজি message; message-এর একক source | ✅ |

## বর্তমান source layout

```text
src/
├── index.tsx              # Entry: args → subcommand চালান, অথবা TTY যাচাই করে <App/>
├── cli.ts                 # parseArgs(): option, subcommand ও argument যাচাই
├── commands/
│   ├── index.ts           # runCommand(): help/version/read/create/append/insert/replace
│   ├── context.ts         # Load/save helper, stdout/stderr, error → exit code
│   ├── exit-codes.ts      # Exit code table ও FileError mapping
│   ├── lines.ts           # Final-newline-সচেতন line insert/append, replace
│   └── read.ts, create.ts, append.ts, insert.ts, replace.ts
├── app.tsx                # Shell: state store, key routing, open/save/quit flow
├── components/
│   ├── Header.tsx         # File path, নতুন/শুধু-পঠনযোগ্য tag, modified marker
│   ├── EditorViewport.tsx # Line number, visible rows, cursor
│   ├── PromptBar.tsx      # Input (path, search, line) ও y/n confirmation
│   ├── HelpView.tsx       # F1 shortcut তালিকা
│   ├── Segments.tsx       # Cursor/selection/match span rendering
│   └── StatusBar.tsx      # Shortcut hint, বার্তা, line/column
├── core/
│   ├── keymap.ts          # KeyEvent → CommandId
│   ├── prompt.ts          # Prompt state ও key → action
│   ├── search.ts          # Match খোঁজা, next/prev, replace
│   ├── undo-manager.ts    # Snapshot history ও typing grouping
│   ├── file-engine.ts     # Load (validation, encoding), safe save, backup
│   ├── errors.ts          # FileError ও errno mapping
│   ├── editor-buffer.ts   # Immutable buffer state ও edit/move operation
│   ├── editor-input.ts    # Editing key ও paste → buffer operation
│   └── viewport.ts        # Scroll follow ও row layout (cell window)
├── utils/
│   ├── paths.ts           # `~` expansion, display path, backup dir
│   └── unicode.ts         # Grapheme boundary ও terminal cell width
└── i18n/
    ├── bn.ts              # Source dictionary — key-এর সংজ্ঞা এখানেই
    ├── en.ts              # `Messages` type দিয়ে bn-এর সঙ্গে মেলাতে বাধ্য
    └── index.ts           # getMessages(), commandName(), isLocale()
```

## মূল নকশা সিদ্ধান্ত

### Keyboard routing

Prompt খোলা থাকলে সব key আগে `handlePromptKey()`-এ যায়। নইলে
`resolveCommand()` key-কে `CommandId`-তে রূপান্তর করে এবং `runCommand()` চালায়;
command না হলে `applyEditorKey()` buffer বদলায়। সবগুলো pure function, তাই
React ছাড়াই test করা যায়।

### App state store

`App`-এর state (`editor`, `doc`, `status`, `prompt`) একটি ref-এ থাকে যা
synchronously update হয়, তারপর re-render হয়। কারণ: render-এর আগে একাধিক
key আসতে পারে। সাধারণ `useState` হলে দ্বিতীয় handler পুরনো state দেখত —
যেমন টাইপের ঠিক পরেই `Ctrl+Q` buffer-কে পরিষ্কার ভেবে **অসংরক্ষিত পরিবর্তন
না জিজ্ঞাসা করেই** বন্ধ হয়ে যেত। Async save/open-ও শেষ হওয়ার পর store থেকে
সর্বশেষ state পড়ে।

### Open/save flow

```text
Ctrl+S ─► path আছে? ─ না ─► "সংরক্ষণের path" prompt ─┐
              │ হ্যাঁ                                    │
              ▼                                         ▼
          engine.save ◄─────────────────────────────────┘
              ├─ সফল ─► saved, তারপর continuation (quit/open)
              ├─ CONFLICT ─► overwrite? y ─► force save
              ├─ PERMISSION/READ_ONLY_FS ─► error + path prompt
              └─ অন্য error ─► error বার্তা, content অক্ষত

Ctrl+Q / Ctrl+O ─► dirty? ─ হ্যাঁ ─► "সংরক্ষণ করবেন?" y ─► save, তারপর continue
                                                     n ─► continue
                                                     Esc ─► বাতিল
```

`App` file engine-কে prop হিসেবে নেয় (`createFileEngine({ backupDir })`), তাই
test-এ backup বন্ধ রাখা বা অন্য folder দেওয়া যায়।

### Subcommands

`parseArgs()` একটি `Command` union ফেরত দেয়; `edit` ছাড়া সবগুলো
`runCommand()` চালায়, যা `CommandContext` (`engine`, `messages`, `stdout`,
`stderr`) নেয় এবং exit code ফেরত দেয় — তাই process না চালিয়েই test করা যায়।
লেখার command-গুলো editor-এর একই `FileEngine.save()` ব্যবহার করে, তাই safe
save, backup ও conflict check একই থাকে। `tests/cli-process.test.ts` আসল entry
point subprocess হিসেবে চালিয়ে exit code ও non-TTY আচরণ যাচাই করে।

### Localization

`bn.ts` হলো key-এর মূল সংজ্ঞা। `Messages` type সেখান থেকে তৈরি হয়, তাই
`en.ts`-এ কোনো key বাদ পড়লে বা বাড়তি থাকলে typecheck ব্যর্থ হয়।
Component-এ সরাসরি UI text লেখা যাবে না — `messages` prop ব্যবহার করুন।
Command-এর নাম `command.<id>` key-তে থাকে।

### Terminal width

Layout-এর হিসাব string length দিয়ে নয়, `Bun.stringWidth()` দিয়ে করা হয়।
বাংলায় এই দুটো আলাদা: `"খুঁজুন"`-এর length 6 কিন্তু terminal-এ 3 column।
Status bar জায়গা না থাকলে পুরো shortcut hint বাদ দেয়, মাঝখানে কাটে না।

### Quit ও terminal restore

`createCliRenderer({ exitOnCtrlC: false })` — `Ctrl+C` যেন unsaved পরিবর্তন
নষ্ট না করে। `Ctrl+Q`-তে `renderer.destroy()` এবং `await renderer.closed`
চালানোর পর process exit হয়, যাতে terminal state পুরোপুরি ফিরে আসে।

## পরিকল্পিত data flow (M2–M3)

1. CLI path ও option parse করে।
2. File engine target যাচাই করে content পড়ে।
3. Editor buffer content ও initial state নেয়।
4. Keyboard input buffer/cursor/selection update করে।
5. Buffer বদলালে dirty state সক্রিয় হয়।
6. Save-এ file engine নিরাপদে লেখে ([security.md](security.md))।
7. সফল হলে buffer-এর saved snapshot update হয়।
8. Error হলে localized বার্তা দেখায়; buffer-এর content নষ্ট হয় না।

## Buffer design

`EditorState` একটি immutable object: `lines: string[]`, `cursor`, `goalX`
এবং `savedText`। প্রতিটি operation (`insertText`, `backspace`, `moveVertical`
ইত্যাদি) নতুন state ফেরত দেয়, তাই React-এর সঙ্গে সহজে মেলে এবং M4-এর
undo/redo-তে পুরনো state রেখে দেওয়া যাবে। বড় file-এ benchmark করার পরেই
piece table বা rope বিবেচনা করা হবে।

`App` state বদলায় functional update দিয়ে (`setEditor(s => ...)`), যাতে
render-এর আগে একসঙ্গে অনেক key এলেও (দ্রুত typing, key repeat) কোনোটি
হারায় না।

### তিন ধরনের position

| ধারণা | একক | কোথায় |
| --- | --- | --- |
| `cursor.col` | UTF-16 offset, সবসময় grapheme boundary-তে | Buffer operation |
| Cell column (`cursorX`, `goalX`) | Terminal column (`Bun.stringWidth`) | উপর/নিচে movement, scroll |
| Status bar "কলাম" | Grapheme সংখ্যা + 1 | ব্যবহারকারীকে দেখানো |

- Left/Right, Backspace ও Delete একটি পুরো grapheme cluster (`Intl.Segmenter`)
  পার হয় বা মোছে — spec §8.2/§10.2 অনুযায়ী। ফলে Backspace `কি`-এর শুধু `ি`
  নয়, পুরো `কি` মুছে দেয়। বাংলা typing-এ শুধু শেষ code point মোছা বেশি
  স্বাভাবিক মনে হলে এই সিদ্ধান্ত পুনর্বিবেচনা করা যাবে।
- Up/Down `goalX` cell column মনে রাখে, তাই ছোট line পার হয়ে আবার আগের
  column-এ ফেরে।
- Viewport `layoutRow()` দিয়ে প্রতিটি line থেকে cell window কেটে নেয়; কোনো
  wide character window-এর কিনারায় পড়লে তার জায়গায় space বসে, যাতে row
  কখনও নির্ধারিত width ছাড়ায় না।

### Selection ও undo

`EditorState.anchor` selection-এর অন্য প্রান্ত (null = selection নেই)। Shift-সহ
movement anchor রাখে, Shift ছাড়া মুছে দেয়। সব edit একটি function দিয়ে হয় —
`replaceRange()` — তাই selection থাকলে typing, Backspace ও Delete সেটিকেই
বদলায়।

State immutable হওয়ায় undo history শুধু আগের `{ lines, cursor, anchor }`
snapshot রাখে; line array-এর অপরিবর্তিত অংশ ভাগাভাগি হয়। `savedText` snapshot-এ
থাকে না, তাই undo "saved" অবস্থা পেছায় না। `applyEditorKey()` প্রতিটি edit-এর
ধরন (`insert` / `delete` / `other` / `move`) জানায়, যা দিয়ে grouping হয়।

### Viewport rendering

`layoutRow()` একটি line-কে `Segment[]`-এ ভাগ করে (`text` / `match` /
`selection` / `cursor`), প্রাধান্য: cursor > selection > match। কোনো mark
grapheme-এর অংশ ছুঁলে পুরো grapheme highlight হয়।

### Input

- Printable text আসে `KeyEvent.sequence` থেকে, `name` থেকে নয় — একসঙ্গে
  আসা `কি`-এর মতো chunk-এ `name` খালি থাকে।
- Paste-এর byte UTF-8 decode করা হয়, `\r\n` → `\n`, এবং control character
  (escape sequence সহ) বাদ দেওয়া হয়। Tab rendering না আসা পর্যন্ত tab-কে
  space-এ রূপান্তর করা হয়।
- Line ending: buffer সব line ending `\n`-এ normalize করে; file engine
  load-এ মূল ধরন (`LF`/`CRLF`) ও BOM মনে রাখে এবং save-এ ফিরিয়ে দেয়।
