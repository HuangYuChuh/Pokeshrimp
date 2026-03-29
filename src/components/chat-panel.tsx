"use client";

import { useState } from "react";

export function ChatPanel() {
  const [input, setInput] = useState("");

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[var(--bg-primary)]">
      {/* Chat messages area */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Pokeshrimp</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Describe what you want to create
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--border-color)] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or use /skill..."
            className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]"
          />
          <button className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
