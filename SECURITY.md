# Security Policy

FileX writes to your filesystem, so we take reports about data loss, unsafe file handling and
terminal escape injection seriously.

## Supported versions

FileX is pre-1.0. Only the latest commit on `main` receives fixes.

| Version | Supported |
| --- | --- |
| `main` | ✅ |
| older commits | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub:
[Security → Report a vulnerability](https://github.com/dev-sajid007/filex/security/advisories/new).

Include, where you can:

- FileX commit or version (`filex --version`), OS, filesystem and terminal emulator
- What happened and what you expected
- Steps to reproduce, ideally with a minimal file
- Impact — for example data loss, a file written outside the intended path, permission or
  ownership changes, or terminal escape sequences executed from file contents

You can expect an acknowledgement within a week. Once a fix is available we will publish an
advisory and credit you unless you prefer otherwise.

## In scope

- Saves that lose or corrupt data, or leave a file partially written
- Saves that change a file's mode, ownership or symlink unexpectedly
- Backups readable by other users
- File contents or pasted text that inject terminal control sequences
- Anything that executes user-supplied text as a command

## Out of scope

- Editing files you already have permission to write — FileX runs with your own privileges by design
- Rendering differences between terminals and fonts
- Issues on platforms marked untested in the README (macOS, Windows, network filesystems),
  although reports are still welcome as regular issues

The design behind these guarantees, and their known limits, is documented in
[docs/security.md](docs/security.md) (Bangla).
