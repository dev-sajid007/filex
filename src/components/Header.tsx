import { TextAttributes } from "@opentui/core";
import type { Messages } from "../i18n/index.ts";
import { displayPath } from "../utils/paths.ts";

interface HeaderProps {
  messages: Messages;
  filePath: string | null;
  isNew: boolean;
  readOnly: boolean;
  dirty: boolean;
}

export function Header({ messages, filePath, isNew, readOnly, dirty }: HeaderProps) {
  const tags = [isNew && messages.newFile, readOnly && messages.readOnly].filter(Boolean).join(" · ");

  return (
    <box flexDirection="row" gap={2} paddingLeft={1} paddingRight={1} height={1} flexShrink={0}>
      <box flexGrow={1} flexShrink={1} overflow="hidden">
        <text wrapMode="none">
          <span attributes={filePath ? 0 : TextAttributes.DIM}>
            {`${messages.fileLabel}: ${filePath ? displayPath(filePath) : messages.noFile}`}
          </span>
          {tags && <span attributes={TextAttributes.DIM}>{`  (${tags})`}</span>}
        </text>
      </box>
      {dirty && (
        <text flexShrink={0} attributes={TextAttributes.BOLD}>{`${messages.modified} [*]`}</text>
      )}
    </box>
  );
}
