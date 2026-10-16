# FileX --- বাংলা-প্রথম Terminal File Editor

**প্রকল্পের পূর্ণাঙ্গ ডকুমেন্টেশন ও বাস্তবায়ন পরিকল্পনা**

-   **প্রকল্পের নাম:** FileX (অস্থায়ী নাম; npm নাম প্রকাশের আগে যাচাই করতে
    হবে)
-   **ধরন:** Terminal User Interface (TUI) এবং command-line file editing
    tool
-   **প্রধান ভাষা:** TypeScript
-   **Runtime ও package manager:** Bun
-   **TUI framework:** OpenTUI + React
-   **প্রাথমিক লক্ষ্য:** Linux; সম্ভব হলে macOS ও Windows-এও চালানো
-   **ডকুমেন্টের অবস্থা:** প্রস্তাবিত specification; বাস্তবায়নের সঙ্গে মিলিয়ে
    আপডেট করতে হবে

------------------------------------------------------------------------

## 1. প্রকল্পের সারসংক্ষেপ

FileX হলো টার্মিনালের ভেতরে ফাইল খোলা, সম্পাদনা, সংরক্ষণ এবং সাধারণ file
operation চালানোর জন্য একটি বাংলা-প্রথম CLI editor। এটি Bun ও TypeScript
দিয়ে তৈরি হবে এবং OpenTUI + React ব্যবহার করে interactive terminal
interface দেখাবে।

FileX-এর UI, menu, prompt, status message এবং help text-এ বাংলা থাকবে।
কোড, command, file path এবং programming-language syntax অপরিবর্তিত থাকবে।
ব্যবহারকারী চাইলে ইংরেজি UI-ও বেছে নিতে পারবেন।

**গুরুত্বপূর্ণ:** OpenTUI UI rendering ও input handling-এর ভিত্তি দেবে। পূর্ণাঙ্গ
editor-এর text buffer, cursor movement, selection, undo/redo, file
encoding এবং save logic আলাদাভাবে implement বা উপযুক্ত library দিয়ে
integrate করতে হবে।

### 1.1 মূল লক্ষ্য

1.  টার্মিনাল থেকে দ্রুত ফাইল খুলে সম্পাদনা করা।
2.  বাংলা ও ইংরেজি UI সমর্থন করা।
3.  UTF-8 text এবং বাংলা Unicode content সঠিকভাবে সংরক্ষণ করা।
4.  Keyboard-first workflow রাখা।
5.  পরিবর্তন সংরক্ষণের আগে clear dirty-state ও confirmation দেখানো।
6.  File operations-এ নিরাপত্তা, error handling এবং predictable behavior
    নিশ্চিত করা।
7.  Bun দিয়ে development করা এবং npm registry-তে package প্রকাশের উপযোগী
    রাখা।

### 1.2 প্রকল্পের বাইরে --- প্রথম সংস্করণে

-   পূর্ণ IDE বা language server platform
-   Built-in terminal emulator
-   Collaborative editing
-   Cloud sync
-   সব programming language-এর advanced semantic tooling
-   GUI application
-   অজানা file format-এর binary editing

------------------------------------------------------------------------

## 2. ব্যবহারকারী ও প্রধান use case

### লক্ষ্য ব্যবহারকারী

-   Linux ও terminal ব্যবহারকারী developer
-   SSH দিয়ে remote server পরিচালনাকারী ব্যবহারকারী
-   দ্রুত configuration file পরিবর্তন করতে চান এমন administrator
-   বাংলা UI পছন্দ করেন এমন ব্যবহারকারী
-   ছোট, keyboard-driven editor খুঁজছেন এমন ব্যবহারকারী

### Use case

-   `filex nginx.conf` দিয়ে configuration file খোলা
-   `filex .` দিয়ে বর্তমান directory থেকে file নির্বাচন
-   লেখা পরিবর্তন করে `Ctrl+S` দিয়ে save
-   Search/replace করে পরিবর্তন preview করা
-   Save করার আগে unsaved changes-এর সতর্কতা পাওয়া
-   `filex --lang en` দিয়ে ইংরেজি UI ব্যবহার করা
-   `filex --help` দিয়ে command ও keyboard shortcut দেখা

------------------------------------------------------------------------

