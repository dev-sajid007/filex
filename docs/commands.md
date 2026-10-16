# CLI commands

এই document FileX-এর command-line interface বর্ণনা করে। প্রতিটি অংশে
**অবস্থা** দেওয়া আছে — শুধু ✅ চিহ্নিত অংশ বর্তমানে কাজ করে।

## Usage

```text
filex [options] [path]
filex <command> [arguments]
```

Source থেকে চালালে `filex`-এর জায়গায় `bun run start` লিখুন।

## Options

| Option | কাজ | অবস্থা |
| --- | --- | --- |
| `--lang bn` | বাংলা UI (default) | ✅ |
| `--lang en` | English UI | ✅ |
| `--lang=<code>` | উপরের সমতুল্য রূপ | ✅ |
| `--` | এরপরের সবকিছু path (যেমন `-`-দিয়ে শুরু নামের ফাইল) | ✅ |
| `--help` | Command ও shortcut তালিকা; TUI চালু করে না | পরিকল্পিত (M5) |
| `--version` | `package.json` থেকে version; TUI চালু করে না | পরিকল্পিত (M5) |

অজানা ভাষা দিলে বাংলায় error দেখায় এবং exit code `2` দেয়:

```text
$ filex --lang fr
অজানা ভাষা: fr
সমর্থিত ভাষা: bn, en
```

### Language precedence

1. CLI option `--lang` ✅
2. FileX config (পরিকল্পিত)
3. Environment variable (বিবেচনাধীন)
4. Default `bn` ✅

অজানা option বা একাধিক path দিলে error, usage এবং exit code `2`।

## `filex [path]` ✅

| Path | আচরণ |
| --- | --- |
| দেওয়া নেই | নামহীন buffer; `Ctrl+S` চাপলে path জিজ্ঞাসা করে |
| বিদ্যমান text file | Editor-এ খোলে |
| নেই, কিন্তু parent directory আছে | নতুন ফাইল হিসেবে খোলে; প্রথম save-এ তৈরি হয় |
| Parent directory নেই | Error, exit `3` |
| Directory, device বা অন্য non-regular file | Error, exit `3` (file picker পরিকল্পিত) |
| Binary (প্রথম 8 KB-তে NUL byte) | Error, exit `3` |
| বৈধ UTF-8 নয় | Error, exit `3` |
| 16 MB-এর বড় | Error, exit `3` |
| পড়ার অনুমতি নেই | Error, exit `4` |
| শুধু-পঠনযোগ্য | খোলে, header-এ "শুধু-পঠনযোগ্য"; save ব্যর্থ হলে অন্য path চায় |

`~/...` path home directory-তে expand হয়। Spec-এ বলা ছিল না-থাকা ফাইলে
"ফাইল পাওয়া যায়নি" error; তার বদলে nano/vim-এর মতো নতুন ফাইল খোলা হয়।

## Subcommands

নিচের সব command পরিকল্পিত (M5); এখনও implement হয়নি।

| Command | কাজ | নির্ধারিত behavior |
| --- | --- | --- |
| `filex .` | বর্তমান directory | File picker |
| `filex create <path>` | নতুন file | File আগে থেকে থাকলে overwrite না করে error |
| `filex read <path>` | File পড়ুন | Content stdout-এ লেখে |
| `filex edit <path>` | Edit করুন | Interactive editor |
| `filex replace <path> <old> <new>` | Text replace | Preview/dry-run option বিবেচনাধীন |
| `filex insert <path> <line> <text>` | Line-এ insert | Line number 1-based |
| `filex append <path> <text>` | শেষে যোগ | Newline behavior implement-এর সময় নির্দিষ্ট হবে |
| `filex diff <path>` | পরিবর্তন দেখান | Saved snapshot/backup-এর সঙ্গে diff |

### নীতি

- Path-এ space থাকলেও কাজ করবে (shell quoting অনুযায়ী)।
- ভুল argument হলে বাংলায় সংক্ষিপ্ত error ও usage।
- Destructive operation-এর আগে confirmation; non-interactive mode-এ
  confirmation সম্ভব না হলে safe failure অথবা explicit force flag।
- Non-TTY environment-এ TUI চালু হবে না; স্পষ্ট error বা command mode।

## Exit codes

| Code | অর্থ | অবস্থা |
| --- | --- | --- |
| `0` | সফল | ✅ |
| `1` | সাধারণ error | পরিকল্পিত |
| `2` | Invalid command/argument | ✅ |
| `3` | File/path error | ✅ (খোলার সময়) |
| `4` | Permission error | ✅ (খোলার সময়) |
| `5` | Save/write error | পরিকল্পিত |
| `6` | TTY/UI initialization error | পরিকল্পিত |
