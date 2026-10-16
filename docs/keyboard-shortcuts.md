# Keyboard shortcuts

Shortcut-গুলো `src/core/keymap.ts`-এ সংজ্ঞায়িত। Editor-এর ভেতরে `F1` চাপলে
পূর্ণ তালিকা দেখায়।

## Editor

| Shortcut | কাজ | অবস্থা |
| --- | --- | --- |
| `Ctrl+Q` | সম্পাদক বন্ধ করুন (অসংরক্ষিত পরিবর্তন থাকলে জিজ্ঞাসা) | ✅ |
| `Esc` | Prompt বাতিল / বার্তা মুছুন | ✅ |
| `Ctrl+S` | সংরক্ষণ; নামহীন হলে path জিজ্ঞাসা | ✅ |
| `Ctrl+O` | ফাইল খুলুন (অসংরক্ষিত পরিবর্তন থাকলে আগে জিজ্ঞাসা) | ✅ |
| `Ctrl+F` | খুঁজুন | ✅ |
| `Ctrl+R` | প্রতিস্থাপন | ✅ |
| `Ctrl+G` | লাইনে যান (`12` বা `১২`) | ✅ |
| `Ctrl+Z` | Undo | ✅ |
| `Ctrl+Y` | Redo | ✅ |
| `Ctrl+Shift+Z` | Redo (শুধু kitty keyboard protocol-এ) | ✅ |
| `Ctrl+A` | সব নির্বাচন | ✅ |
| `Ctrl+C` | নির্বাচিত অংশ কপি | ✅ |
| `Ctrl+X` | নির্বাচিত অংশ কাট | ✅ |
| `Ctrl+V` | FileX-এর clipboard থেকে পেস্ট | ✅ |
| `F1` | Shortcut তালিকা (যেকোনো key-তে বন্ধ) | ✅ |

### Undo/redo

টানা typing বা টানা মোছা (একই জায়গায়, এক সেকেন্ডের কম বিরতিতে) একটি ধাপ।
Cursor সরালে, Enter, paste, cut বা replace নতুন ধাপ শুরু করে। সর্বোচ্চ 1000
ধাপ। Save করলে history মোছে না; saved অবস্থায় undo করে ফিরলে "পরিবর্তিত"
চিহ্ন চলে যায়।

### Clipboard

`Ctrl+C`/`Ctrl+X` FileX-এর নিজস্ব clipboard-এ রাখে এবং OSC 52 দিয়ে terminal-এর
system clipboard-এও পাঠায় (kitty, WezTerm, foot, iTerm2, tmux-এ
`set-clipboard on` ইত্যাদি; SSH-এর উপরেও চলে)। `Ctrl+V` শুধু FileX-এর
clipboard থেকে পেস্ট করে — অন্য app থেকে কপি করা লেখার জন্য terminal-এর
নিজস্ব paste (সাধারণত `Ctrl+Shift+V`) ব্যবহার করুন।

## Editing ও navigation

| Shortcut | কাজ | অবস্থা |
| --- | --- | --- |
| Arrow keys | Cursor movement; উপর/নিচে গেলে visual column বজায় থাকে | ✅ |
| `Home` / `End` | Line-এর শুরু / শেষ | ✅ |
| `PageUp` / `PageDown` | এক screen উপরে / নিচে | ✅ |
| `Enter` | নতুন line | ✅ |
| `Tab` | ২টি space | ✅ |
| `Backspace` / `Delete` | আগের / পরের অক্ষর মুছুন | ✅ |
| Paste | Terminal-এর paste (bracketed paste) | ✅ |
| `Shift` + Arrow / Home / End / PgUp / PgDn | Selection | ✅ |

"অক্ষর" মানে grapheme cluster — `ক্ষ`, `কি` বা `👨‍👩‍👧` একবারে পার হয় ও মোছে।

## Prompt

Status bar-এর জায়গায় prompt দেখা দেয়।

| Prompt | Key |
| --- | --- |
| Path / লাইন নম্বর | লিখুন, `Enter` নিশ্চিত, `Esc` বাতিল; Left/Right/Home/End/Backspace/Delete চলে। আগে থেকে ভরা লেখা নির্বাচিত থাকে, টাইপ করলে বদলে যায় |
| খুঁজুন (`Ctrl+F`) | টাইপের সঙ্গে সঙ্গে খোঁজে; `Enter`/`↓` পরের মিল, `↑` আগের মিল, `Esc` বন্ধ (মিলটি নির্বাচিত থাকে) |
| প্রতিস্থাপন (`Ctrl+R`) | প্রথমে খোঁজার লেখা, তারপর নতুন লেখা (খালি = মুছে ফেলা); তারপর প্রতিটি মিলে `y` বদলান, `n` বাদ, `a` সব (মোট সংখ্যা আগে দেখায়), `Esc` থামুন |
| অসংরক্ষিত পরিবর্তন | `y` save করে এগোয়, `n` save না করে এগোয়, `Esc` বাতিল |
| Overwrite (ফাইল বাইরে বদলেছে / আগে থেকেই আছে) | `y` overwrite, `n`/`Esc` বাতিল |

আলাদা "Save as" shortcut নেই: নামহীন buffer-এ `Ctrl+S` path চায়, আর
permission-এর কারণে save ব্যর্থ হলে বর্তমান path-সহ prompt নিজে খোলে।

## Terminal সীমাবদ্ধতা

Terminal-গুলো control key একইভাবে পাঠায় না। পরীক্ষায় যা পাওয়া গেছে:

- **`Ctrl+H` ব্যবহার করা হয় না।** বেশিরভাগ terminal এটিকে Backspace
  (`0x08`) হিসেবে পাঠায়, তাই আলাদা করা যায় না। Replace-এর জন্য `Ctrl+R`।
- **`Ctrl+Shift+Z`** legacy terminal-এ `Ctrl+Z`-এর মতোই পৌঁছায়। যেসব
  terminal kitty keyboard protocol সমর্থন করে (যেমন kitty, WezTerm, foot,
  Ghostty), শুধু সেখানে এটি redo হিসেবে কাজ করে। সব জায়গায় `Ctrl+Y` চলে।
- **`Esc`** সামান্য দেরিতে কাজ করে — একক `Esc` byte অন্য escape sequence-এর
  শুরু কি না তা নিশ্চিত হতে input parser অল্প সময় অপেক্ষা করে।
- **`Ctrl+C`** কপি করে, FileX বন্ধ করে না; বন্ধ করতে `Ctrl+Q`।
- `Alt`/`Meta`-যুক্ত combination বর্তমানে কোনো command-এ map করা নেই।

## Search-এর নিয়ম

- Case-sensitive; শুধু এক line-এর ভেতরে খোঁজে।
- খালি খোঁজায় কিছু মেলে না, cursor নড়ে না।
- বাংলায় অক্ষরের অংশও মেলে — `কর` খুঁজলে `করা`-তে পাওয়া যায়। নির্বাচন পুরো
  grapheme পর্যন্ত বাড়ে (`করা`), কিন্তু replace শুধু মেলা অংশটি বদলায়
  (`কর` → `লিখ` দিলে `লিখা`)।
- Replace cursor থেকে সামনের দিকে এগোয়; শেষে পৌঁছালে থামে। `a` পুরো ফাইলের
  সব মিল বদলায়।