## 3. প্রযুক্তি ও dependency strategy

  -----------------------------------------------------------------------
  অংশ                     পছন্দ                    কাজ
  ----------------------- ----------------------- -----------------------
  Runtime                 Bun                     TypeScript execution,
                                                  scripts, package
                                                  management

  Language                TypeScript              Application ও editor
                                                  logic

  TUI                     OpenTUI                 Terminal rendering ও
                                                  input interaction

  UI layer                React integration for   Component-based
                          OpenTUI                 interface

  File I/O                Bun APIs অথবা           File read/write,
                          Node-compatible         metadata
                          `node:fs` APIs          

  Tests                   `bun test`              Unit ও integration
                                                  tests

  Formatting/lint         নির্বাচিত TypeScript     Consistent code quality
                          tooling                 

  Package publishing      npm registry            Global CLI installation
  -----------------------------------------------------------------------

### Dependency নীতি

-   OpenTUI-এর বর্তমান official template ও API দেখে dependency নির্বাচন
    করতে হবে।
-   React-based OpenTUI template ব্যবহার করতে হবে; template-এ Solid/React
    নির্বাচন থাকলে React বেছে নিতে হবে।
-   Bun-কে development runtime ও package manager হিসেবে ব্যবহার করতে হবে।
-   `package.json`-এ runtime compatibility স্পষ্ট করতে হবে।
-   কোনো dependency যোগ করার আগে তার license, maintenance status,
    platform support এবং terminal compatibility যাচাই করতে হবে।
-   Editor buffer-এর জন্য নিজস্ব implementation নাকি library ব্যবহার করা
    হবে, তা performance ও Unicode requirements পরীক্ষা করে ঠিক করতে হবে।

------------------------------------------------------------------------

## 4. ব্যবহারকারীর অভিজ্ঞতা (UX)

### 4.1 প্রধান editor layout

প্রস্তাবিত layout:

``` text
┌─ ফাইলএক্স ─────────────────────────────────────────────┐
│ ফাইল: src/index.ts                 পরিবর্তিত [*]       │
├────────────────────────────────────────────────────────┤
│  1 │ const message = "হ্যালো বিশ্ব";                    │
│  2 │ console.log(message);                              │
│  3 │                                                    │
│  4 │                                                    │
├────────────────────────────────────────────────────────┤
│ Ctrl+S সংরক্ষণ  Ctrl+F খুঁজুন  Ctrl+Q বন্ধ  লাইন 2     │
└────────────────────────────────────────────────────────┘
```

এটি ধারণামূলক layout, চালু application-এর screenshot নয়।

### 4.2 UI অঞ্চল

1.  **Title/Header:** FileX নাম, বর্তমান file path, modified state।
2.  **Editor viewport:** line numbers, text, cursor, selection।
3.  **Prompt/overlay:** open-file dialog, search, replace, confirmation।
4.  **Status bar:** shortcut, cursor line/column, save state,
    error/success।
5.  **Optional file picker:** directory navigation ও file selection।

### 4.3 বাংলা UI ও English UI

প্রাথমিক ভাষা হবে বাংলা (`bn`)। ইংরেজি (`en`) বিকল্প থাকবে।

বাংলা label-এর উদাহরণ:

  English key/meaning   বাংলা
  --------------------- --------------------------
  Open file             ফাইল খুলুন
  Save                  সংরক্ষণ
  Save changes?         পরিবর্তনগুলো সংরক্ষণ করবেন?
  Search                খুঁজুন
  Replace               প্রতিস্থাপন
  Unsaved changes       অসংরক্ষিত পরিবর্তন
  File not found        ফাইল পাওয়া যায়নি
  Permission denied     অনুমতি নেই
  Read-only file        শুধু-পঠনযোগ্য ফাইল
  Quit editor           সম্পাদক বন্ধ করুন
  Cancel                বাতিল
  Confirm               নিশ্চিত করুন

User-facing text source code-এর বিভিন্ন জায়গায় hardcode না করে
`src/i18n/` dictionary-তে রাখতে হবে।

------------------------------------------------------------------------

## 5. CLI specification

Package name `filex` অস্থায়ী। npm registry-তে নামের availability ও
trademark যাচাই না করে publish করা যাবে না।

