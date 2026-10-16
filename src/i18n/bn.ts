export const bn = {
  appName: "ফাইলএক্স",
  fileLabel: "ফাইল",
  noFile: "নামহীন",
  modified: "পরিবর্তিত",
  newFile: "নতুন ফাইল",
  readOnly: "শুধু-পঠনযোগ্য",
  line: "লাইন",
  column: "কলাম",
  notImplemented: "এখনও চালু হয়নি",
  terminalTooSmall: "টার্মিনাল খুব ছোট",
  minimumSize: "ন্যূনতম",
  invalidLang: "অজানা ভাষা",
  supportedLangs: "সমর্থিত ভাষা",
  unknownOption: "অজানা option",
  tooManyPaths: "একটির বেশি path দেওয়া হয়েছে",
  usage: "ব্যবহার: filex [--lang bn|en] [path]",
  missingArgs: "argument অনুপস্থিত",
  tooManyArgs: "অতিরিক্ত argument",
  emptySearch: "খোঁজার লেখা খালি হতে পারে না",
  lineRange: "লাইন নম্বর 1 থেকে {max}-এর মধ্যে হতে হবে",
  fileExists: "ফাইলটি আগে থেকেই আছে (overwrite করতে --force দিন)",
  fileNotFound: "ফাইল পাওয়া যায়নি",
  createHint: "সমাধান: path যাচাই করুন অথবা `filex create {path}` ব্যবহার করুন।",
  created: "তৈরি হয়েছে: {path}",
  appended: "যোগ হয়েছে: {path}",
  inserted: "লাইন {line}-এ যোগ হয়েছে: {path}",
  replacedIn: "{n}টি প্রতিস্থাপিত: {path}",
  dryRun: "{n}টি মিল; কিছু লেখা হয়নি (--dry-run)",
  matchLines: "লাইন: {lines}",
  noTty: "Interactive editor-এর জন্য terminal দরকার।",
  noTtyHint: "ফাইল দেখতে: filex read <path> · সাহায্য: filex --help",
  cliHelp: `FileX — বাংলা-প্রথম terminal file editor

ব্যবহার:
  filex [option] [path]              Editor খুলুন (path না থাকলে নতুন ফাইল)
  filex edit <path>                  একই কাজ
  filex read <path>                  Content stdout-এ লিখুন
  filex create <path> [--force]      খালি ফাইল তৈরি করুন
  filex append <path> <text>         শেষে নতুন লাইন যোগ করুন
  filex insert <path> <line> <text>  লাইন নম্বরে (1 থেকে) নতুন লাইন বসান
  filex replace <path> <old> <new> [--dry-run]
                                     সব মিল প্রতিস্থাপন করুন

Option:
  --lang bn|en     UI-র ভাষা (অথবা FILEX_LANG environment variable)
  -h, --help       এই সাহায্য
  -v, --version    Version
  --               এরপরের সবকিছু path/text হিসেবে ধরুন

Editor-এর ভেতরে F1 চাপলে সব shortcut দেখা যাবে।

Exit code: 0 সফল · 1 কোনো মিল নেই · 2 ভুল argument · 3 ফাইল/path error
           4 অনুমতি নেই · 5 লেখা ব্যর্থ · 6 terminal নেই`,

  saving: "সংরক্ষণ হচ্ছে…",
  saved: "সংরক্ষিত",
  backupFailed: "backup তৈরি করা যায়নি",
  saveFailed: "ফাইল সংরক্ষণ করা যায়নি",
  changesKept: "পরিবর্তনগুলো এখনও editor-এ রয়েছে।",
  openFailed: "ফাইল খোলা যায়নি",
  opened: "খোলা হয়েছে",
  emptyPath: "Path দেওয়া হয়নি",
  saveElsewhere: "অন্য path-এ সংরক্ষণ করুন",
  noMatches: "কোনো মিল পাওয়া যায়নি",
  replacedCount: "{n}টি প্রতিস্থাপিত",
  matchCount: "{n}টি মিল",
  invalidLine: "অবৈধ লাইন নম্বর",
  nothingSelected: "কিছু নির্বাচিত নেই",
  copied: "কপি হয়েছে",
  clipboardEmpty: "Clipboard খালি",
  nothingToUndo: "পূর্বাবস্থায় ফেরানোর কিছু নেই",
  nothingToRedo: "পুনরায় করার কিছু নেই",

  "prompt.open": "ফাইল খুলুন",
  "prompt.saveAs": "সংরক্ষণের path",
  "prompt.unsaved": "অসংরক্ষিত পরিবর্তন আছে। সংরক্ষণ করবেন?",
  "prompt.conflict": "ফাইলটি অন্য কোথাও পরিবর্তিত হয়েছে। তবুও overwrite করবেন?",
  "prompt.exists": "ফাইলটি আগে থেকেই আছে। Overwrite করবেন?",
  "prompt.yesNoCancel": "y হ্যাঁ · n না · Esc বাতিল",
  "prompt.yesNo": "y হ্যাঁ · n না",
  "prompt.find": "খুঁজুন",
  "prompt.replaceFind": "যা প্রতিস্থাপন করবেন",
  "prompt.replaceWith": "যা দিয়ে প্রতিস্থাপন",
  "prompt.gotoLine": "লাইন নম্বর",
  "prompt.replace": "প্রতিস্থাপন করবেন?",
  "prompt.replaceChoices": "y হ্যাঁ · n বাদ · a সব · Esc থামুন",

  "help.title": "Keyboard shortcut তালিকা",
  "help.close": "যেকোনো key চাপলে বন্ধ হবে",
  "help.move": "Cursor সরান",
  "help.lineEdges": "লাইনের শুরু / শেষ",
  "help.page": "এক পাতা উপরে / নিচে",
  "help.select": "নির্বাচন করুন",

  "error.IS_DIRECTORY": "এটি একটি directory",
  "error.NOT_A_FILE": "সাধারণ ফাইল নয়",
  "error.PERMISSION": "অনুমতি নেই",
  "error.BINARY": "Binary ফাইল সম্পাদনা সমর্থিত নয়",
  "error.INVALID_ENCODING": "ফাইলটি বৈধ UTF-8 নয়",
  "error.TOO_LARGE": "ফাইল খুব বড় (সর্বোচ্চ 16 MB)",
  "error.CONFLICT": "ফাইলটি অন্য কোথাও পরিবর্তিত হয়েছে",
  "error.PARENT_MISSING": "Directory পাওয়া যায়নি",
  "error.NO_SPACE": "Disk-এ জায়গা নেই",
  "error.READ_ONLY_FS": "শুধু-পঠনযোগ্য filesystem",
  "error.IO": "Input/output error",

  "command.save": "সংরক্ষণ",
  "command.open": "ফাইল খুলুন",
  "command.find": "খুঁজুন",
  "command.replace": "প্রতিস্থাপন",
  "command.undo": "পূর্বাবস্থা",
  "command.redo": "পুনরায় করুন",
  "command.selectAll": "সব নির্বাচন",
  "command.gotoLine": "লাইনে যান",
  "command.copy": "কপি",
  "command.cut": "কাট",
  "command.paste": "পেস্ট",
  "command.help": "সাহায্য",
  "command.quit": "বন্ধ",
  "command.cancel": "বাতিল",
} as const;
