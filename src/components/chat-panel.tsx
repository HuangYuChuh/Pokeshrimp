"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useCallback, useState, useMemo, type KeyboardEvent } from "react";
import { useAppState, useAppDispatch, type OutputFile } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronDown as ChevronDownIcon, Pencil, Trash2, RefreshCw, PanelLeft, PanelRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp, ChevronDown } from "lucide-react";
import { MODEL_OPTIONS } from "@/core/ai/provider";
import { ApprovalCard, parseApprovalEvents } from "@/components/approval-card";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

/* ─── Markdown Components ─── */

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
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-[13px]">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  pre({ children }) {
    // Avoid double-wrapping: ReactMarkdown wraps code blocks in <pre><code>,
    // but our custom `code` already renders the <pre> for block code.
    return <>{children}</>;
  },
};

interface ChatPanelProps {
  modelId: string;
  onModelChange: (id: string) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  sidebarOpen: boolean;
  previewOpen: boolean;
  onToggleSidebar: () => void;
  onTogglePreview: () => void;
}

export function ChatPanel({ modelId, onModelChange, inputRef, sidebarOpen, previewOpen, onToggleSidebar, onTogglePreview }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? internalRef;
  const { currentSessionId } = useAppState();
  const dispatch = useAppDispatch();

  const currentModel = MODEL_OPTIONS.find((m) => m.id === modelId);

  const skills = useSkills();

  const { messages, setMessages, input, setInput, handleInputChange, handleSubmit, isLoading, error, data, reload } =
    useChat({
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

              // --- Preview (existing) ---
              const result = inv.result;
              if (result && typeof result === "object" && result.imageUrl) {
                dispatch({
                  type: "SET_PREVIEW_CONTENT",
                  content: { type: "image", url: result.imageUrl },
                });
                dispatch({ type: "SET_PREVIEW_TAB", tab: "preview" });
              }

              // --- Editor: show tool args ---
              if (inv.args && typeof inv.args === "object") {
                const args = inv.args as Record<string, unknown>;
                const editorText =
                  inv.toolName === "run_command" && typeof args.command === "string"
                    ? args.command
                    : JSON.stringify(args, null, 2);
                dispatch({ type: "SET_EDITOR_PARAMS", params: editorText });
              }

              // --- Output: detect file paths in result ---
              const resultStr = typeof result === "string" ? result : JSON.stringify(result ?? "");
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, []);

  useEffect(adjustHeight, [input, adjustHeight]);

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

  const handleSelectSkill = useCallback(
    (command: string) => {
      setInput(command + " ");
    },
    [setInput],
  );

  /* ─── Edit / Delete / Regenerate ─── */

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
      // Keep messages up to (not including) the edited one, then re-append with new content
      const before = messages.slice(0, idx);
      const edited = { ...messages[idx], content: trimmed };
      setMessages([...before, edited]);
      setEditingId(null);
      setEditingContent("");
      // Re-send from the edited message by reloading
      // reload() re-sends the last user message in the conversation
      // Since we just set messages ending with the edited user message, reload will work
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
        // Also delete the following assistant message if present
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
      // Remove this assistant message and everything after it
      setMessages(messages.slice(0, idx));
      // reload re-sends the last user message
      reload();
    },
    [messages, setMessages, reload],
  );

  const isEmpty = messages.length === 0 && !isLoading;

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
        /* Empty state: centered greeting + bottom input */
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center pb-32">
            <div className="text-center">
              <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
                What would you like to create?
              </h1>
              <p className="mt-3 text-[15px] text-muted-foreground">
                描述你想创作的内容，剩下的交给我
              </p>
            </div>
          </div>
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
            onSubmit={handleSubmit}
            onSelectSkill={handleSelectSkill}
          />
        </div>
      ) : (
        /* Conversation state: messages + bottom input */
        <>
          <ScrollArea className="flex-1">
            <div className="selectable mx-auto max-w-[680px] px-3 pt-4 pb-6 sm:px-6">
              {messages.map((message) => (
                <div key={message.id} className="group/msg relative mb-6">
                  {message.content && (
                    <div
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "user" ? (
editingId === message.id ? (
                          <EditBubble
                            content={editingContent}
                            onChange={setEditingContent}
                            onSave={() => handleSaveEdit(message.id)}
                            onCancel={handleCancelEdit}
                          />
                        ) : (
                          <div className="relative max-w-[95%] sm:max-w-[85%]">
                            <div className="whitespace-pre-wrap break-words rounded-2xl bg-primary px-4 py-2.5 text-[14px] leading-7 text-primary-foreground">
                              {message.content}
                            </div>
                            <MessageActions
                              role="user"
                              onEdit={() => handleStartEdit(message.id, message.content)}
                              onDelete={() => handleDelete(message.id)}
                            />
                          </div>
                        )
                      ) : (
                        <div className="relative max-w-[95%] sm:max-w-[85%]">
                          <div className="prose prose-sm dark:prose-invert max-w-none text-[14px] leading-7 text-foreground">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          <MessageActions
                            role="assistant"
                            onRegenerate={() => handleRegenerate(message.id)}
                            onDelete={() => handleDelete(message.id)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {message.parts
                    ?.filter((p) => p.type === "tool-invocation")
                    .map((part) => {
                      if (part.type !== "tool-invocation") return null;
                      return (
                        <ToolInvocationCard
                          key={part.toolInvocation.toolCallId}
                          invocation={part.toolInvocation}
                        />
                      );
                    })}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
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
            onSubmit={handleSubmit}
            onSelectSkill={handleSelectSkill}
          />
        </>
      )}
    </div>
  );
}

/* ─── Skill Data ─── */

interface SkillInfo {
  name: string;
  command: string;
  description: string;
}

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

/* ─── Approval Cards ─── */

function ApprovalCards({ data }: { data: unknown[] }) {
  const { requests, resolved } = useMemo(
    () => parseApprovalEvents(data),
    [data],
  );

  if (requests.size === 0) return null;

  return (
    <>
      {[...requests.values()].map((req) => (
        <ApprovalCard
          key={req.id}
          request={req}
          resolved={resolved.get(req.id)}
        />
      ))}
    </>
  );
}

/* ─── Message Actions ─── */

function MessageActions({
  role,
  onEdit,
  onDelete,
  onRegenerate,
}: {
  role: "user" | "assistant";
  onEdit?: () => void;
  onDelete: () => void;
  onRegenerate?: () => void;
}) {
  return (
    <div
      className={cn(
        "absolute -top-3 flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-sm opacity-0 transition-opacity group-hover/msg:opacity-100",
        role === "user" ? "right-0" : "left-0"
      )}
    >
      {role === "user" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Edit"
        >
          <Pencil size={13} />
        </button>
      )}
      {role === "assistant" && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Regenerate"
        >
          <RefreshCw size={13} />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Delete"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

/* ─── Edit Bubble ─── */

function EditBubble({
  content,
  onChange,
  onSave,
  onCancel,
}: {
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = editRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 300) + "px";
      el.focus();
    }
  }, [content]);

  return (
    <div className="max-w-[85%] w-full">
      <textarea
        ref={editRef}
        value={content}
        onChange={(e) => {
          onChange(e.target.value);
          const el = e.target;
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 300) + "px";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSave();
          }
          if (e.key === "Escape") {
            onCancel();
          }
        }}
        className="block w-full resize-none rounded-2xl border border-border bg-card px-4 py-2.5 text-[14px] leading-7 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        rows={1}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Save
        </button>
      </div>
    </div>
  );
}

/* ─── Input Area ─── */

import { forwardRef } from "react";
import { Slash } from "lucide-react";

interface InputAreaProps {
  input: string;
  isLoading: boolean;
  modelLabel: string;
  modelId: string;
  skills: SkillInfo[];
  onModelChange: (id: string) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onSelectSkill: (command: string) => void;
}

const InputArea = forwardRef<HTMLTextAreaElement, InputAreaProps>(
  function InputArea(
    { input, isLoading, modelLabel, modelId, skills, onModelChange, onChange, onKeyDown, onSubmit, onSelectSkill },
    ref
  ) {
    // Show skill menu when input starts with "/" (no space yet)
    const slashQuery = input.startsWith("/") && !input.includes(" ") ? input.slice(1).toLowerCase() : null;
    const filteredSkills = slashQuery !== null
      ? skills.filter((s) =>
          s.command.toLowerCase().includes(slashQuery) ||
          s.name.toLowerCase().includes(slashQuery)
        )
      : [];
    const isSlashMode = slashQuery !== null && filteredSkills.length > 0;

    return (
      <div className="shrink-0 px-3 pb-4 sm:px-6 sm:pb-6">
        <form onSubmit={onSubmit} className="relative mx-auto max-w-[680px]">
          {/* Slash command popup */}
          {isSlashMode && (
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-border bg-popover p-1 shadow-lg">
              {filteredSkills.map((skill) => (
                <button
                  key={skill.command}
                  type="button"
                  className="nodrag flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                  onClick={() => {
                    onSelectSkill(skill.command);
                  }}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                    <Slash size={11} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{skill.command}</div>
                    <div className="truncate text-[12px] text-muted-foreground">{skill.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <textarea
              ref={ref}
              value={input}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder="描述你的需求，输入 / 查看可用技能..."
              rows={1}
              disabled={isLoading}
              className="selectable nodrag block w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[14px] leading-6 text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div />
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger className="nodrag flex h-7 items-center gap-1 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none">
                    {modelLabel}
                    <ChevronDown size={12} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8}>
                    <DropdownMenuRadioGroup value={modelId} onValueChange={onModelChange}>
                      {MODEL_OPTIONS.map((m) => (
                        <DropdownMenuRadioItem key={m.id} value={m.id} className="text-[13px]">
                          {m.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="nodrag flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-20"
                >
                  <ArrowUp size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
);

/* ─── Tool Invocation Card ─── */

function ToolInvocationCard({ invocation }: { invocation: { toolCallId: string; toolName: string; state: string; args?: unknown; result?: unknown } }) {
  const [expanded, setExpanded] = useState(false);
  const isDone = invocation.state === "result";
  const hasArgs = !!(invocation.args && typeof invocation.args === "object" && Object.keys(invocation.args as Record<string, unknown>).length > 0);
  const hasResult = !!(isDone && invocation.result != null);
  const canExpand = hasArgs || hasResult;

  const label = invocation.toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mt-2">
      <button
        onClick={() => canExpand && setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[12px] text-muted-foreground transition-colors",
          canExpand && "cursor-pointer hover:bg-muted"
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", isDone ? "bg-green-400" : "bg-yellow-400 animate-pulse")} />
        <span className="font-medium text-foreground">{label}</span>
        {hasArgs && (
          <span className="truncate max-w-[200px] opacity-50">
            {(() => {
              const entries = Object.entries(invocation.args as Record<string, unknown>);
              if (!entries.length) return "";
              const [k, v] = entries[0];
              const s = typeof v === "string" ? v : JSON.stringify(v);
              return `${k}: ${s.length > 30 ? s.slice(0, 30) + "..." : s}`;
            })()}
          </span>
        )}
        {canExpand && (
          <ChevronDownIcon size={12} className={cn("ml-auto shrink-0 transition-transform", expanded && "rotate-180")} />
        )}
      </button>

      {expanded && (
        <div className="selectable mt-1 ml-3 max-h-[300px] overflow-y-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {hasArgs && (
            <>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Input</div>
              <pre className="mb-3 whitespace-pre-wrap break-all">{formatVal(invocation.args)}</pre>
            </>
          )}
          {hasResult && (
            <>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Result</div>
              <pre className="whitespace-pre-wrap break-all">{formatVal(invocation.result)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function formatVal(v: unknown): string {
  if (typeof v === "string") return v.length > 2000 ? v.slice(0, 2000) + "\n...(truncated)" : v;
  try {
    const s = JSON.stringify(v, null, 2);
    return s.length > 2000 ? s.slice(0, 2000) + "\n...(truncated)" : s;
  } catch {
    return String(v);
  }
}