### 5.1 Command table

  -------------------------------------------------------------------------------------
  Command                               উদ্দেশ্য                  প্রস্তাবিত behavior
  ------------------------------------- ----------------------- -----------------------
  `filex [path]`                        Editor খুলুন              Path দিলে
                                                                file/directory open
                                                                flow

  `filex .`                             বর্তমান directory        File picker বা
                                                                directory-open view

  `filex create <path>`                 File তৈরি               Existing file overwrite
                                                                না করে error

  `filex read <path>`                   File পড়ুন                Terminal-এ content
                                                                দেখান

  `filex edit <path>`                   File edit করুন           Interactive editor খুলুন

  `filex replace <path> <old> <new>`    Text replace            Preview/dry-run option
                                                                বিবেচনা

  `filex insert <path> <line> <text>`   Line-এ text insert      Line numbering স্পষ্টভাবে
                                                                1-based

  `filex append <path> <text>`          শেষে text যোগ           Newline behavior
                                                                documentation-এ নির্দিষ্ট

  `filex diff <path>`                   পরিবর্তন দেখান           MVP-তে saved
                                                                snapshot/backup-এর সঙ্গে
                                                                diff; নইলে feature
                                                                পিছিয়ে দিন

  `filex --lang bn`                     বাংলা UI                CLI option

  `filex --lang en`                     English UI              CLI option

  `filex --help`                        Help                    Command ও shortcut list

  `filex --version`                     Version                 `package.json` থেকে
                                                                version
  -------------------------------------------------------------------------------------

### 5.2 CLI design principles

-   Command argument-এর path-এ space থাকলেও সঠিকভাবে কাজ করতে হবে।
-   ভুল argument হলে বাংলায় সংক্ষিপ্ত error এবং usage দেখাতে হবে।
-   Destructive operation-এর আগে confirmation চাইতে হবে।
-   Non-interactive mode-এ confirmation সম্ভব না হলে safe failure বা
    explicit force flag দরকার।
-   File operation ব্যর্থ হলে non-zero exit code দিতে হবে।
-   `--help` ও `--version` interactive TUI চালু করবে না।
-   TUI launch করা সম্ভব নয় এমন non-TTY environment-এ স্পষ্ট error বা উপযুক্ত
    command mode দিতে হবে।

------------------------------------------------------------------------

## 6. প্রস্তাবিত project structure

``` text
filex/
├── src/
│   ├── index.tsx                 # TUI entry point
│   ├── app.tsx                   # Main application shell
│   ├── cli.ts                    # CLI parsing and dispatch
│   ├── commands/
│   │   ├── create.ts
│   │   ├── read.ts
│   │   ├── edit.ts
│   │   ├── replace.ts
│   │   ├── insert.ts
│   │   ├── append.ts
│   │   └── diff.ts
│   ├── components/
│   │   ├── Editor.tsx
│   │   ├── LineNumbers.tsx
│   │   ├── StatusBar.tsx
│   │   ├── FilePicker.tsx
│   │   ├── SearchDialog.tsx
│   │   ├── ReplaceDialog.tsx
│   │   └── ConfirmDialog.tsx
│   ├── core/
│   │   ├── editor-buffer.ts
│   │   ├── cursor.ts
│   │   ├── selection.ts
│   │   ├── undo-manager.ts
│   │   ├── file-engine.ts
│   │   ├── save-manager.ts
│   │   ├── backup.ts
│   │   └── errors.ts
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── bn.ts
│   │   └── en.ts
│   └── utils/
│       ├── paths.ts
│       ├── terminal.ts
│       └── unicode.ts
├── tests/
│   ├── editor-buffer.test.ts
│   ├── file-engine.test.ts
│   ├── undo-manager.test.ts
│   ├── i18n.test.ts
│   └── cli.test.ts
├── docs/
│   ├── architecture.md
│   ├── commands.md
│   ├── keyboard-shortcuts.md
│   ├── development.md
│   └── security.md
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
└── .gitignore
```

প্রকৃত implementation-এ প্রয়োজন অনুসারে structure ছোট বা বড় করা যাবে। প্রতিটি
file প্রথম দিনেই তৈরি করা বাধ্যতামূলক নয়।

------------------------------------------------------------------------

## 7. Architecture ও data flow

### 7.1 Layer

**CLI layer** - Arguments parse করে - Command dispatch করে - Locale ও
mode নির্বাচন করে - Exit code নির্ধারণ করে

**TUI layer** - OpenTUI component render করে - Keyboard input গ্রহণ করে -
Dialog ও status প্রদর্শন করে - Editor core-এর state দেখায়

**Editor core** - Text buffer পরিচালনা করে - Cursor ও selection রাখে -
Undo/redo history পরিচালনা করে - Dirty state নির্ণয় করে - Search/replace
operation করে

