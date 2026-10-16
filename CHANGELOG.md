# Changelog

এই project [Semantic Versioning](https://semver.org) অনুসরণ করে। `0.x`
পর্যায়ে breaking change হতে পারে।

## [Unreleased]

### যোগ হয়েছে

- OpenTUI React template থেকে Bun + TypeScript project (M0)।
- TUI shell: header, editor viewport placeholder, status bar (M1)।
- বাংলা (default) ও ইংরেজি UI; `--lang bn|en` option।
- Keyboard shortcut routing; `Ctrl+Q` দিয়ে বন্ধ, `Esc` দিয়ে বার্তা মুছুন।
  বাকি shortcut চাপলে "এখনও চালু হয়নি" বার্তা।
- Terminal resize handling; ৪০×৮-এর চেয়ে ছোট হলে সতর্কতা।
- Status bar terminal width অনুযায়ী shortcut hint দেখায়।
- Text buffer ও editing (M2): লেখা, Enter, Tab, Backspace/Delete, paste।
- Cursor movement: Arrow, Home/End, PageUp/PageDown; উপর/নিচে visual column
  বজায় থাকে।
- Line number ও vertical/horizontal scrolling।
- Grapheme-সচেতন cursor ও delete — বাংলা যুক্তাক্ষর, কার ও emoji ভাঙে না।
- অসংরক্ষিত পরিবর্তনের চিহ্ন; text আগের অবস্থায় ফিরলে চিহ্ন চলে যায়।
- File operations (M3): `filex <path>` দিয়ে খোলা, `Ctrl+S` save, `Ctrl+O`
  অন্য ফাইল খোলা; নামহীন buffer ও নতুন ফাইলে path prompt।
- নিরাপদ save: temp file + `fsync` + atomic rename; mode, symlink, hard link,
  `CRLF` ও BOM অক্ষত; বাইরে থেকে বদলানো ফাইলে overwrite-এর আগে জিজ্ঞাসা।
- Backup: প্রতি session-এ প্রথম save-এর আগে মূল ফাইল
  `~/.local/state/filex/backups/`-এ (`0600`), প্রতি ফাইলে সর্বশেষ 5টি।
- অসংরক্ষিত পরিবর্তন থাকলে `Ctrl+Q`/`Ctrl+O`-এর আগে y/n/Esc prompt।
- Directory, binary, invalid UTF-8, 16 MB-এর বড় ও অনুমতিহীন ফাইলে localized
  error; CLI-তে exit code `3`/`4`। অজানা option-এ exit `2`।
- Productivity (M4): undo/redo (`Ctrl+Z`/`Ctrl+Y`) টানা typing group-সহ;
  Shift দিয়ে selection, `Ctrl+A`; `Ctrl+C`/`Ctrl+X`/`Ctrl+V` (OSC 52)।
- Incremental search (`Ctrl+F`), interactive ও replace-all (`Ctrl+R`), লাইনে
  যাওয়া (`Ctrl+G`, বাংলা অঙ্কসহ), `F1` shortcut তালিকা।

### Specification থেকে পরিবর্তন

- না-থাকা path-এ error-এর বদলে নতুন ফাইল খোলা হয় (nano/vim-এর মতো)।

- Replace shortcut `Ctrl+H` থেকে `Ctrl+R` — terminal `Ctrl+H`-কে Backspace
  হিসেবে পাঠায়।
- `Ctrl+Y` redo যোগ — legacy terminal-এ `Ctrl+Shift+Z` আলাদা করা যায় না।
- `Ctrl+C`/`Ctrl+X`/`Ctrl+V` ও `F1` যোগ (spec-এ ছিল না)।

### পরিচিত সীমাবদ্ধতা

- Tab character দেখানো সমর্থিত নয়; paste-এ tab space-এ রূপান্তরিত হয়।
- Mixed line ending-এর ফাইল save-এ এক ধরনে রূপান্তরিত হয়।
- Backup বন্ধ করার config এখনও নেই।
- Package npm-এ প্রকাশিত হয়নি; `filex` নামটি npm-এ ইতিমধ্যে নেওয়া।
