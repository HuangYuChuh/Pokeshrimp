"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useCallback, useState, type KeyboardEvent } from "react";
import { useAppState, useAppDispatch, type OutputFile } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Skeleton,
  ScrollArea,
} from "@/design-system/components";
import { MessageBubble } from "./message-bubble";
import { ApprovalCards } from "./approval-cards";
import { InputArea, type SkillInfo } from "./input-area";

/* --- Example prompts for empty state --- */

const EXAMPLE_PROMPTS = [
  "\u5E2E\u6211\u6279\u91CF\u53BB\u9664\u4EA7\u54C1\u56FE\u80CC\u666F",
  "\u8BBE\u8BA1\u4E00\u5957\u5B8C\u6574\u7684\u54C1\u724C VI",
  "\u7528 ComfyUI \u751F\u6210\u8D5B\u535A\u98CE\u683C\u5934\u50CF",
];

/* --- Session summary hook --- */

interface SessionSummary {
  summary: string;
  messageCount: number;
  lastActiveAt: string;
}

function useSessionSummary(sessionId: string | null, hasMessages: boolean) {
  const [data, setData] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId || hasMessages) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/sessions/${sessionId}/summary`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.summary) {
          setData(d);
        } else if (!cancelled) {
          setData(null);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, hasMessages]);

  return { summary: data, loading };
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* --- Skill data hook --- */

function useSkills() {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  useEffect(() => {
    fetch("/api/skills")
      .then((r) => (r.ok ? r.json() : { skills: [] }))
      .then((d) => setSkills(d.skills ?? []))
      .catch(() => {});
  }, []);
  return skills;
}

/* --- Props --- */

interface ChatPanelProps {
  modelId: string;
  onModelChange: (id: string) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  sidebarOpen: boolean;
  previewOpen: boolean;
  onToggleSidebar: () => void;
  onTogglePreview: () => void;
}

export function ChatPanel({
  modelId,
  onModelChange,
  inputRef,
  sidebarOpen,
  previewOpen,
  onToggleSidebar,
  onTogglePreview,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? internalRef;
  const { currentSessionId, rerunRequested } = useAppState();
  const dispatch = useAppDispatch();

  const skills = useSkills();

  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    data,
    reload,
  } = useChat({
    api: "/api/chat",
    body: { modelId, sessionId: currentSessionId },
    onResponse(response) {
      const sid = response.headers.get("X-Session-Id");
      if (sid && sid !== currentSessionId) {
        dispatch({ type: "SET_CURRENT_SESSION", id: sid });
      }
    },
    onFinish(message) {
      if (message.parts) {
        const collectedFiles: OutputFile[] = [];

        for (const part of message.parts) {
          if (part.type === "tool-invocation" && part.toolInvocation.state === "result") {
            const inv = part.toolInvocation;

            const result = inv.result;
            if (result && typeof result === "object" && result.imageUrl) {
              dispatch({
                type: "SET_PREVIEW_CONTENT",
                content: { type: "image", url: result.imageUrl },
              });
              dispatch({ type: "SET_PREVIEW_TAB", tab: "preview" });
            }

            if (inv.args && typeof inv.args === "object") {
              const args = inv.args as Record<string, unknown>;
              const editorText =
                inv.toolName === "run_command" && typeof args.command === "string"
                  ? args.command
                  : JSON.stringify(args, null, 2);
              dispatch({ type: "SET_EDITOR_PARAMS", params: editorText });
            }

            const resultStr = typeof result === "string" ? result : JSON.stringify(result ?? "");
            const fileMatches = resultStr.match(
              /(?:^|[\s"'=])(\/?(?:[\w./-]+\/)?[\w.-]+\.(?:png|jpe?g|gif|webp|svg|bmp|tiff?|mp4|mov|avi|mkv|webm))\b/gi,
            );
            if (fileMatches) {
              for (const raw of fileMatches) {
                const fp = raw.trim().replace(/^["'=]/, "");
                const name = fp.split("/").pop() ?? fp;
                const ext = name.split(".").pop()?.toLowerCase() ?? "";
                collectedFiles.push({ name, path: fp, type: ext });
              }
            }
          }
        }

        if (collectedFiles.length > 0) {
          dispatch({ type: "SET_OUTPUT_FILES", files: collectedFiles });
        }
      }
    },
  });

  /* --- Auto-scroll --- */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* --- Re-run from preview panel --- */

  useEffect(() => {
    if (rerunRequested) {
      dispatch({ type: "CLEAR_RERUN" });
      append({ role: "user", content: "Re-run the last command with the same parameters" });
    }
  }, [rerunRequested, dispatch, append]);

  /* --- Textarea auto-resize --- */

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [textareaRef]);

  useEffect(adjustHeight, [input, adjustHeight]);

  /* --- Keyboard --- */

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
        }
      }
    },
    [input, isLoading, handleSubmit],
  );

  const handleSubmitWithAttachments = useCallback(
    (e: React.FormEvent<HTMLFormElement>, options?: { experimental_attachments?: FileList }) => {
      handleSubmit(e, options);
    },
    [handleSubmit],
  );

  const handleSelectSkill = useCallback(
    (command: string) => {
      setInput(command + " ");
    },
    [setInput],
  );

  /* --- Edit / Delete / Regenerate --- */

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const handleStartEdit = useCallback((messageId: string, content: string) => {
    setEditingId(messageId);
    setEditingContent(content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingContent("");
  }, []);

  const handleSaveEdit = useCallback(
    (messageId: string) => {
      const trimmed = editingContent.trim();
      if (!trimmed) return;
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      const before = messages.slice(0, idx);
      const edited = { ...messages[idx], content: trimmed };
      setMessages([...before, edited]);
      setEditingId(null);
      setEditingContent("");
      reload();
    },
    [editingContent, messages, setMessages, reload],
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      const msg = messages[idx];
      if (msg.role === "user") {
        const next = messages[idx + 1];
        const removeIds = new Set([messageId]);
        if (next && next.role === "assistant") removeIds.add(next.id);
        setMessages(messages.filter((m) => !removeIds.has(m.id)));
      } else {
        setMessages(messages.filter((m) => m.id !== messageId));
      }
    },
    [messages, setMessages],
  );

  const handleRegenerate = useCallback(
    (messageId: string) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      setMessages(messages.slice(0, idx));
      reload();
    },
    [messages, setMessages, reload],
  );

  /* --- Session summary --- */

  const { summary: sessionSummary } = useSessionSummary(currentSessionId, messages.length > 0);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);

  const prevMessageCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessageCount.current && prevMessageCount.current === 0) {
      setSummaryCollapsed(true);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    setSummaryCollapsed(false);
  }, [currentSessionId]);

  /* --- Example prompt click --- */

  const handleExampleClick = useCallback(
    (prompt: string) => {
      setInput(prompt);
      textareaRef.current?.focus();
    },
    [setInput, textareaRef],
  );

  /* --- Render --- */

  const isEmpty = messages.length === 0 && !isLoading && !sessionSummary;

  const inputArea = (
    <InputArea
      ref={textareaRef}
      input={input}
      isLoading={isLoading}
      modelId={modelId}
      onModelChange={onModelChange}
      skills={skills}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onSubmit={handleSubmitWithAttachments}
      onSelectSkill={handleSelectSkill}
    />
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[var(--canvas)]">
      {/* Drag region with toggle buttons */}
      <div className="drag flex h-[var(--height-titlebar)] shrink-0 items-center justify-between px-[var(--space-3)]">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          className={cn("nodrag", sidebarOpen && "invisible")}
          aria-label="Toggle sidebar"
        >
          <Icon icon="solar:sidebar-minimalistic-outline" width={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onTogglePreview}
          className={cn("nodrag", previewOpen && "invisible")}
          aria-label="Toggle preview"
        >
          <Icon icon="solar:sidebar-minimalistic-outline" width={16} className="scale-x-[-1]" />
        </Button>
      </div>

      {/* Content area */}
      {isEmpty ? (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center pb-32">
            <div className="text-center">
              <h1
                className="text-[var(--text-display)] font-light tracking-[var(--tracking-tight)] text-[var(--ink)]"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                What would you like to create?
              </h1>
              <p className="mt-[var(--space-3)] text-[var(--text-title)] text-[var(--ink-secondary)]">
                Describe what you want to create, and leave the rest to me
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-[var(--gap-inline)]">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <Chip
                    key={prompt}
                    size="md"
                    className="cursor-pointer transition-colors hover:bg-[var(--border-subtle)]"
                    onClick={() => handleExampleClick(prompt)}
                  >
                    {prompt}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          {inputArea}
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="selectable mx-auto max-w-[var(--width-chat)] px-[var(--space-3)] pb-[var(--space-6)] pt-[var(--space-4)] sm:px-6">
              {/* Session summary card */}
              {sessionSummary && !summaryCollapsed && (
                <Card className="mb-[var(--gap-message)]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-[var(--gap-inline)] text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
                      <Icon icon="solar:clipboard-list-outline" width={15} />
                      Session Summary
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSummaryCollapsed(true)}
                      className="h-6 min-w-0 gap-1 px-2 text-[var(--text-caption)]"
                    >
                      Collapse
                      <Icon icon="solar:alt-arrow-up-outline" width={12} />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                      {sessionSummary.messageCount} messages
                      {sessionSummary.lastActiveAt &&
                        ` \u00B7 Last active ${formatRelativeTime(sessionSummary.lastActiveAt)}`}
                    </p>
                    <div className="mt-2 space-y-1 text-[var(--text-body-sm)] leading-relaxed text-[var(--ink-secondary)]">
                      {sessionSummary.summary.split("\n").map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Collapsed summary */}
              {sessionSummary && summaryCollapsed && (
                <div className="mb-4 flex justify-center">
                  <Chip
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setSummaryCollapsed(false)}
                  >
                    <Icon icon="solar:clipboard-list-outline" width={12} />
                    {sessionSummary.messageCount} messages
                    {sessionSummary.lastActiveAt &&
                      ` \u00B7 ${formatRelativeTime(sessionSummary.lastActiveAt)}`}
                  </Chip>
                </div>
              )}

              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isEditing={editingId === message.id}
                  editingContent={editingContent}
                  onEditContentChange={setEditingContent}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onDelete={handleDelete}
                  onRegenerate={handleRegenerate}
                />
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex flex-col gap-2.5 py-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}

              {error && (
                <Card className="border-[var(--error)] bg-[var(--error-subtle)]">
                  <CardContent className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-body-sm)] text-[var(--error)]">
                    {error.message || "Something went wrong"}
                  </CardContent>
                </Card>
              )}

              <ApprovalCards data={data ?? []} />

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          {inputArea}
        </>
      )}
    </div>
  );
}
