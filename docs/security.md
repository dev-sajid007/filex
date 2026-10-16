# Security ও file safety

FileX filesystem-এ লেখে, তাই নিরাপদ default আবশ্যক। Implementation:
`src/core/file-engine.ts`; tests: `tests/file-engine.test.ts`।

## পড়া

- শুধু regular file খোলে; directory, device, FIFO ইত্যাদি প্রত্যাখ্যাত।
- প্রথম 8 KB-তে NUL byte থাকলে binary ধরে প্রত্যাখ্যান।
- UTF-8 strict decode; invalid হলে প্রত্যাখ্যান (চুপচাপ `�` বসানো হয় না)।
- 16 MB-এর বড় ফাইল প্রত্যাখ্যাত।
- UTF-8 BOM সরিয়ে মনে রাখা হয়, save-এ ফিরিয়ে দেওয়া হয়।
- Line ending: `CRLF` বেশি হলে `CRLF`, নইলে `LF`; save-এ সেটিই লেখা হয়।
  **সীমাবদ্ধতা:** mixed line ending-এর ফাইল save-এ এক ধরনে রূপান্তরিত হয়;
  একক `CR` (পুরনো Mac) line break হিসেবে পড়া হয়।

## Save procedure

1. Symlink হলে `realpath` দিয়ে target বের করা হয় — link-টি নয়, তার target
   লেখা হয়, link অক্ষত থাকে।
2. Target directory বা non-regular file হলে প্রত্যাখ্যান।
3. **Conflict check:** খোলা/শেষ save-এর সময়ের `mtime` ও size-এর সঙ্গে disk
   মেলানো হয়। না মিললে (অন্য process বদলেছে, মুছেছে, বা নতুন path-এ
   আগে থেকেই ফাইল আছে) overwrite-এর আগে জিজ্ঞাসা।
4. Backup (নিচে দেখুন)।
5. একই directory-তে `.<name>.filex-<random>.tmp` তৈরি (`O_EXCL`, mode `0600`),
   লেখা, `fsync`।
6. Temp file-এ মূল ফাইলের mode বসানো (নতুন ফাইলে umask অনুযায়ী default)।
7. `rename` দিয়ে atomic replace; তারপর directory `fsync` (best effort)।
8. কোনো ধাপ ব্যর্থ হলে temp file মুছে ফেলা হয়; মূল ফাইল অক্ষত থাকে।
9. সফল হলে শুধু save-এর মুহূর্তের text "saved" হিসেবে চিহ্নিত হয় — save
   চলাকালীন টাইপ করা অংশ অসংরক্ষিত থাকে।

### In-place write (fallback)

নিচের ক্ষেত্রে rename-এর বদলে ফাইলটি জায়গায় truncate করে আবার লেখা হয়:

- **Hard link** (`nlink > 1`) — rename করলে অন্য link-গুলো পুরনো content দেখাত।
- **অন্য user-এর ফাইল** — rename করলে owner বদলে যেত।
- **Directory-তে লেখার অনুমতি নেই কিন্তু ফাইলে আছে** — temp file তৈরি করা
  যায় না।

**সীমাবদ্ধতা:** in-place write atomic নয় — লেখার মাঝে crash বা disk full
হলে ফাইল অসম্পূর্ণ থাকতে পারে। এই কারণেই backup আগে নেওয়া হয়।

Save ব্যর্থ হলে editor-এর content কখনও নষ্ট হবে না:

```text
ফাইল সংরক্ষণ করা যায়নি: Permission denied
পরিবর্তনগুলো এখনও editor-এ রয়েছে।
```

### Platform নোট

- Atomic rename-এর গ্যারান্টি local POSIX filesystem-এ; NFS/SMB ও Windows-এ
  semantics আলাদা হতে পারে — পরীক্ষা করা হয়নি।
- Conflict check `mtime` resolution-এর উপর নির্ভর করে; একই মুহূর্তে একই size-এ
  বদলালে ধরা নাও পড়তে পারে।
- Extended attribute, ACL ও SELinux label নতুন temp file-এ কপি হয় না।

## Backup

- **কোথায়:** `$XDG_STATE_HOME/filex/backups/` (default
  `~/.local/state/filex/backups/`), প্রতিটি ফাইলের জন্য তার পূর্ণ path-এর
  hash নামের আলাদা folder; filename `<timestamp>-<name>` — collision হয় না,
  project folder-ও নোংরা হয় না।
- **কখন:** প্রতি session-এ প্রতিটি ফাইলের প্রথম save-এর আগে একবার — অর্থাৎ
  FileX খোলার আগের সংস্করণটি রাখা হয়।
- **Retention:** প্রতি ফাইলে সর্বশেষ 5টি।
- **Permission:** folder `0700`, ফাইল `0600` — **backup-এ মূল ফাইলের sensitive
  data (password, key) থাকতে পারে**, তাই শুধু owner পড়তে পারে।
- Backup ব্যর্থ হলে save তবুও হয় (safe save আলাদাভাবে রক্ষা করে), এবং status
  bar-এ সতর্কতা দেখায়।
- Config loader আসার আগে backup বন্ধ করার উপায় নেই; config-এ
  `"backup": false` পরিকল্পিত।

## Permission

- Read-only file খুললে header-এ "শুধু-পঠনযোগ্য" দেখায়; save ব্যর্থ হলে
  অন্য path-এ save করার prompt খোলে।
- Permission error-এ raw stack trace নয়, localized বার্তা; editor-এর content
  নষ্ট হয় না।
- File ownership বা permission অকারণে বদলানো হবে না।
- FileX কখনও নিজে থেকে `sudo` বা privilege escalation চালাবে না।

## সাধারণ নিয়ম

- `create` existing file overwrite করবে না, explicit flag ছাড়া।
- প্রথম সংস্করণে file delete command থাকবে না।
- User input কখনও shell command হিসেবে চালানো হবে না।
- File content কখনও log করা হবে না।
- Stack trace শুধু debug mode-এ।
- Path traversal নিজে থেকে vulnerability নয় — FileX ব্যবহারকারীর নিজের
  permission নিয়ে চলে। তবে কোনো feature-এ root boundary থাকলে তা enforce
  করতে হবে।
- `Ctrl+C` editor বন্ধ করে না, যাতে ভুলবশত unsaved পরিবর্তন হারিয়ে না যায়।
  Crash recovery/autosave পরবর্তী milestone-এর বিষয়।

## Security সমস্যা জানানো

সমস্যা পেলে public issue খোলার আগে maintainer-এর সঙ্গে ব্যক্তিগতভাবে যোগাযোগ
করুন। (যোগাযোগের মাধ্যম repository প্রকাশের সময় যোগ হবে।)
