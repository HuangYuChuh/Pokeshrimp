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
import { PanelLeft, PanelRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODEL_OPTIONS } from "@/core/ai/provider";
import { MessageBubble } from "./message-bubble";
import { ApprovalCards } from "./approval-cards";
import { InputArea, type SkillInfo } from "./input-area";

/* ─── Skill data hook ─── */

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

/* ─── Props ─── */

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
  const { currentSessionId } = useAppState();
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

  /* ─── Auto-scroll ─── */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─── Textarea auto-resize ─── */

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [textareaRef]);

  useEffect(adjustHeight, [input, adjustHeight]);

  /* ─── Keyboard ─── */

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

  /* ─── Edit / Delete / Regenerate ─── */

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

  /* ─── Render ─── */

  const isEmpty = messages.length === 0 && !isLoading;

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
        <button
          type="button"
          onClick={onToggleSidebar}
          className={cn(
            "nodrag flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            sidebarOpen && "invisible"
          )}
          title="Toggle sidebar"
        >
          <PanelLeft size={16} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onTogglePreview}
          className={cn(
            "nodrag flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            previewOpen && "invisible"
          )}
          title="Toggle preview"
        >
          <PanelRight size={16} strokeWidth={1.5} />
        </button>
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
            </div>
          </div>
          {inputArea}
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="selectable mx-auto max-w-[680px] px-3 pb-6 pt-4 sm:px-6">
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
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                )}

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
                  {error.message || "Something went wrong"}
                </div>
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
