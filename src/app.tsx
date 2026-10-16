import { useKeyboard, usePaste, useRenderer, useTerminalDimensions } from "@opentui/react";
import { useReducer, useRef } from "react";
import { EditorViewport, gutterWidthFor } from "./components/EditorViewport.tsx";
import { Header } from "./components/Header.tsx";
import { HelpView } from "./components/HelpView.tsx";
import { PromptBar } from "./components/PromptBar.tsx";
import { type StatusMessage, StatusBar } from "./components/StatusBar.tsx";
import {
  comparePositions,
  createState,
  cursorX,
  type EditorState,
  getText,
  gotoLine,
  insertText,
  isDirty,
  markSaved,
  moveTo,
  type Position,
  replaceRange,
  select,
  selectAll,
  selectedText,
  selectionRange,
} from "./core/editor-buffer.ts";
import { applyEditorKey, pastedText } from "./core/editor-input.ts";
import { FileError } from "./core/errors.ts";
import { DEFAULT_META, type FileEngine, type FileMeta, type FileStamp, type LoadedFile } from "./core/file-engine.ts";
import { type CommandId, resolveCommand } from "./core/keymap.ts";
import {
  type Continuation,
  handlePromptKey,
  inputPrompt,
  parseLineNumber,
  type Prompt,
  pasteIntoPrompt,
} from "./core/prompt.ts";
import {
  findMatches,
  type Match,
  matchRange,
  nextMatchIndex,
  prevMatchIndex,
  replaceAll,
  replaceMatch,
} from "./core/search.ts";
import { type EditKind, emptyHistory, type History, record, redo, undo } from "./core/undo-manager.ts";
import { followCursor, type Scroll } from "./core/viewport.ts";
import { commandName, errorMessage, format, type Messages } from "./i18n/index.ts";
import { displayPath, resolveUserPath } from "./utils/paths.ts";
import { cellWidth, graphemeIndex, nextBoundary } from "./utils/unicode.ts";

export const MIN_WIDTH = 40;
export const MIN_HEIGHT = 8;

// Rows/columns taken by the outer border, header, viewport borders and status bar.
const CHROME_ROWS = 6;
const CHROME_COLS = 2;

/** The file behind the buffer. `path` is null for an untitled buffer. */
interface Doc {
  path: string | null;
  meta: FileMeta;
  /** null when the file has never been written. */
  stamp: FileStamp | null;
  readOnly: boolean;
}

const UNTITLED: Doc = { path: null, meta: DEFAULT_META, stamp: null, readOnly: false };

function docFrom(file: LoadedFile): Doc {
  return { path: file.path, meta: file.meta, stamp: file.stamp, readOnly: file.readOnly };
}

interface AppState {
  editor: EditorState;
  history: History;
  doc: Doc;
  status: StatusMessage | null;
  prompt: Prompt | null;
  help: boolean;
  /** Last find/replace query, offered again next time. */
  lastQuery: string;
}

/** Index of the match `editor`'s selection is on, or -1. */
function currentMatchIndex(editor: EditorState, matches: Match[]): number {
  const selection = selectionRange(editor);
  if (!selection) return -1;
  return matches.findIndex((m) => {
    const range = matchRange(editor.lines, m);
    return comparePositions(range.start, selection.start) === 0 && comparePositions(range.end, selection.end) === 0;
  });
}

/** First match at/after `from` without wrapping, or -1. */
function forwardMatchIndex(matches: Match[], from: Position): number {
  return matches.findIndex((m) => comparePositions({ line: m.line, col: m.start }, from) >= 0);
}

interface AppProps {
  messages: Messages;
  engine: FileEngine;
  onQuit: () => void;
  initialFile?: LoadedFile;
  /** Untitled buffer contents when no file is given (used by tests). */
  initialText?: string;
}

