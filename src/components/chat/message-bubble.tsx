"use client";

import { cn } from "@/lib/utils";
import { Card } from "@heroui/react";
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
        <code className="rounded bg-muted px-1.5 py-0.5 text-[13px]" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="overflow-x-auto rounded-lg bg-surface p-4 text-[13px]">
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
    <div className="group/msg relative mb-6">
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
              <div className="relative max-w-[95%] sm:max-w-[85%]">
                <Card variant="secondary" className="bg-primary text-primary-foreground">
                  <Card.Content className="px-4 py-2.5">
                    <div className="whitespace-pre-wrap break-words text-[14px] leading-7">
                      {message.content}
                    </div>
                  </Card.Content>
                </Card>
                <MessageActions
                  role="user"
                  onEdit={() => onStartEdit(message.id, message.content)}
                  onDelete={() => onDelete(message.id)}
                />
              </div>
            )
          ) : (
            <div className="relative max-w-[95%] sm:max-w-[85%]">
              <div className="prose prose-sm max-w-none text-[14px] leading-7 text-foreground dark:prose-invert">
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
