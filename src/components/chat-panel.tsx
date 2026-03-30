"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useCallback, type KeyboardEvent } from "react";
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
                    const { toolInvocation } = part;
                    return (
                      <div key={toolInvocation.toolCallId} style={{
                        marginTop: 8,
                        display: "flex",
                        justifyContent: "flex-start",
                      }}>
                        <div style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "0.5px solid var(--border-subtle)",
                          background: "var(--bg-sidebar)",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}>
                          <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                            {toolInvocation.toolName}
                          </span>
                          {" "}
                          {toolInvocation.state === "result" ? (
                            <span style={{ color: "#4ade80", fontSize: 11 }}>done</span>
                          ) : (
                            <span style={{ color: "#fbbf24", fontSize: 11 }}>running</span>
                          )}
                        </div>
                      </div>
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
