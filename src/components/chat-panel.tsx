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
        // Check if any tool invocations produced image results
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

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
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
    <div className="flex min-w-0 flex-1 flex-col bg-[var(--bg-primary)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold">Pokeshrimp</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Describe what you want to create
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                {/* Text content */}
                {message.content && (
                  <div
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                )}

                {/* Tool invocations */}
                {message.parts
                  ?.filter((p) => p.type === "tool-invocation")
                  .map((part) => {
                    if (part.type !== "tool-invocation") return null;
                    const { toolInvocation } = part;
                    return (
                      <div
                        key={toolInvocation.toolCallId}
                        className="mt-2 flex justify-start"
                      >
                        <div className="max-w-[80%] rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <span className="font-mono">
                              {toolInvocation.toolName}
                            </span>
                            {toolInvocation.state === "result" ? (
                              <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-green-400">
                                done
                              </span>
                            ) : (
                              <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-yellow-400">
                                running...
                              </span>
                            )}
                          </div>
                          {toolInvocation.state === "result" &&
                            toolInvocation.result &&
                            typeof toolInvocation.result === "string" && (
                              <div className="mt-1.5 whitespace-pre-wrap text-[var(--text-secondary)]">
                                {toolInvocation.result.length > 200
                                  ? toolInvocation.result.slice(0, 200) + "..."
                                  : toolInvocation.result}
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  <span className="inline-block animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error.message || "Something went wrong. Check your API key configuration."}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border-color)] p-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or use /skill..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="self-end rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
