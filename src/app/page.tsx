"use client";

import { useState } from "react";
import { AppProvider } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";

export default function Home() {
  const [modelId, setModelId] = useState("claude-sonnet");

  return (
    <AppProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <ChatPanel modelId={modelId} onModelChange={setModelId} />
      </div>
    </AppProvider>
  );
}