**File engine** - Path resolve ও validate করে - File read/write করে -
Permission ও filesystem error সামলায় - Atomic save এবং backup policy
বাস্তবায়ন করে

**Localization layer** - বাংলা/ইংরেজি message সরবরাহ করে - Missing
translation test করে - UI-তে message-এর একক source of truth রাখে

### 7.2 প্রধান data flow

1.  CLI path ও option parse করে।
2.  File engine target file যাচাই করে এবং content পড়ে।
3.  Editor buffer content ও initial state গ্রহণ করে।
4.  Keyboard input buffer/cursor/selection update করে।
5.  Buffer বদলালে dirty state সক্রিয় হয়।
6.  Save action এলে file engine নিরাপদভাবে লিখে।
7.  Save সফল হলে buffer-এর saved snapshot আপডেট হয়।
8.  Error হলে user-facing localized message দেখানো হয়; dirty content নষ্ট
    করা যাবে না।

------------------------------------------------------------------------

## 8. Editor core requirements

### 8.1 Buffer

Buffer হলো editor-এর in-memory text representation।

প্রয়োজনীয় ক্ষমতা:

-   File content load করা
-   Character/text insertion ও deletion
-   Selection replace করা
-   Line ও column অনুযায়ী access
-   Buffer change notification
-   Saved snapshot-এর সঙ্গে dirty-state comparison
-   বড় file-এর জন্য performance limit বা fallback

MVP-তে line-based array ব্যবহার করা যেতে পারে, কিন্তু বড় file ও frequent
edit-এর performance পরীক্ষা করতে হবে। ভবিষ্যতে rope, piece table বা অন্য
data structure বিবেচনা করা যেতে পারে।

### 8.2 Cursor ও selection

-   Arrow keys দিয়ে cursor movement
-   Home/End দিয়ে line-এর শুরু/শেষে যাওয়া
-   Page Up/Page Down
-   Backspace/Delete
-   Shift+Arrow দিয়ে selection (যদি terminal input API সঠিকভাবে support
    করে)
-   Line/column status
-   Unicode text-এর জন্য cursor position সঠিক রাখা

### 8.3 Undo/redo

-   প্রতিটি keystroke-কে আলাদা history entry না বানিয়ে typing group করার
    কৌশল বিবেচনা করতে হবে।
-   Undo/redo buffer, selection ও cursor state-এর সঙ্গে consistent হতে
    হবে।
-   Undo history memory সীমা নির্ধারণ করতে হবে।
-   Save করলেই history মুছে ফেলতে হবে---এমন বাধ্যবাধকতা নেই।

### 8.4 Search/replace

-   Current buffer-এ text search
-   Next/previous match
-   Case-sensitive option ভবিষ্যতে যোগ করা যেতে পারে
-   Replace current / replace all
-   Replace all-এর আগে match count দেখানো
-   Undo দিয়ে replace operation ফিরিয়ে নেওয়া
-   Empty search string-এর আচরণ নির্দিষ্ট করা

------------------------------------------------------------------------

## 9. File I/O, encoding ও save strategy

### 9.1 Encoding

-   Default text encoding: UTF-8
-   বাংলা Unicode content read/write round-trip test করতে হবে।
-   BOM থাকলে তার handling স্পষ্টভাবে নির্ধারণ করতে হবে।
-   Invalid UTF-8 বা binary-looking content শনাক্ত হলে সতর্কতা দেখাতে হবে।
-   Line ending (`LF`/`CRLF`) সম্ভব হলে preserve করতে হবে।
-   Final newline-এর অবস্থা অকারণে পরিবর্তন করা যাবে না।

### 9.2 Safe save

প্রস্তাবিত save procedure:

1.  Original path ও metadata যাচাই।
2.  একই directory-তে temporary file লিখুন।
3.  Write সফল হয়েছে নিশ্চিত করুন।
4.  Original file-এর mode/permission preserve করার নীতি প্রয়োগ করুন।
5.  Temporary file-কে target-এ atomic rename করুন---যেখানে
    platform/filesystem সমর্থন করে।
6.  Failure হলে temp file পরিষ্কার করুন এবং original content অক্ষত রাখার
    চেষ্টা করুন।
7.  Save সফল হলে dirty state clear করুন।

Atomic rename সব filesystem ও platform-এ একই semantics দেয় না। তাই
implementation ও tests-এ platform limitation নথিভুক্ত করতে হবে।

