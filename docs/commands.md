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
| `-h`, `--help` | Command, option ও exit code তালিকা; terminal ছাড়াও চলে | ✅ |
| `-v`, `--version` | `package.json` থেকে version | ✅ |

`--help`/`--version` অন্য সব argument-এর উপরে প্রাধান্য পায়।

অজানা ভাষা দিলে বাংলায় error দেখায় এবং exit code `2` দেয়:

```text
$ filex --lang fr
অজানা ভাষা: fr
সমর্থিত ভাষা: bn, en
```

### Language precedence

1. CLI option `--lang` ✅
2. FileX config (পরিকল্পিত)
3. Environment variable `FILEX_LANG` ✅ (অজানা মান উপেক্ষিত)
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
| stdin/stdout terminal নয় (pipe, cron, CI) | Error ও `filex read`-এর পরামর্শ, exit `6` |
| Binary (প্রথম 8 KB-তে NUL byte) | Error, exit `3` |
| বৈধ UTF-8 নয় | Error, exit `3` |
| 16 MB-এর বড় | Error, exit `3` |
| পড়ার অনুমতি নেই | Error, exit `4` |
| শুধু-পঠনযোগ্য | খোলে, header-এ "শুধু-পঠনযোগ্য"; save ব্যর্থ হলে অন্য path চায় |

`~/...` path home directory-তে expand হয়। Spec-এ বলা ছিল না-থাকা ফাইলে
"ফাইল পাওয়া যায়নি" error; তার বদলে nano/vim-এর মতো নতুন ফাইল খোলা হয়।

## Subcommands ✅

প্রথম argument কোনো subcommand-এর নাম হলে সেটি চলে; নইলে path হিসেবে editor
খোলে। ঠিক এই নামের ফাইল খুলতে `filex -- read` বা `filex ./read` লিখুন।

| Command | কাজ |
| --- | --- |
| `filex edit <path>` | `filex <path>`-এর মতোই |
| `filex read <path>` | Content হুবহু stdout-এ (line ending অপরিবর্তিত, BOM বাদে) |
| `filex create <path> [--force]` | খালি ফাইল তৈরি; থাকলে error (exit `3`), `--force` দিলে খালি করে দেয় |
| `filex append <path> <text>` | শেষে নতুন লাইন যোগ |
| `filex insert <path> <line> <text>` | `line` নম্বরে নতুন লাইন বসায় (1 থেকে শুরু; শেষ লাইন + 1 মানে শেষে যোগ) |
| `filex replace <path> <old> <new> [--dry-run]` | সব মিল প্রতিস্থাপন; সংখ্যা ও লাইন নম্বর দেখায় |
| `filex diff <path>` | পরিকল্পিত — backup-এর সঙ্গে তুলনা (এখনও নেই) |

### আচরণ

- **লেখার নিরাপত্তা:** `create`, `append`, `insert`, `replace` editor-এর মতো
  একই safe save ব্যবহার করে — temp file + atomic rename, backup, mode,
  `CRLF` ও BOM অক্ষত ([security.md](security.md))।
- **Output:** `read` শুধু content stdout-এ লেখে; বাকি সব বার্তা stderr-এ, তাই
  pipe পরিষ্কার থাকে।
- **না-থাকা ফাইল:** `read`, `append`, `insert`, `replace` error দেয় (exit `3`)
  এবং `filex create` ব্যবহারের পরামর্শ দেয়; কিছু তৈরি করে না।
- **Final newline:** `append`/`insert` ফাইলের শেষের newline-এর অবস্থা বজায়
  রাখে — শেষে newline থাকলে থাকবে, না থাকলে যোগ হবে না। খালি ফাইলে যোগ
  করলে শেষে newline থাকে।
- **Line number:** `insert`-এ ASCII বা বাংলা অঙ্ক (`৩`); সীমার বাইরে হলে exit `2`।
- **Multi-line text:** `append`/`insert`-এর text-এ newline থাকলে একাধিক লাইন
  যোগ হয়। Shell-এ `$'প্রথম\nদ্বিতীয়'` লিখুন। `replace`-এর `old`-এও newline
  চলে, এবং তা `CRLF` ফাইলেও মেলে।
- **`replace`:** case-sensitive; মিল না পেলে কিছু লেখে না এবং exit `1` দেয়।
  `--dry-run` শুধু সংখ্যা ও লাইন দেখায়। `old` খালি হতে পারে না; `new` খালি
  হলে মিলগুলো মুছে যায়।
- **`-` দিয়ে শুরু text:** `--`-এর পরে দিন: `filex append f.txt -- "-- comment"`।

### নীতি

- Path-এ space থাকলেও কাজ করবে (shell quoting অনুযায়ী)।
- ভুল argument হলে বাংলায় সংক্ষিপ্ত error ও usage।
- Destructive operation-এর আগে confirmation; non-interactive mode-এ
  confirmation সম্ভব না হলে safe failure অথবা explicit force flag।
- Non-TTY environment-এ TUI চালু হবে না; স্পষ্ট error বা command mode।

## Exit codes

| Code | অর্থ |
| --- | --- |
| `0` | সফল |
| `1` | সাধারণ error; `replace`-এ কোনো মিল নেই |
| `2` | ভুল command/argument (অজানা option, argument কম/বেশি, অবৈধ লাইন নম্বর) |
| `3` | File/path error (নেই, directory, binary, UTF-8 নয়, খুব বড়, আগে থেকেই আছে) |
| `4` | অনুমতি নেই (পড়া বা লেখা), শুধু-পঠনযোগ্য filesystem |
| `5` | লেখা ব্যর্থ (disk full, I/O error, লেখার সময় ফাইল বদলে গেছে) |
| `6` | Terminal নেই বা TUI চালু করা যায়নি |
