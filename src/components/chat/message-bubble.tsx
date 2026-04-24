"use client";

import { useT } from "@/lib/i18n";
import { MessageActions } from "./message-actions";
import { EditBubble } from "./edit-bubble";
import { ToolCard } from "./tool-card";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@ai-sdk/react";

/* ── Markdown components for assistant messages ── */

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-[var(--border-subtle)] px-[var(--space-2)] py-[var(--space-1)] text-[var(--text-body-sm)]"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="overflow-x-auto rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 text-[var(--text-body-sm)]">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
};

/* ── Props ── */

interface MessageBubbleProps {
  message: Message;
  isEditing: boolean;
  editingContent: string;
  onEditContentChange: (value: string) => void;
  onStartEdit: (messageId: string, content: string) => void;
  onSaveEdit: (messageId: string) => void;
  onCancelEdit: () => void;
  onDelete: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isEditing,
  editingContent,
  onEditContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onRegenerate,
}: MessageBubbleProps) {
  const t = useT();
  const isUser = message.role === "user";

  return (
    <div className="group/msg relative mb-[var(--gap-message)]">
      {message.content && (
        <div className="flex gap-[10px]">
          {/* Avatar */}
          <div
            className={
              isUser
                ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[11px] font-medium text-[var(--accent)]"
                : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] text-[11px] text-[var(--ink-secondary)]"
            }
          >
            {isUser ? "K" : "◆"}
          </div>

          {/* Content column */}
          <div className="min-w-0 flex-1">
            {/* Label */}
            <div
              className="mb-1 text-[var(--ink-tertiary)]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              {isUser ? t.labelYou : t.labelAgent}
            </div>

            {/* Message body */}
            {isUser ? (
              isEditing ? (
                <EditBubble
                  content={editingContent}
                  onChange={onEditContentChange}
                  onSave={() => onSaveEdit(message.id)}
                  onCancel={onCancelEdit}
                />
              ) : (
                <>
                  <div className="whitespace-pre-wrap break-words text-[14px] leading-[1.75] text-[var(--ink)]">
                    {message.content}
                  </div>
                  <MessageActions
                    role="user"
                    onEdit={() => onStartEdit(message.id, message.content)}
                    onDelete={() => onDelete(message.id)}
                  />
                </>
              )
            ) : (
              <>
                <div className="prose max-w-[72ch] text-[14px] leading-[1.75] text-[var(--ink-secondary)] dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {message.content}
                  </ReactMarkdown>
                </div>
                <MessageActions
                  role="assistant"
                  onRegenerate={() => onRegenerate(message.id)}
                  onDelete={() => onDelete(message.id)}
                />
              </>
            )}
          </div>
        </div>
      )}

      {message.parts
        ?.filter((p) => p.type === "tool-invocation")
        .map((part) => {
          if (part.type !== "tool-invocation") return null;
          return <ToolCard key={part.toolInvocation.toolCallId} invocation={part.toolInvocation} />;
        })}
    </div>
  );
}