### 9.3 Backup

-   Automatic backup configurable হবে।
-   Backup default filename collision তৈরি করবে না।
-   Backup-এ sensitive data থাকতে পারে---এটি স্পষ্টভাবে document করতে হবে।
-   Backup creation ব্যর্থ হলে user-কে জানাতে হবে।
-   Backup policy ও retention limit নির্ধারণ করতে হবে।
-   Backup disabled থাকলেও safe save বজায় রাখতে হবে।

### 9.4 File permission

-   Read-only file হলে edit/save behavior স্পষ্টভাবে জানাতে হবে।
-   Permission error হলে raw stack trace না দেখিয়ে localized message
    দিতে হবে।
-   File ownership ও permission অকারণে পরিবর্তন করা যাবে না।
-   Privilege escalation বা `sudo` স্বয়ংক্রিয়ভাবে চালানো যাবে না।

------------------------------------------------------------------------

## 10. বাংলা ও Unicode support

বাংলা-প্রথম UI-র জন্য Unicode সঠিকভাবে সামলানো একটি core requirement।

### 10.1 গুরুত্বপূর্ণ পার্থক্য

একটি visible grapheme, একটি Unicode code point এবং একটি UTF-16 code unit
একই জিনিস নয়। বাংলা কার, যুক্তাক্ষর, combining mark এবং emoji-এর কারণে
সাধারণ string index ব্যবহার করে cursor movement করলে ভুল position হতে
পারে।

### 10.2 Requirements

-   UTF-8 read/write
-   বাংলা ও ইংরেজি mixed text
-   যুক্তাক্ষর, কার ও combining mark
-   Emoji ও non-BMP character
-   Terminal cell width ও logical cursor position আলাদা করে বিবেচনা
-   Cursor movement ও deletion-এ grapheme cluster handling
-   Terminal font ও emulator-এর সীমাবদ্ধতা documentation-এ উল্লেখ
-   বাংলা content-এর round-trip, insert/delete, cursor এবং search test

OpenTUI terminal rendering-এর width handling কীভাবে করে তা official API
ও behavior দিয়ে যাচাই করতে হবে। প্রয়োজনে `Intl.Segmenter`-এর মতো platform
capability পরীক্ষা করা যেতে পারে, কিন্তু এটি একাই terminal cell width
নির্ধারণের সম্পূর্ণ সমাধান নয়।

------------------------------------------------------------------------

## 11. Keyboard shortcut specification

প্রস্তাবিত default shortcuts:

  Shortcut                কাজ
  ----------------------- ---------------------
  `Ctrl+S`                Save
  `Ctrl+O`                Open file
  `Ctrl+F`                Search
  `Ctrl+R`                Replace
  `Ctrl+Z`                Undo
  `Ctrl+Y`                Redo
  `Ctrl+Shift+Z`          Redo (শুধু kitty keyboard protocol সমর্থিত terminal-এ)
  `Ctrl+A`                Select all
  `Ctrl+G`                Go to line
  `Ctrl+C` / `Ctrl+X` / `Ctrl+V`  Copy / Cut / Paste (spec-এ ছিল না; selection-এর জন্য যোগ)
  `F1`                    Shortcut help
  `Ctrl+Q`                Quit
  `Esc`                   Dialog বন্ধ/বাতিল
  Arrow keys              Cursor movement
  `Home` / `End`          Line-এর শুরু/শেষ
  `PageUp` / `PageDown`   Viewport navigation

Shortcut collision ও terminal-specific behavior পরীক্ষা করতে হবে। TUI-তে
`Ctrl+Q` বা অন্য control key সব terminal-এ একইভাবে পৌঁছাবে ধরে নেওয়া যাবে
না। Shortcut help screen-এ দেখাতে হবে।

বাস্তবায়নের সময় পাওয়া সীমাবদ্ধতা:

-   বেশিরভাগ terminal `Ctrl+H`-কে Backspace (`0x08`) হিসেবে পাঠায়, তাই
    Replace-এর জন্য `Ctrl+R` ব্যবহার করা হয়েছে।
-   Legacy terminal-এ `Ctrl+Shift+Z` আর `Ctrl+Z` আলাদা করা যায় না; তাই
    `Ctrl+Y` portable redo shortcut।

------------------------------------------------------------------------

## 12. Configuration ও localization

### 12.1 Language নির্বাচন

প্রস্তাবিত precedence:

