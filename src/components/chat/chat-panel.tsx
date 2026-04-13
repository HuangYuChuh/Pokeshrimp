"use client";

import { useChat } from "@ai-sdk/react";
import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type KeyboardEvent,
} from "react";
import { useAppState, useAppDispatch, type OutputFile } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PanelLeft, PanelRight, ClipboardList, ChevronUp } from "lucide-react";
import { Button, Card, Chip, Skeleton, ScrollShadow } from "@heroui/react";
import { MODEL_OPTIONS } from "@/core/ai/provider";
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
    // Only fetch summary when we have a session but no local messages yet
    // (i.e. user just reopened an old session)
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

  const currentModel = MODEL_OPTIONS.find((m) => m.id === modelId);
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
          if (
            part.type === "tool-invocation" &&
            part.toolInvocation.state === "result"
          ) {
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
                inv.toolName === "run_command" &&
                typeof args.command === "string"
                  ? args.command
                  : JSON.stringify(args, null, 2);
              dispatch({ type: "SET_EDITOR_PARAMS", params: editorText });
            }

            const resultStr =
              typeof result === "string"
                ? result
                : JSON.stringify(result ?? "");
            const fileMatches = resultStr.match(
              /(?:^|[\s"'=])(\/?(?:[\w./-]+\/)?[\w.-]+\.(?:png|jpe?g|gif|webp|svg|bmp|tiff?|mp4|mov|avi|mkv|webm))\b/gi
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
    [input, isLoading, handleSubmit]
  );

  const handleSubmitWithAttachments = useCallback(
    (
      e: React.FormEvent<HTMLFormElement>,
      options?: { experimental_attachments?: FileList }
    ) => {
      handleSubmit(e, options);
    },
    [handleSubmit]
  );

  const handleSelectSkill = useCallback(
    (command: string) => {
      setInput(command + " ");
    },
    [setInput]
  );

  /* --- Edit / Delete / Regenerate --- */

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const handleStartEdit = useCallback(
    (messageId: string, content: string) => {
      setEditingId(messageId);
      setEditingContent(content);
    },
    []
  );

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
    [editingContent, messages, setMessages, reload]
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
    [messages, setMessages]
  );

  const handleRegenerate = useCallback(
    (messageId: string) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      setMessages(messages.slice(0, idx));
      reload();
    },
    [messages, setMessages, reload]
  );

  /* --- Session summary --- */

  const { summary: sessionSummary } = useSessionSummary(
    currentSessionId,
    messages.length > 0,
  );
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);

  // Auto-collapse summary when user sends a new message
  const prevMessageCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessageCount.current && prevMessageCount.current === 0) {
      setSummaryCollapsed(true);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Reset collapsed state when session changes
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
      modelLabel={currentModel?.label ?? "Model"}
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
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      {/* Drag region with toggle buttons */}
      <div className="drag flex h-13 shrink-0 items-center justify-between px-3">
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={onToggleSidebar}
          className={cn(
            "nodrag h-7 w-7 min-w-0",
            sidebarOpen && "invisible"
          )}
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={16} strokeWidth={1.5} />
        </Button>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={onTogglePreview}
          className={cn(
            "nodrag h-7 w-7 min-w-0",
            previewOpen && "invisible"
          )}
          aria-label="Toggle preview"
        >
          <PanelRight size={16} strokeWidth={1.5} />
        </Button>
      </div>

      {/* Content area */}
      {isEmpty ? (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center pb-32">
            <div className="text-center">
              <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
                What would you like to create?
              </h1>
              <p className="mt-3 text-[15px] text-muted-foreground">
                Describe what you want to create, and leave the rest to me
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <Chip
                    key={prompt}
                    variant="secondary"
                    size="md"
                    className="cursor-pointer transition-colors hover:bg-muted"
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
          <ScrollShadow className="flex-1 overflow-y-auto">
            <div className="selectable mx-auto max-w-[680px] px-3 pb-6 pt-4 sm:px-6">
              {/* Session summary card */}
              {sessionSummary && !summaryCollapsed && (
                <Card variant="secondary" className="mb-6">
                  <Card.Header className="flex flex-row items-center justify-between px-4 pb-0 pt-3">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <ClipboardList size={15} strokeWidth={1.5} />
                      Session Summary
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setSummaryCollapsed(true)}
                      className="h-6 min-w-0 gap-1 px-2 text-[12px]"
                    >
                      Collapse
                      <ChevronUp size={12} strokeWidth={1.5} />
                    </Button>
                  </Card.Header>
                  <Card.Content className="px-4 pb-3 pt-1">
                    <Card.Description className="text-[12px]">
                      {sessionSummary.messageCount} messages
                      {sessionSummary.lastActiveAt &&
                        ` \u00B7 Last active ${formatRelativeTime(sessionSummary.lastActiveAt)}`}
                    </Card.Description>
                    <div className="mt-2 space-y-1 text-[13px] leading-relaxed text-muted-foreground">
                      {sessionSummary.summary.split("\n").map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </Card.Content>
                </Card>
              )}

              {/* Collapsed summary — minimal inline hint */}
              {sessionSummary && summaryCollapsed && (
                <div className="mb-4 flex justify-center">
                  <Chip
                    variant="secondary"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setSummaryCollapsed(false)}
                  >
                    <ClipboardList size={12} strokeWidth={1.5} />
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

              {isLoading &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex flex-col gap-2.5 py-2">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </div>
                )}

              {error && (
                <Card variant="default" className="border-destructive/20 bg-destructive/5">
                  <Card.Content className="px-4 py-3 text-[13px] text-destructive">
                    {error.message || "Something went wrong"}
                  </Card.Content>
                </Card>
              )}

              <ApprovalCards data={data ?? []} />

              <div ref={messagesEndRef} />
            </div>
          </ScrollShadow>
          {inputArea}
        </>
      )}
    </div>
  );
}
