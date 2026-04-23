"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/design-system/components";
import { MessageActions } from "./message-actions";
import { EditBubble } from "./edit-bubble";
import { ToolCard } from "./tool-card";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@ai-sdk/react";

/* --- Markdown components for assistant messages --- */

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-[var(--border-subtle)] px-1.5 py-0.5 text-[var(--text-body-sm)]"
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

/* --- Props --- */

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
  return (
    <div className="group/msg relative mb-[var(--gap-message)]">
      {message.content && (
        <div className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
          {message.role === "user" ? (
            isEditing ? (
              <EditBubble
                content={editingContent}
                onChange={onEditContentChange}
                onSave={() => onSaveEdit(message.id)}
                onCancel={onCancelEdit}
              />
            ) : (
              <div className="max-w-[95%] sm:max-w-[85%]">
                <Card className="bg-[var(--surface-raised)] text-[var(--ink)]">
                  <CardContent className="px-4 py-2.5">
                    <div className="whitespace-pre-wrap break-words text-[var(--text-body)] leading-[var(--leading-relaxed)]">
                      {message.content}
                    </div>
                  </CardContent>
                </Card>
                <MessageActions
                  role="user"
                  onEdit={() => onStartEdit(message.id, message.content)}
                  onDelete={() => onDelete(message.id)}
                />
              </div>
            )
          ) : (
            <div className="max-w-[95%] sm:max-w-[85%]">
              <div className="prose prose-sm max-w-[72ch] text-[var(--text-body)] leading-[var(--leading-relaxed)] text-[var(--ink)] dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
              </div>
              <MessageActions
                role="assistant"
                onRegenerate={() => onRegenerate(message.id)}
                onDelete={() => onDelete(message.id)}
              />
            </div>
          )}
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