export function App({ messages, engine, onQuit, initialFile, initialText = "" }: AppProps) {
  const renderer = useRenderer();
  const { width, height } = useTerminalDimensions();
  // State lives in a ref that is updated synchronously, then React re-renders from it.
  // Several keys can arrive before the next render (fast typing, typing then Ctrl+Q,
  // Ctrl+S then a path); each handler must see the effects of the previous one,
  // otherwise e.g. Ctrl+Q right after typing would skip the unsaved-changes prompt.
  const store = useRef<AppState | null>(null);
  store.current ??= {
    editor: createState(initialFile?.text ?? initialText),
    history: emptyHistory(),
    doc: initialFile ? docFrom(initialFile) : UNTITLED,
    status: null,
    prompt: null,
    help: false,
    lastQuery: "",
  };
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const scrollRef = useRef<Scroll>({ top: 0, left: 0 });
  const busyRef = useRef(false);
  const clipboardRef = useRef("");

  const get = () => store.current!;
  function update(change: Partial<AppState> | ((state: AppState) => Partial<AppState>)) {
    const patch = typeof change === "function" ? change(get()) : change;
    store.current = { ...get(), ...patch };
    rerender();
  }
  const setStatus = (status: StatusMessage | null) => update({ status });
  const setPrompt = (prompt: Prompt | null) => update({ prompt });
  const info = (text: string) => setStatus({ text, kind: "info" });
  const fail = (text: string) => setStatus({ text, kind: "error" });

  const { editor, doc, status, prompt, help } = get();

  const rows = Math.max(1, height - CHROME_ROWS);
  const gutterWidth = gutterWidthFor(editor.lines.length);
  const textCols = Math.max(1, width - CHROME_COLS - gutterWidth);

  /** Applies an edit and records it for undo. Pure cursor moves are not recorded. */
  function edit(change: (state: EditorState) => EditorState, kind: EditKind) {
    update((s) => {
      const next = change(s.editor);
      return { editor: next, history: record(s.history, s.editor, next, kind, Date.now()), status: null };
    });
  }

  // ---- open / save / quit ----

  function proceed(then: Continuation) {
    if (then === "quit") onQuit();
    else if (then === "open") setPrompt(inputPrompt("open"));
  }

  /** Runs `then` now, or after asking to save if the buffer has unsaved changes. */
  function guardUnsaved(then: "quit" | "open") {
    if (isDirty(get().editor)) setPrompt({ kind: "confirm", purpose: "unsaved", then });
    else proceed(then);
  }

  function requestSave(then: Continuation = null) {
    const { path } = get().doc;
    if (path) void save(path, false, then);
    else setPrompt(inputPrompt("saveAs", "", { then }));
  }

  async function save(path: string, force: boolean, then: Continuation) {
    if (busyRef.current) return;
    busyRef.current = true;
    const current = get().doc;
    const samePath = path === current.path;
    const text = getText(get().editor);
    info(messages.saving);

    try {
      const result = await engine.save(path, text, current.meta, {
        expected: samePath ? current.stamp : null,
        force,
      });
      // Only `text` is on disk; edits typed while saving stay dirty.
      update((s) => ({
        doc: { path: result.path, meta: current.meta, stamp: result.stamp, readOnly: false },
        editor: markSaved(s.editor, text),
      }));
      const savedMsg = `${messages.saved}: ${displayPath(result.path)}`;
      if (result.backup && "error" in result.backup) fail(`${savedMsg} — ${messages.backupFailed}`);
      else info(savedMsg);
      proceed(then);
    } catch (error) {
      if (!(error instanceof FileError)) throw error;
      if (error.code === "CONFLICT") {
        update({
          status: null,
          prompt: { kind: "confirm", purpose: samePath && current.stamp ? "conflict" : "exists", path, then },
        });
        return;
      }
      fail(`${messages.saveFailed}: ${errorMessage(messages, error.code)}. ${messages.changesKept}`);
      if (error.code === "PERMISSION" || error.code === "READ_ONLY_FS") {
        setPrompt(inputPrompt("saveAs", displayPath(path), { then }));
      }
    } finally {
      busyRef.current = false;
    }
  }

  async function open(input: string) {
    const path = resolveUserPath(input);
    try {
      const file = await engine.load(path);
      scrollRef.current = { top: 0, left: 0 };
      update({ editor: createState(file.text), history: emptyHistory(), doc: docFrom(file) });
      info(`${file.stamp ? messages.opened : messages.newFile}: ${displayPath(file.path)}`);
    } catch (error) {
      if (!(error instanceof FileError)) throw error;
      fail(`${messages.openFailed}: ${displayPath(path)} — ${errorMessage(messages, error.code)}`);
    }
  }

  // ---- find / replace ----

  /** Selects the first match of `query` at/after `origin`; with no match, returns the cursor to `origin`. */
  function showFirstMatch(query: string, origin: Position) {
    update((s) => {
      const matches = findMatches(s.editor.lines, query);
      if (matches.length === 0) return { editor: moveTo(s.editor, origin) };
      const match = matches[nextMatchIndex(matches, origin, true)]!;
      return { editor: select(s.editor, matchRange(s.editor.lines, match)) };
    });
  }

  function stepMatch(query: string, direction: "next" | "prev") {
    update((s) => {
      const matches = findMatches(s.editor.lines, query);
      if (matches.length === 0) return {};
      const from = selectionRange(s.editor)?.start ?? s.editor.cursor;
      const index = direction === "next" ? nextMatchIndex(matches, from, false) : prevMatchIndex(matches, from);
      return { editor: select(s.editor, matchRange(s.editor.lines, matches[index]!)) };
    });
  }

  /** Moves the replace prompt to the next match at/after `from`, or finishes when there is none. */
  function continueReplace(query: string, replacement: string, replaced: number, from: Position) {
    const { editor } = get();
    const matches = findMatches(editor.lines, query);
    const index = forwardMatchIndex(matches, from);
    if (index === -1) {
      update({ prompt: null, editor: moveTo(editor, editor.cursor) });
      info(format(messages.replacedCount, { n: replaced }));
      return;
    }
    update({
      editor: select(editor, matchRange(editor.lines, matches[index]!)),
      prompt: { kind: "confirm", purpose: "replace", query, replacement, replaced },
    });
  }

  function onReplaceAnswer(current: Extract<Prompt, { purpose: "replace" }>, answer: "yes" | "no" | "all" | "cancel") {
    const { query, replacement, replaced } = current;
    const { editor } = get();
    const matches = findMatches(editor.lines, query);
    const match = matches[currentMatchIndex(editor, matches)];

    if (answer === "cancel" || !match) {
      setPrompt(null);
      if (replaced > 0) info(format(messages.replacedCount, { n: replaced }));
      return;
    }
    if (answer === "all") {
      const result = replaceAll(editor, query, replacement);
      edit(() => result.state, "other");
      setPrompt(null);
      info(format(messages.replacedCount, { n: replaced + result.count }));
      return;
    }
    if (answer === "yes") {
      edit((state) => replaceMatch(state, match, replacement), "other");
      continueReplace(query, replacement, replaced + 1, get().editor.cursor);
      return;
    }
    continueReplace(query, replacement, replaced, { line: match.line, col: match.start + 1 });
  }

  // ---- prompt key handling ----

  function onPromptKey(current: Prompt, key: Parameters<typeof handlePromptKey>[1]) {
    const action = handlePromptKey(current, key);
    if (!action) return;

    if (current.kind === "confirm" && current.purpose === "replace") {
      if (action.type === "yes" || action.type === "no" || action.type === "all" || action.type === "cancel") {
        onReplaceAnswer(current, action.type);
      }
      return;
    }

    if (current.kind === "input" && current.purpose === "find") {
      const query = getText(current.field);
      if (action.type === "update") {
        const next = action.prompt as typeof current;
        update({ prompt: next, lastQuery: getText(next.field) });
        showFirstMatch(getText(next.field), current.origin!);
      } else if (action.type === "next" || action.type === "prev") {
        stepMatch(query, action.type);
      } else if (action.type === "cancel") {
        setPrompt(null);
      }
      return;
    }

    if (action.type === "update") {
      setPrompt(action.prompt);
      return;
    }
    setPrompt(null);
    if (action.type === "cancel") return;

    if (current.kind === "input") {
      if (action.type !== "submit") return;
      submitInput(current, action.value);
      return;
    }

    if (current.purpose === "unsaved") {
      if (action.type === "yes") requestSave(current.then);
      else if (action.type === "no") proceed(current.then);
    } else if (action.type === "yes") {
      void save(current.path, true, current.then);
    }
  }

  function submitInput(current: Extract<Prompt, { kind: "input" }>, value: string) {
    switch (current.purpose) {
      case "open":
        if (!value.trim()) return fail(messages.emptyPath);
        return void open(value);
      case "saveAs":
        if (!value.trim()) return fail(messages.emptyPath);
        return void save(resolveUserPath(value), false, current.then);
      case "gotoLine": {
        const line = parseLineNumber(value);
        if (line === null) return fail(messages.invalidLine);
        return update((s) => ({ editor: gotoLine(s.editor, line - 1) }));
      }
      case "replaceFind":
        if (findMatches(get().editor.lines, value).length === 0) return fail(messages.noMatches);
        return update({ lastQuery: value, prompt: inputPrompt("replaceWith", "", { query: value }) });
      case "replaceWith": {
        const query = current.query!;
        const { editor } = get();
        const matches = findMatches(editor.lines, query);
        const from = selectionRange(editor)?.start ?? editor.cursor;
        const index = nextMatchIndex(matches, from, true);
        return update({
          editor: select(editor, matchRange(editor.lines, matches[index]!)),
          prompt: { kind: "confirm", purpose: "replace", query, replacement: value, replaced: 0 },
        });
      }
    }
  }

  // ---- commands ----

  function copySelection(): string | null {
    const text = selectedText(get().editor);
    if (text === null) {
      info(messages.nothingSelected);
      return null;
    }
    clipboardRef.current = text;
    try {
      // Also reaches the system clipboard on terminals that support OSC 52 (including over SSH).
      renderer.copyToClipboardOSC52(text);
    } catch {
      // The internal clipboard still works.
    }
    return text;
  }

  function runCommand(command: CommandId) {
    switch (command) {
      case "quit":
        return guardUnsaved("quit");
      case "open":
        return guardUnsaved("open");
      case "save":
        return requestSave();
      case "find": {
        const { editor, lastQuery } = get();
        const origin = selectionRange(editor)?.start ?? editor.cursor;
        const seed = selectedText(editor)?.split("\n")[0] || lastQuery;
        setPrompt(inputPrompt("find", seed, { origin }));
        if (seed) showFirstMatch(seed, origin);
        return;
      }
      case "replace": {
        const { editor, lastQuery } = get();
        return setPrompt(inputPrompt("replaceFind", selectedText(editor)?.split("\n")[0] || lastQuery));
      }
      case "gotoLine":
        return setPrompt(inputPrompt("gotoLine"));
      case "undo":
      case "redo": {
        const { history, editor } = get();
        const result = command === "undo" ? undo(history, editor) : redo(history, editor);
        if (!result) return info(command === "undo" ? messages.nothingToUndo : messages.nothingToRedo);
        return update({ editor: result.state, history: result.history, status: null });
      }
      case "selectAll":
        return update((s) => ({ editor: selectAll(s.editor) }));
      case "copy":
        if (copySelection() !== null) info(messages.copied);
        return;
      case "cut": {
        if (copySelection() === null) return;
        const range = selectionRange(get().editor)!;
        return edit((state) => replaceRange(state, range, ""), "other");
      }
      case "paste": {
        const text = clipboardRef.current;
        if (!text) return info(messages.clipboardEmpty);
        return edit((state) => insertText(state, text), "other");
      }
      case "help":
        return update({ help: true });
      case "cancel":
        return update((s) => ({ status: null, editor: moveTo(s.editor, s.editor.cursor) }));
    }
  }

  useKeyboard((key) => {
    key.preventDefault();
    const state = get();
    if (state.help) {
      update({ help: false });
      return;
    }
    if (state.prompt) {
      onPromptKey(state.prompt, key);
      return;
    }
    const command = resolveCommand(key);
    if (command) {
      runCommand(command);
      return;
    }
    const result = applyEditorKey(state.editor, key, rows);
    if (result) edit(() => result.state, result.kind);
  });

  usePaste((event) => {
    const text = pastedText(event.bytes);
    const { prompt } = get();
    if (prompt) setPrompt(pasteIntoPrompt(prompt, text));
    else edit((state) => insertText(state, text), "other");
  });

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return (
      <box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
        <text>{messages.terminalTooSmall}</text>
        <text>{`${messages.minimumSize}: ${MIN_WIDTH}x${MIN_HEIGHT}`}</text>
      </box>
    );
  }

  const { line, col } = editor.cursor;
  const lineText = editor.lines[line]!;
  const cursorWidth = col < lineText.length ? cellWidth(lineText.slice(col, nextBoundary(lineText, col))) : 1;
  // Deterministic for the same inputs, so recomputing during render is safe.
  const scroll = followCursor(scrollRef.current, line, cursorX(editor), Math.max(1, cursorWidth), rows, textCols);
  scrollRef.current = scroll;

  // Highlight matches while a find/replace flow is active.
  let query: string | null = null;
  if (prompt?.kind === "input" && prompt.purpose === "find") query = getText(prompt.field);
  else if (prompt?.kind === "confirm" && prompt.purpose === "replace") query = prompt.query;
  const matches = query ? findMatches(editor.lines, query) : [];

  let detail: string | undefined;
  if (query) {
    const index = currentMatchIndex(editor, matches);
    if (matches.length === 0) detail = messages.noMatches;
    else if (index === -1) detail = format(messages.matchCount, { n: matches.length });
    else detail = `${index + 1}/${matches.length}`;
  }

  // 2 border columns + 2 padding columns
  const barWidth = width - 4;

  return (
    <box flexDirection="column" flexGrow={1} border title={` ${messages.appName} `}>
      <Header
        messages={messages}
        filePath={doc.path}
        isNew={doc.path !== null && doc.stamp === null}
        readOnly={doc.readOnly}
        dirty={isDirty(editor)}
      />
      {help ? (
        <HelpView messages={messages} />
      ) : (
        <EditorViewport
          lines={editor.lines}
          cursorLine={line}
          cursorCol={col}
          selection={selectionRange(editor)}
          matches={matches}
          scroll={scroll}
          rows={rows}
          textCols={textCols}
          gutterWidth={gutterWidth}
        />
      )}
      {prompt ? (
        <PromptBar messages={messages} prompt={prompt} width={barWidth} detail={detail} />
      ) : (
        <StatusBar
          messages={messages}
          width={barWidth}
          line={line + 1}
          column={graphemeIndex(lineText, col) + 1}
          status={status}
        />
      )}
    </box>
  );
}
