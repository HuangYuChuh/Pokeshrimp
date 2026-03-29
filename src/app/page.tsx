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
      <main className="flex h-screen w-screen">
        <Sidebar modelId={modelId} onModelChange={setModelId} />
        <ChatPanel modelId={modelId} />
        <PreviewPanel />
      </main>
    </AppProvider>
  );
}