1.  CLI option `--lang`
2.  FileX config
3.  Environment variable (যদি support করা হয়)
4.  Default `bn`

`--lang` কীভাবে config-এর উপর precedence পাবে, তা implementation-এ
consistent রাখতে হবে।

### 12.2 Configuration

ভবিষ্যতের config-এ থাকতে পারে:

``` json
{
  "language": "bn",
  "backup": true,
  "lineNumbers": true,
  "wordWrap": false,
  "tabSize": 2,
  "insertSpaces": true
}
```

এটি প্রস্তাবিত উদাহরণ; configuration loader implement না হওয়া পর্যন্ত কার্যকর
config হিসেবে ধরে নেওয়া যাবে না।

### 12.3 Config location

Linux-এ XDG Base Directory convention অনুসরণ করা যেতে পারে, যেমন
`$XDG_CONFIG_HOME/filex/` অথবা fallback `~/.config/filex/`।
Platform-specific location আলাদা হলে documentation-এ লিখতে হবে।

------------------------------------------------------------------------

## 13. Security ও reliability

File editor filesystem-এ write করতে পারে, তাই safe defaults আবশ্যক।

-   File delete command প্রথম সংস্করণে না রাখাই ভালো; থাকলে confirmation
    আবশ্যক।
-   Existing file create command দিয়ে overwrite করা যাবে না, যদি না user
    explicit flag দেয়।
-   Path traversal-কে নিজে থেকেই security vulnerability ধরে নেওয়া যাবে
    না---তবে intended root boundary থাকলে সেটি enforce করতে হবে।
-   Symlink, hard link, permission ও race condition-এর behavior নির্দিষ্ট
    করতে হবে।
-   Save করার সময় target file অন্য process পরিবর্তন করেছে কি না তা শনাক্ত
    করার optimistic conflict check বিবেচনা করতে হবে।
-   Sensitive content log করা যাবে না।
-   User input-কে shell command হিসেবে execute করা যাবে না।
-   Error handling-এ stack trace default UI-তে না দেখিয়ে debug mode-এ
    রাখা যেতে পারে।
-   Crash বা forced termination-এ recovery/autosave পরবর্তী milestone-এর
    feature।
-   কোনো file modify করার আগে path ও target type যাচাই করতে হবে।
-   Directory-কে regular file ধরে পড়া বা overwrite করার চেষ্টা করা যাবে
    না।

------------------------------------------------------------------------

## 14. Error handling ও exit codes

প্রস্তাবিত exit code:

  Code   অর্থ
  ------ -----------------------------
  `0`    সফল
  `1`    সাধারণ error
  `2`    Invalid command/argument
  `3`    File/path error
  `4`    Permission error
  `5`    Save/write error
  `6`    TTY/UI initialization error

এই code mapping প্রস্তাবিত; implementation-এ স্থির করে tests ও
documentation-এ একই mapping ব্যবহার করতে হবে।

Error message-এর উদাহরণ:

``` text
ফাইল পাওয়া যায়নি: config.json
সমাধান: path যাচাই করুন অথবা `filex create config.json` ব্যবহার করুন।

ফাইল সংরক্ষণ করা যায়নি: Permission denied
পরিবর্তনগুলো এখনও editor-এ রয়েছে।
```

------------------------------------------------------------------------

## 15. Testing strategy

### 15.1 Unit tests

-   Buffer insert/delete
-   Cursor movement
-   Selection replace
-   Undo/redo
-   Dirty-state tracking
-   Search/replace
-   বাংলা Unicode grapheme cases
-   Locale fallback
-   Path normalization

### 15.2 File engine integration tests

-   UTF-8 read/write
-   New file creation
-   Existing file overwrite protection
-   Permission failure
-   Directory path rejection
-   Save failure behavior
-   Line ending preservation
-   Backup creation
-   Atomic save behavior যেখানে পরীক্ষা সম্ভব

### 15.3 CLI tests

-   `--help`
-   `--version`
-   Unknown command
-   Missing argument
-   Path-এ spaces
-   Non-TTY environment
-   Non-zero exit code
-   `--lang bn` ও `--lang en`

### 15.4 Manual terminal tests

-   Fedora/Linux terminal
-   SSH session
-   ছোট terminal window
-   বাংলা font/width
-   Resize event
-   Ctrl key behavior
-   TUI crash বা quit-এর পর terminal state restore

### 15.5 Test command

Bun test runner ব্যবহার করলে:

