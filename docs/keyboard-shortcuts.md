# Keyboard shortcuts

Shortcut-গুলো `src/core/keymap.ts`-এ সংজ্ঞায়িত। সব shortcut চিনে নেওয়া হয়;
যেগুলোর feature এখনও তৈরি হয়নি, সেগুলো চাপলে status bar-এ
"এখনও চালু হয়নি" বার্তা দেখায়।

## Editor

| Shortcut | কাজ | অবস্থা |
| --- | --- | --- |
| `Ctrl+Q` | সম্পাদক বন্ধ করুন (অসংরক্ষিত পরিবর্তন থাকলে জিজ্ঞাসা) | ✅ |
| `Esc` | Prompt বাতিল / বার্তা মুছুন | ✅ |
| `Ctrl+S` | সংরক্ষণ; নামহীন হলে path জিজ্ঞাসা | ✅ |
| `Ctrl+O` | ফাইল খুলুন (অসংরক্ষিত পরিবর্তন থাকলে আগে জিজ্ঞাসা) | ✅ |
| `Ctrl+F` | খুঁজুন | M4 |
| `Ctrl+R` | প্রতিস্থাপন | M4 |
| `Ctrl+Z` | Undo | M4 |
| `Ctrl+Y` | Redo | M4 |
| `Ctrl+Shift+Z` | Redo (শুধু kitty keyboard protocol-এ) | M4 |
| `Ctrl+A` | সব নির্বাচন | M4 |
| `Ctrl+G` | লাইনে যান | M4 |

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
| `Shift`+Arrow | Selection (terminal সমর্থন করলে) | M4 |

"অক্ষর" মানে grapheme cluster — `ক্ষ`, `কি` বা `👨‍👩‍👧` একবারে পার হয় ও মোছে।

## Prompt

Status bar-এর জায়গায় prompt দেখা দেয়।

| Prompt | Key |
| --- | --- |
| Path (ফাইল খুলুন / সংরক্ষণের path) | লিখুন, `Enter` নিশ্চিত, `Esc` বাতিল; Left/Right/Home/End/Backspace/Delete চলে |
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
- **`Ctrl+C`** FileX বন্ধ করে না (unsaved পরিবর্তন রক্ষার জন্য); `Ctrl+Q`
  ব্যবহার করুন।
- `Alt`/`Meta`-যুক্ত combination বর্তমানে কোনো command-এ map করা নেই।
