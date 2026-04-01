"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useCallback, useState, type KeyboardEvent } from "react";
import { useAppDispatch } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronDown as ChevronDownIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp, ChevronDown } from "lucide-react";
import { MODEL_OPTIONS } from "./model-options";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

interface ChatPanelProps {
  modelId: string;
  onModelChange: (id: string) => void;
}

export function ChatPanel({ modelId, onModelChange }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useAppDispatch();

  const currentModel = MODEL_OPTIONS.find((m) => m.id === modelId);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      body: { modelId },
      onFinish(message) {
        if (message.parts) {
          for (const part of message.parts) {
            if (
              part.type === "tool-invocation" &&
              part.toolInvocation.state === "result"
            ) {
              const result = part.toolInvocation.result;
              if (result && typeof result === "object" && result.imageUrl) {
                dispatch({
                  type: "SET_PREVIEW_CONTENT",
                  content: { type: "image", url: result.imageUrl },
                });
                dispatch({ type: "SET_PREVIEW_TAB", tab: "preview" });
              }
            }
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

  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      {/* Drag region */}
      <div className="drag h-13 shrink-0" />

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
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSubmit={handleSubmit}
          />
        </div>
      ) : (
        /* Conversation state: messages + bottom input */
        <>
          <ScrollArea className="flex-1">
            <div className="selectable mx-auto max-w-[680px] px-6 pt-4 pb-6">
              {messages.map((message) => (
                <div key={message.id} className="mb-6">
                  {message.content && (
                    <div
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap break-words text-[14px] leading-7",
                          message.role === "user"
                            ? "rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground"
                            : "text-foreground"
                        )}
                      >
                        {message.content}
                      </div>
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
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
}

/* ─── Input Area ─── */

import { forwardRef } from "react";

interface InputAreaProps {
  input: string;
  isLoading: boolean;
  modelLabel: string;
  modelId: string;
  onModelChange: (id: string) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const InputArea = forwardRef<HTMLTextAreaElement, InputAreaProps>(
  function InputArea(
    { input, isLoading, modelLabel, modelId, onModelChange, onChange, onKeyDown, onSubmit },
    ref
  ) {
    return (
      <div className="shrink-0 px-6 pb-6">
        <form onSubmit={onSubmit} className="mx-auto max-w-[680px]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <textarea
              ref={ref}
              value={input}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder="描述你的需求..."
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