``` bash
bun test
```

কোনো test script `package.json`-এ যোগ করা থাকলে:

``` bash
bun run test
```

------------------------------------------------------------------------

## 16. Development setup

### 16.1 Prerequisites

-   Supported version-এর Bun
-   Git
-   Terminal emulator
-   OpenTUI-এর supported platform requirements
-   TypeScript ও React সম্পর্কে মৌলিক ধারণা

### 16.2 Project bootstrap

OpenTUI-এর official repository/documentation-এ বর্তমান template command
যাচাই করে React template নির্বাচন করতে হবে। Template command version
অনুযায়ী বদলাতে পারে।

প্রাথমিক workflow:

``` bash
bun --version
bun create opentui@latest filex
cd filex
bun install
bun run dev
```

যদি template command পরিবর্তিত হয়ে থাকে, official OpenTUI
documentation-এর নির্দেশনা অনুসরণ করতে হবে। Template-এ React option এলে
সেটি নির্বাচন করতে হবে।

### 16.3 Development workflow

``` bash
# Project চালু
bun run dev

# Test
bun test

# Package scripts দেখুন
bun run

# Dependency install/update
bun install
```

এই command-গুলো project-এর actual `package.json` scripts ও template
version অনুযায়ী adjust করতে হবে।

------------------------------------------------------------------------

## 17. Package metadata ও npm publishing

npm package publish করার আগে package name, license, README, version,
entry point এবং executable mapping যাচাই করতে হবে।

### 17.1 `package.json`-এর প্রয়োজনীয় metadata

প্রস্তাবিত fields:

-   `name`
-   `version`
-   `description`
-   `license`
-   `repository`
-   `homepage`
-   `bugs`
-   `keywords`
-   `files`
-   `bin`
-   `engines` অথবা runtime compatibility documentation
-   `scripts`

`bin` field-এর command `filex`-কে build output-এর executable CLI entry
point-এ map করতে হবে। Published executable-এর শুরুতে প্রয়োজনীয় shebang
থাকতে হবে এবং build output সঠিকভাবে include হতে হবে।

### 17.2 Publishing checklist

1.  npm package name availability যাচাই।
2.  Version ও changelog update।
3.  Typecheck ও tests pass।
4.  Clean build।
5.  `npm pack --dry-run` দিয়ে package contents যাচাই।
6.  Package-এ source/build files ও license অন্তর্ভুক্ত আছে নিশ্চিত করা।
7.  Clean temporary environment-এ install করে CLI smoke test।
8.  npm authentication যাচাই।
9.  `npm publish` চালানো।
10. Published package global install করে test করা।

Bun development-এর জন্য ব্যবহার হবে; npm registry-তে প্রকাশ করতে
`npm publish` ব্যবহার করা যেতে পারে।

### 17.3 সম্ভাব্য install workflow

``` bash
# npm registry থেকে global install
npm install -g <published-package-name>

# চালানো
filex --help
filex ./example.ts
```

নাম ও publish সম্পন্ন না হওয়া পর্যন্ত `<published-package-name>` placeholder
থাকবে।

------------------------------------------------------------------------

## 18. Versioning ও release policy

Semantic Versioning অনুসরণ করার প্রস্তাব:

-   `0.x.y`: প্রাথমিক development; breaking change সম্ভব
-   `1.0.0`: documented MVP stable
-   Patch: bug fix
-   Minor: backward-compatible feature
-   Major: breaking CLI/API/config change

প্রতিটি release-এ অন্তর্ভুক্ত করতে হবে:

-   Version
-   Added/changed/fixed items
-   Known limitations
-   Supported runtime/platform information
-   Migration note (প্রয়োজন হলে)

------------------------------------------------------------------------

## 19. Roadmap ও milestones

### M0 --- Foundation

-   [x] Package name নির্বাচন (`filex-editor`; command `filex`)
-   [x] Bun ও OpenTUI React template bootstrap
-   [x] Project scripts ও TypeScript setup
-   [x] Initial app render

### M1 --- TUI shell

-   [x] Header ও status bar
-   [x] Editor viewport placeholder
-   [x] Keyboard event routing
-   [x] বাংলা/ইংরেজি dictionary
-   [x] Terminal resize handling

### M2 --- Basic editing

-   [x] Text buffer
-   [x] Cursor movement
-   [x] Insert/delete
-   [x] Line numbers
-   [x] Dirty-state indicator

