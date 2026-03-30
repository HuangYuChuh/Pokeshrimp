"use client";

import { useState } from "react";
import { AppProvider } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { PreviewPanel } from "@/components/preview-panel";

export default function Home() {
  const [modelId, setModelId] = useState("claude-sonnet");

  return (
    <AppProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: "var(--bg-base)",
        }}
      >
        <Sidebar modelId={modelId} onModelChange={setModelId} />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flex: 1,
            overflow: "hidden",
            borderTopLeftRadius: 10,
            borderLeft: "0.5px solid var(--border-subtle)",
            borderTop: "0.5px solid var(--border-subtle)",
          }}
        >
          <ChatPanel modelId={modelId} />
          <PreviewPanel />
        </div>
      </div>
    </AppProvider>
  );
}
