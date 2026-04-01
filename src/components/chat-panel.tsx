"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useCallback, useState, type KeyboardEvent } from "react";
import { useAppDispatch } from "@/lib/store";

interface ChatPanelProps {
  modelId: string;
}

export function ChatPanel({ modelId }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useAppDispatch();

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

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        height: "100vh",
        background: "var(--bg-base)",
      }}
    >
      {/* Navbar spacer */}
      <div className="drag" style={{ height: "var(--navbar-height)", flexShrink: 0 }} />

      {/* Messages */}
      <div
        className="selectable"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 24px",
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                Pokeshrimp
              </h2>
              <p style={{ marginTop: 6, fontSize: 13, color: "var(--text-tertiary)" }}>
                Describe what you want to create
              </p>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 16 }}>
            {messages.map((message) => (
              <div key={message.id} style={{ marginBottom: 20 }}>
                {message.content && (
                  <div style={{
                    display: "flex",
                    justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "10px 16px",
                        borderRadius: 16,
                        fontSize: 14,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        ...(message.role === "user"
                          ? { background: "var(--accent)", color: "#fff" }
                          : { background: "var(--bg-elevated)", color: "var(--text-primary)" }),
                      }}
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
                        toolInvocation={part.toolInvocation}
                      />
                    );
                  })}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div style={{
                padding: "10px 16px",
                borderRadius: 16,
                background: "var(--bg-elevated)",
                display: "inline-block",
                fontSize: 13,
                color: "var(--text-tertiary)",
              }}>
                Thinking...
              </div>
            )}
            {error && (
              <div style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "0.5px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.06)",
                fontSize: 13,
                color: "#f87171",
              }}>
                {error.message || "Something went wrong"}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ flexShrink: 0, padding: "8px 24px 20px" }}>
        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: 640,
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="selectable"
            style={{
              flex: 1,
              resize: "none",
              padding: "10px 14px",
              border: "0.5px solid var(--border-default)",
              borderRadius: 12,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.5,
              outline: "none",
              transition: "border-color 150ms",
              fontFamily: "inherit",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--border-focus)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              flexShrink: 0,
              padding: "10px 16px",
              border: "none",
              borderRadius: 12,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "opacity 150ms",
              opacity: isLoading || !input.trim() ? 0.3 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Tool Invocation Card ─── */

interface ToolInvocationProps {
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    state: string;
    args?: unknown;
    result?: unknown;
  };
}

function ToolInvocationCard({ toolInvocation }: ToolInvocationProps) {
  const [expanded, setExpanded] = useState(false);
  const isDone = toolInvocation.state === "result";
  const hasArgs = !!(toolInvocation.args && Object.keys(toolInvocation.args as Record<string, unknown>).length > 0);
  const hasResult = !!(isDone && toolInvocation.result != null);

  const toolLabel = formatToolName(toolInvocation.toolName);
  const argsPreview = hasArgs ? formatArgsPreview(toolInvocation.args) : "";

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 10,
          border: "0.5px solid var(--border-subtle, rgba(255,255,255,0.07))",
          background: "var(--bg-sidebar, #111)",
          color: "var(--text-secondary, #a1a1aa)",
          fontSize: 12,
          cursor: "pointer",
          width: "auto",
          maxWidth: "85%",
          textAlign: "left",
          transition: "background 150ms",
        }}
      >
        {/* Status indicator */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isDone ? "#4ade80" : "#fbbf24",
            flexShrink: 0,
            animation: isDone ? "none" : "pulse 1.5s infinite",
          }}
        />

        {/* Tool name + preview */}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ fontWeight: 500, color: "var(--text-primary, #e4e4e7)" }}>{toolLabel}</span>
          {argsPreview && (
            <span style={{ marginLeft: 6, opacity: 0.6 }}>{argsPreview}</span>
          )}
        </span>

        {/* Expand chevron */}
        {(hasArgs || hasResult) && (
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round"
            style={{
              flexShrink: 0,
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (hasArgs || hasResult) && (
        <div
          style={{
            marginTop: 4,
            marginLeft: 12,
            padding: "10px 14px",
            borderRadius: 8,
            border: "0.5px solid var(--border-subtle, rgba(255,255,255,0.07))",
            background: "var(--bg-base, #09090b)",
            fontSize: 11,
            fontFamily: "monospace",
            lineHeight: 1.6,
            maxHeight: 300,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: "var(--text-secondary, #a1a1aa)",
          }}
          className="selectable"
        >
          {hasArgs && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary, #52525b)", marginBottom: 4, fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Input
              </div>
              <div style={{ marginBottom: hasResult ? 12 : 0 }}>
                {formatValue(toolInvocation.args)}
              </div>
            </>
          )}
          {hasResult && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary, #52525b)", marginBottom: 4, fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Result
              </div>
              <div>{formatValue(toolInvocation.result)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function formatToolName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatArgsPreview(args: unknown): string {
  if (!args || typeof args !== "object") return "";
  const entries = Object.entries(args as Record<string, unknown>);
  if (entries.length === 0) return "";
  const [key, val] = entries[0];
  const valStr = typeof val === "string" ? val : JSON.stringify(val);
  const truncated = valStr.length > 40 ? valStr.slice(0, 40) + "..." : valStr;
  return `${key}: ${truncated}`;
}

function formatValue(val: unknown): string {
  if (typeof val === "string") return val.length > 2000 ? val.slice(0, 2000) + "\n...(truncated)" : val;
  try {
    const str = JSON.stringify(val, null, 2);
    return str.length > 2000 ? str.slice(0, 2000) + "\n...(truncated)" : str;
  } catch {
    return String(val);
  }
}