### M3 --- File operations

-   [x] Open file
-   [x] Save file
-   [x] Save-as বা নতুন file
-   [x] Error handling
-   [x] Safe save ও backup policy

### M4 --- Productivity

-   [x] Search/replace
-   [x] Undo/redo
-   [x] Go to line
-   [x] Selection
-   [x] Keyboard shortcut help

### M5 --- CLI

-   [x] Command parser
-   [x] Read/create/append/insert/replace
-   [x] Help/version
-   [x] Exit code tests
-   [x] Non-TTY behavior

### M6 --- Unicode ও quality

-   [ ] বাংলা grapheme test
-   [ ] Line ending preservation
-   [ ] Terminal compatibility
-   [ ] Performance test
-   [ ] Security review

### M7 --- Release

-   [x] README ও license
-   [x] CI checks
-   [x] Package dry run
-   [x] npm name/metadata validation
-   [x] npm publish
-   [x] Installation test

------------------------------------------------------------------------

## 20. Definition of Done

প্রথম usable release-কে সম্পন্ন বলা যাবে যখন:

-   [ ] `filex <path>` দিয়ে file editor চালু হয়।
-   [ ] ব্যবহারকারী text insert/delete করতে পারেন।
-   [ ] `Ctrl+S` দিয়ে file save হয়।
-   [ ] বাংলা UTF-8 text read/write round-trip ঠিক থাকে।
-   [ ] Unsaved changes থাকলে quit-এর আগে সতর্কতা আসে।
-   [ ] File/permission/write errors পরিষ্কারভাবে দেখানো হয়।
-   [ ] বাংলা ও ইংরেজি locale কাজ করে।
-   [ ] Unit ও integration tests pass করে।
-   [ ] README-তে installation, commands, shortcuts ও limitations লেখা
    থাকে।
-   [ ] Package clean install থেকে CLI হিসেবে চালানো যায়।

------------------------------------------------------------------------

## 21. পরিচিত ঝুঁকি ও সিদ্ধান্ত

### OpenTUI API পরিবর্তন

OpenTUI-এর API/template পরিবর্তন হতে পারে। Official documentation ও
installed package version-কে source of truth হিসেবে ব্যবহার করতে হবে।

### বাংলা terminal rendering

সব terminal emulator ও font বাংলা অক্ষরের width একইভাবে render নাও করতে
পারে। বাস্তব terminal testing আবশ্যক।

### Editor performance

একটি সাধারণ line array ছোট file-এর জন্য যথেষ্ট হতে পারে, কিন্তু বড় file-এ
slow হতে পারে। Benchmark ছাড়া advanced buffer structure নির্বাচন করা উচিত
নয়।

### File safety

Atomic rename, permissions, symlinks ও external file modification-এর
আচরণ platform-specific হতে পারে। Safe-save implementation-এর সীমাবদ্ধতা
document করতে হবে।

### Package name

`filex` নামটি provisional। npm availability, existing project conflict ও
trademark যাচাই করতে হবে।

------------------------------------------------------------------------

## 22. Documentation map

পরবর্তী পর্যায়ে এই document থেকে আলাদা documentation file তৈরি করা উচিত:

-   `README.md` --- overview, install, quick start
-   `docs/architecture.md` --- layers, state flow, buffer design
-   `docs/commands.md` --- command arguments ও exit codes
-   `docs/keyboard-shortcuts.md` --- shortcut reference
-   `docs/development.md` --- local setup, test, build, release
-   `docs/security.md` --- filesystem safety, backup, permissions
-   `CONTRIBUTING.md` --- contribution workflow
-   `CHANGELOG.md` --- version history

------------------------------------------------------------------------

## 23. পরবর্তী বাস্তব কাজ

1.  Official OpenTUI template দিয়ে Bun + TypeScript + React project
    তৈরি।
2.  Template ও dependency version pin করা।
3.  বাংলা header/status bar-সহ প্রথম TUI screen render করা।
4.  Editor buffer-এর জন্য unit tests লেখা।
5.  File open/save যোগ করা।
6.  Unicode, save safety ও keyboard handling পরীক্ষা করা।
7.  CLI commands ও npm packaging যোগ করা।

**প্রকল্পের মূল নীতি:** আগে নিরাপদ, পরীক্ষিত এবং ব্যবহারযোগ্য text editor;
তারপর advanced TUI, syntax highlighting ও অতিরিক্ত productivity feature।
